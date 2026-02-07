use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

const MAX_QUESTION_LENGTH: usize = 200;
const MAX_DESCRIPTION_LENGTH: usize = 500;
const MAX_OPTIONS: usize = 16;
const MAX_OPTION_NAME_LENGTH: usize = 50;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum MarketType {
    Binary,
    MultiOption,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Outcome {
    Unresolved,
    Cancelled,
    OptionWinner(u8),
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct OptionData {
    pub shares: u64,
    pub name: String,
    pub active: bool,
}

declare_id!("DGnE4VRytTjTfghAdvUosZoF7bDYetXSEX6WeYF2LeUe");

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
        options: Vec<String>,
    ) -> Result<()> {
        require!(
            question.len() <= MAX_QUESTION_LENGTH,
            CustomError::QuestionTooLong
        );
        require!(
            description.len() <= MAX_DESCRIPTION_LENGTH,
            CustomError::DescriptionTooLong
        );

        let num_options = options.len() as u8;
        require!(
            num_options >= 2 && num_options <= 16,
            CustomError::InvalidOptionCount
        );

        let market_type = if num_options == 2 {
            MarketType::Binary
        } else {
            MarketType::MultiOption
        };

        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.market_index = market_index;
        market.bump = ctx.bumps.market;
        market.market_type = market_type;
        market.question = question;
        market.description = description;
        market.resolved = false;
        market.outcome = Outcome::Unresolved;
        market.num_options = num_options;
        market.collateral_balance = 0;
        market.virtual_liquidity = 50;

        // Initialize options with 50 shares each
        market.options = options
            .iter()
            .map(|name| OptionData {
                shares: 50,
                name: name.clone(),
                active: true,
            })
            .collect();

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

    pub fn buy_shares(ctx: Context<BuyShares>, shares: u64, option_index: u8) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, CustomError::MarketResolved);
        require!(
            option_index < market.num_options,
            CustomError::InvalidOptionIndex
        );
        require!(
            market.options[option_index as usize].active,
            CustomError::OptionNotActive
        );

        let new_shares = shares as u128;
        let option_idx = option_index as usize;

        // Calculate total shares before purchase
        let total_shares_before: u128 = market.options.iter().map(|opt| opt.shares as u128).sum();

        // Cost calculation using generalized CPMM
        // Cost = collateral * (new_shares / (total_shares_before + new_shares))
        let collateral_needed = if total_shares_before == 0 {
            // Edge case: no shares yet, price shares based on L
            new_shares * market.virtual_liquidity as u128
        } else {
            let total_after = total_shares_before + new_shares;
            let ratio = (market.collateral_balance as u128) * new_shares;
            ratio / total_after
        };

        let tokens_needed = (collateral_needed / 10) as u64;
        require!(tokens_needed > 0, CustomError::InsufficientAmount);

        // Update option's share count
        market.options[option_idx].shares =
            (market.options[option_idx].shares as u128 + new_shares) as u64;

        // Update collateral
        market.collateral_balance += tokens_needed;

        // Create/update bet record
        let bet = &mut ctx.accounts.bet;
        if bet.market == Pubkey::default() {
            // New bet
            bet.market = market.key();
            bet.user = ctx.accounts.user.key();
            bet.shares = shares;
            bet.option_index = option_index;
            bet.claimed = false;
        } else {
            // Existing bet - verify same option
            require!(
                bet.option_index == option_index,
                CustomError::DifferentOptionBet
            );
            require!(!bet.claimed, CustomError::AlreadyClaimed);
            bet.shares += shares;
        }

        // Transfer tokens from user to escrow
        token::transfer(ctx.accounts.transfer_to_escrow(), tokens_needed)?;

        Ok(())
    }

    pub fn add_option(ctx: Context<AddOption>, option_name: String) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, CustomError::MarketResolved);
        require!(
            market.num_options < MAX_OPTIONS as u8,
            CustomError::MaxOptionsReached
        );
        require!(
            option_name.len() <= MAX_OPTION_NAME_LENGTH,
            CustomError::OptionNameTooLong
        );

        // Add new option with 50 initial shares
        market.options.push(OptionData {
            shares: 50,
            name: option_name,
            active: true,
        });
        market.num_options += 1;

        Ok(())
    }

    pub fn sell_shares(ctx: Context<SellShares>, shares: u64) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;

        require!(!market.resolved, CustomError::MarketResolved);
        require!(bet.shares >= shares, CustomError::InsufficientShares);

        // Calculate sell payout using CPMM (reverse of buy)
        let total_shares_before: u128 = market.options.iter().map(|opt| opt.shares as u128).sum();
        let option_idx = bet.option_index as usize;

        // Calculate collateral to return
        let shares_to_sell = shares as u128;
        let payout = if total_shares_before <= shares_to_sell {
            // Selling all or more than available
            market.collateral_balance as u128
        } else {
            let ratio = (market.collateral_balance as u128) * shares_to_sell;
            ratio / total_shares_before
        };

        let tokens_to_return = (payout / 10) as u64;

        // Update market
        market.options[option_idx].shares -= shares;
        market.collateral_balance -= tokens_to_return;

        // Update bet
        bet.shares -= shares;

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

        token::transfer(cpi_ctx, tokens_to_return)?;

        Ok(())
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, winner_index: u8) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, CustomError::MarketResolved);
        require!(
            winner_index < market.num_options,
            CustomError::InvalidOptionIndex
        );

        market.resolved = true;
        market.outcome = Outcome::OptionWinner(winner_index);
        Ok(())
    }

    pub fn cancel_market(ctx: Context<ResolveMarket>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, CustomError::MarketResolved);

        market.resolved = true;
        market.outcome = Outcome::Cancelled;
        Ok(())
    }

    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        let market = &ctx.accounts.market;
        let bet = &mut ctx.accounts.bet;

        require!(market.resolved, CustomError::MarketNotResolved);
        require!(!bet.claimed, CustomError::AlreadyClaimed);

        let payout = match market.outcome {
            Outcome::Cancelled => {
                // Refund: proportional to shares owned / total shares
                let total_shares: u128 = market.options.iter().map(|opt| opt.shares as u128).sum();
                if total_shares == 0 {
                    return err!(CustomError::NoSharesInMarket);
                }
                let ratio = (bet.shares as u128) * (market.collateral_balance as u128);
                ratio / total_shares
            }
            Outcome::OptionWinner(winner_idx) => {
                if bet.option_index != winner_idx {
                    return err!(CustomError::NotWinner);
                }
                // Winning shares: pay $0.10 per share
                (bet.shares as u128) / 10
            }
            _ => return err!(CustomError::MarketNotResolved),
        } as u64;

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
    pub market_type: MarketType,
    pub question: String,
    pub description: String,
    pub resolved: bool,
    pub outcome: Outcome,
    pub options: Vec<OptionData>,
    pub num_options: u8,
    pub collateral_balance: u64,
    pub virtual_liquidity: u64,
}

#[account]
pub struct Bet {
    pub market: Pubkey,
    pub user: Pubkey,
    pub shares: u64,
    pub option_index: u8,
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
        space = 8 + 32 + 2 + 1 + 1 + 1 + 4 + MAX_QUESTION_LENGTH + 4 + MAX_DESCRIPTION_LENGTH
               + 1 + 1 + 1 + 8 + 8 + (MAX_OPTIONS * (8 + 4 + MAX_OPTION_NAME_LENGTH + 1)),
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
pub struct BuyShares<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 64,
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump,
        constraint = bet.market == Pubkey::default() || bet.market == market.key() @ CustomError::InvalidBet,
        constraint = bet.user == Pubkey::default() || bet.user == user.key() @ CustomError::InvalidBet
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
pub struct AddOption<'info> {
    #[account(mut, has_one = authority)]
    pub market: Account<'info, Market>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SellShares<'info> {
    #[account(
        mut,
        seeds = [&b"market"[..], market.authority.as_ref(), &market.market_index.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump,
        constraint = bet.market == market.key() @ CustomError::InvalidBet,
        constraint = bet.user == user.key() @ CustomError::InvalidBet
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

impl<'info> BuyShares<'info> {
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
    #[msg("Insufficient amount for trade")]
    InsufficientAmount,
    #[msg("Invalid option count (must be 2-16)")]
    InvalidOptionCount,
    #[msg("Invalid option index")]
    InvalidOptionIndex,
    #[msg("Option is not active")]
    OptionNotActive,
    #[msg("Maximum options reached (16)")]
    MaxOptionsReached,
    #[msg("Option name too long")]
    OptionNameTooLong,
    #[msg("No shares in market")]
    NoSharesInMarket,
    #[msg("Cannot buy shares of different options in same market")]
    DifferentOptionBet,
    #[msg("Invalid bet account")]
    InvalidBet,
    #[msg("Insufficient shares to sell")]
    InsufficientShares,
}
