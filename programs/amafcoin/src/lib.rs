use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

const MAX_QUESTION_LENGTH: usize = 200;
const MAX_DESCRIPTION_LENGTH: usize = 500;

declare_id!("Gh8YHDTXiRY8ZA3zkxSsrUb1az7Vxc4z9SH9U6LvoMW");

#[program]
pub mod amafcoin {
    use super::*;

    pub fn initialize_mint(_ctx: Context<InitializeMint>) -> Result<()> {
        Ok(())
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_index: u16,
        question: String,
        description: String,
    ) -> Result<()> {
        require!(
            question.len() <= MAX_QUESTION_LENGTH,
            CustomError::QuestionTooLong
        );
        require!(
            description.len() <= MAX_DESCRIPTION_LENGTH,
            CustomError::DescriptionTooLong
        );

        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.market_index = market_index;
        market.bump = ctx.bumps.market;
        market.question = question;
        market.description = description;
        market.resolved = false;
        market.outcome = None;
        market.total_yes = 0;
        market.total_no = 0;

        // Initialize or update the user markets counter
        let counter = &mut ctx.accounts.user_markets_counter;
        if counter.authority == Pubkey::default() {
            // First time initialization
            counter.authority = ctx.accounts.authority.key();
            counter.count = 1;
        } else {
            // Increment existing counter
            counter.count += 1;
        }

        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64, side_yes: bool) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, CustomError::MarketResolved);

        let bet = &mut ctx.accounts.bet;
        bet.market = market.key();
        bet.user = ctx.accounts.user.key();
        bet.amount = amount;
        bet.side_yes = side_yes;
        bet.claimed = false;

        if side_yes {
            market.total_yes += amount;
        } else {
            market.total_no += amount;
        }

        token::transfer(ctx.accounts.transfer_to_escrow(), amount)?;

        Ok(())
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, outcome_yes: bool) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, CustomError::MarketResolved);

        market.resolved = true;
        market.outcome = Some(outcome_yes);
        Ok(())
    }

    pub fn cancel_market(ctx: Context<ResolveMarket>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, CustomError::MarketResolved);

        market.resolved = true;
        market.outcome = None;
        Ok(())
    }

    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        let market = &ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;

        require!(market.resolved, CustomError::MarketNotResolved);
        require!(!bet.claimed, CustomError::AlreadyClaimed);

        let payout = match market.outcome {
            None => bet.amount,
            Some(outcome_yes) => {
                if bet.side_yes != outcome_yes {
                    return err!(CustomError::NotWinner);
                }

                let total_pool = market.total_yes + market.total_no;
                let winner_pool = if outcome_yes {
                    market.total_yes
                } else {
                    market.total_no
                };

                bet.amount.checked_mul(total_pool).unwrap() / winner_pool
            }
        };

        bet.claimed = true;

        // Create CPI accounts for transfer from escrow to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        };

        // Get the bump for the market PDA
        let bump = ctx.bumps.market;

        // Create signer seeds for the market PDA
        let market_index_bytes = ctx.accounts.market.market_index.to_le_bytes();
        let seeds = &[
            &b"market"[..],
            ctx.accounts.market.authority.as_ref(),
            &market_index_bytes[..],
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Create CPI context with signer
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        token::transfer(cpi_ctx, payout)?;

        Ok(())
    }

    pub fn claim_daily_amaf(ctx: Context<ClaimDaily>) -> Result<()> {
        let state = &mut ctx.accounts.claim_state;
        let now = Clock::get()?.unix_timestamp;

        require!(now - state.last_claim >= 86_400, CustomError::ClaimTooSoon);

        state.last_claim = now;

        // Create CPI accounts for mint_to
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.program_authority.to_account_info(),
        };

        // Get the bump for the program_authority PDA
        let bump = ctx.bumps.program_authority;

        // Create signer seeds for the program_authority PDA
        let seeds = &[&b"authority"[..], &[bump]];
        let signer_seeds = &[&seeds[..]];

        // Create CPI context with signer
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        token::mint_to(cpi_ctx, 100_000_000_000)?;

        Ok(())
    }
}

#[account]
pub struct Market {
    pub authority: Pubkey,
    pub market_index: u16,
    pub bump: u8,
    pub question: String,
    pub description: String,
    pub resolved: bool,
    pub outcome: Option<bool>,
    pub total_yes: u64,
    pub total_no: u64,
}

#[account]
pub struct Bet {
    pub market: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub side_yes: bool,
    pub claimed: bool,
}

#[account]
pub struct DailyClaimState {
    pub user: Pubkey,
    pub last_claim: i64,
}

#[account]
pub struct UserMarketsCounter {
    pub authority: Pubkey,
    pub count: u16,
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = program_authority,
        mint::freeze_authority = program_authority,
        seeds = [b"mint"],
        bump
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: Program authority PDA, no checks needed
    #[account(
        seeds = [&b"authority"[..]],
        bump
    )]
    pub program_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(market_index: u16)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 2 + 1 + 4 + MAX_QUESTION_LENGTH + 4 + MAX_DESCRIPTION_LENGTH + 1 + 1 + 8 + 8,
        seeds = [&b"market"[..], authority.key().as_ref(), &market_index.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 32 + 2,
        seeds = [&b"user_markets"[..], authority.key().as_ref()],
        bump
    )]
    pub user_markets_counter: Account<'info, UserMarketsCounter>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = user,
        space = 8 + 64,
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        constraint = user_token.mint == mint.key() @ CustomError::InvalidMint,
        constraint = user_token.owner == user.key() @ CustomError::InvalidOwner
    )]
    pub user_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = escrow_token.mint == mint.key() @ CustomError::InvalidMint,
        constraint = escrow_token.owner == market.key() @ CustomError::InvalidOwner
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut, has_one = authority)]
    pub market: Account<'info, Market>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(
        mut,
        seeds = [&b"market"[..], market.authority.as_ref(), &market.market_index.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(mut, has_one = user)]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        constraint = user_token.mint == mint.key() @ CustomError::InvalidMint,
        constraint = user_token.owner == user.key() @ CustomError::InvalidOwner
    )]
    pub user_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = escrow_token.mint == mint.key() @ CustomError::InvalidMint,
        constraint = escrow_token.owner == market.key() @ CustomError::InvalidOwner
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimDaily<'info> {
    #[account(
        mut,
        seeds = [b"mint"],
        bump
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: Program authority PDA used for minting tokens
    #[account(
        mut,
        seeds = [&b"authority"[..]],
        bump
    )]
    pub program_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = user_token.mint == mint.key() @ CustomError::InvalidMint,
        constraint = user_token.owner == user.key() @ CustomError::InvalidOwner
    )]
    pub user_token: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 40,
        seeds = [b"claim", user.key().as_ref()],
        bump
    )]
    pub claim_state: Account<'info, DailyClaimState>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> PlaceBet<'info> {
    pub fn transfer_to_escrow(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_token.to_account_info(),
            to: self.escrow_token.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

impl<'info> ClaimPayout<'info> {
    pub fn transfer_to_user(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.escrow_token.to_account_info(),
            to: self.user_token.to_account_info(),
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

impl<'info> ClaimDaily<'info> {
    pub fn mint_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.mint.to_account_info(),
            to: self.user_token.to_account_info(),
            authority: self.program_authority.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[error_code]
pub enum CustomError {
    #[msg("Market already resolved")]
    MarketResolved,
    #[msg("Market not resolved")]
    MarketNotResolved,
    #[msg("Bet already claimed")]
    AlreadyClaimed,
    #[msg("Not a winning bet")]
    NotWinner,
    #[msg("You have already claimed AMAF tokens within the last 24 hours. Please wait before claiming again.")]
    ClaimTooSoon,
    #[msg("Question too long")]
    QuestionTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("Invalid mint")]
    InvalidMint,
    #[msg("Invalid owner")]
    InvalidOwner,
}
