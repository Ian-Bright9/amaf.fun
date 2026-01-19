use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLn");

#[program]
pub mod amafcoin {
    use super::*;

    pub fn create_contract(
        ctx: Context<CreateContract>,
        question: String,
        description: String,
        expiration_timestamp: i64,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        contract.authority = ctx.accounts.authority.key();
        contract.question = question;
        contract.description = description;
        contract.expiration_timestamp = expiration_timestamp;
        contract.resolved = false;
        contract.outcome = None;
        contract.total_yes_amount = 0;
        contract.total_no_amount = 0;
        contract.bet_count = 0;
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        bet_amount: u64,
        bet_on_yes: bool,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let bet = &mut ctx.accounts.bet;

        if bet_on_yes {
            contract.total_yes_amount += bet_amount;
        } else {
            contract.total_no_amount += bet_amount;
        }
        contract.bet_count += 1;

        bet.bettor = ctx.accounts.bettor.key();
        bet.contract = contract.key();
        bet.amount = bet_amount;
        bet.bet_on_yes = bet_on_yes;
        bet.timestamp = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn resolve_contract(
        ctx: Context<ResolveContract>,
        outcome: bool,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;

        require!(!contract.resolved, CustomError::AlreadyResolved);
        require!(
            Clock::get()?.unix_timestamp >= contract.expiration_timestamp,
            CustomError::NotExpired
        );

        contract.resolved = true;
        contract.outcome = Some(outcome);
        Ok(())
    }

    pub fn initialize_token_mint(
        ctx: Context<InitializeTokenMint>,
    ) -> Result<()> {
        let token_state = &mut ctx.accounts.token_state;
        token_state.authority = ctx.accounts.authority.key();
        token_state.last_claim_time = 0;
        token_state.total_claimed = 0;
        Ok(())
    }

    pub fn claim_daily_tokens(
        ctx: Context<ClaimDailyTokens>,
    ) -> Result<()> {
        let token_state = &mut ctx.accounts.token_state;
        let now = Clock::get()?.unix_timestamp;

        require!(
            now >= token_state.last_claim_time + 86400,
            CustomError::TooEarlyToClaim
        );

        token_state.last_claim_time = now;
        token_state.total_claimed += 100;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );

        token::mint_to(cpi_ctx, 100 * 10u64.pow(9))?;
        Ok(())
    }
}

/* ───────────── ACCOUNTS ───────────── */

#[account]
pub struct PredictionContract {
    pub authority: Pubkey,
    pub question: String,
    pub description: String,
    pub expiration_timestamp: i64,
    pub resolved: bool,
    pub outcome: Option<bool>,
    pub total_yes_amount: u64,
    pub total_no_amount: u64,
    pub bet_count: u64,
}

#[account]
pub struct Bet {
    pub bettor: Pubkey,
    pub contract: Pubkey,
    pub amount: u64,
    pub bet_on_yes: bool,
    pub timestamp: i64,
}

#[account]
pub struct TokenState {
    pub authority: Pubkey,
    pub last_claim_time: i64,
    pub total_claimed: u64,
}

/* ───────────── CONTEXTS ───────────── */

#[derive(Accounts)]
pub struct CreateContract<'info> {
    #[account(init, payer = authority, space = 8 + 256 + 512)]
    pub contract: Account<'info, PredictionContract>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub contract: Account<'info, PredictionContract>,
    #[account(init, payer = bettor, space = 8 + 64)]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub bettor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveContract<'info> {
    #[account(mut, has_one = authority)]
    pub contract: Account<'info, PredictionContract>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeTokenMint<'info> {
    #[account(mut)]
    pub token_state: Account<'info, TokenState>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimDailyTokens<'info> {
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub token_state: Account<'info, TokenState>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

/* ───────────── ERRORS ───────────── */

#[error_code]
pub enum CustomError {
    #[msg("Contract has already been resolved")]
    AlreadyResolved,
    #[msg("Contract has not expired yet")]
    NotExpired,
    #[msg("Cannot claim tokens yet, wait 24 hours")]
    TooEarlyToClaim,
}
