use anchor_lang::prelude::*;

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
        msg!("Prediction market created: {}", contract.question);
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        bet_amount: u64,
        bet_on_yes: bool,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        let bet = &mut ctx.accounts.bet;
        
        // Update contract totals
        if bet_on_yes {
            contract.total_yes_amount += bet_amount;
        } else {
            contract.total_no_amount += bet_amount;
        }
        contract.bet_count += 1;
        
        // Create bet record
        bet.bettor = ctx.accounts.bettor.key();
        bet.contract = contract.key();
        bet.amount = bet_amount;
        bet.bet_on_yes = bet_on_yes;
        bet.timestamp = Clock::get()?.unix_timestamp;
        
        msg!("Bet placed: {} lamports on {} for contract {}", 
              bet_amount, 
              if bet_on_yes { "YES" } else { "NO" },
              contract.key());
        Ok(())
    }

    pub fn resolve_contract(
        ctx: Context<ResolveContract>,
        outcome: bool, // true for YES, false for NO
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        
        require!(!contract.resolved, CustomError::AlreadyResolved);
        require!(
            Clock::get()?.unix_timestamp >= contract.expiration_timestamp,
            CustomError::NotExpired
        );
        
        contract.resolved = true;
        contract.outcome = Some(outcome);
        
        msg!("Contract resolved: {} for contract {}", 
              if outcome { "YES" } else { "NO" },
              contract.key());
        Ok(())
    }
}

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

#[derive(Accounts)]
pub struct CreateContract<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 100 + 500 + 8 + 1 + 1 + 8 + 8 + 8)]
    pub contract: Account<'info, PredictionContract>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub contract: Account<'info, PredictionContract>,
    #[account(init, payer = bettor, space = 8 + 32 + 32 + 8 + 1 + 8)]
    pub bet: Account<'info, Bet>,
    pub bettor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveContract<'info> {
    #[account(mut)]
    pub contract: Account<'info, PredictionContract>,
    pub authority: Signer<'info>,
}

#[error_code]
pub enum CustomError {
    #[msg("Contract has already been resolved")]
    AlreadyResolved,
    #[msg("Contract has not expired yet")]
    NotExpired,
}
