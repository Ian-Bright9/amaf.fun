use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("FmnA9zcz5YAwn378ZHXU4t31t9nDgoiNqkFa93eN1myE");

#[program]
pub mod amafcoin {
    use super::*;

    /* ───────────── MARKET ───────────── */

    pub fn create_market(
        ctx: Context<CreateMarket>,
        question: String,
        description: String,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.question = question;
        market.description = description;
        market.resolved = false;
        market.outcome = None;
        market.total_yes = 0;
        market.total_no = 0;
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
            None => bet.amount, // cancelled
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

        token::transfer(ctx.accounts.transfer_to_user(), payout)?;

        Ok(())
    }

    /* ───────────── DAILY CLAIM ───────────── */

    pub fn claim_daily_amaf(ctx: Context<ClaimDaily>) -> Result<()> {
        let state = &mut ctx.accounts.claim_state;
        let now = Clock::get()?.unix_timestamp;

        require!(now - state.last_claim >= 86_400, CustomError::ClaimTooSoon);

        state.last_claim = now;

        token::mint_to(
            ctx.accounts.mint_ctx(),
            100_000_000_000, // 100 AMAF
        )?;

        Ok(())
    }
}

/* ───────────── ACCOUNTS ───────────── */

#[account]
pub struct Market {
    pub authority: Pubkey,
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

/* ───────────── CONTEXTS ───────────── */

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(init, payer = authority, space = 8 + 256)]
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub authority: Signer<'info>,
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

    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
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
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(mut, has_one = user)]
    pub bet: Account<'info, Bet>,

    #[account(mut)]
    pub escrow_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,

    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimDaily<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 40,
        seeds = [b"claim", user.key().as_ref()],
        bump
    )]
    pub claim_state: Account<'info, DailyClaimState>,

    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/* ───────────── HELPERS ───────────── */

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
            authority: self.user.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

/* ───────────── ERRORS ───────────── */

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
    #[msg("Claim too soon")]
    ClaimTooSoon,
}
