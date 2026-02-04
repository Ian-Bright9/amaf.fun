use anchor_lang::prelude::*;

const MAX_QUESTION_LENGTH: usize = 200;
const MAX_DESCRIPTION_LENGTH: usize = 500;

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

fn main() {
    // Calculate the space needed for Market account
    // Discriminator: 8 bytes
    // authority (Pubkey): 32 bytes
    // market_index (u16): 2 bytes
    // bump (u8): 1 byte
    // question (String): 4 bytes length + MAX_QUESTION_LENGTH bytes = 4 + 200 = 204 bytes
    // description (String): 4 bytes length + MAX_DESCRIPTION_LENGTH bytes = 4 + 500 = 504 bytes
    // resolved (bool): 1 byte
    // outcome (Option<bool>): 1 byte for Option discriminator + 1 byte for bool = 2 bytes
    // total_yes (u64): 8 bytes
    // total_no (u64): 8 bytes

    let space: usize =
        8 + 32 + 2 + 1 + 4 + MAX_QUESTION_LENGTH + 4 + MAX_DESCRIPTION_LENGTH + 1 + 2 + 8 + 8;
    println!("Required space for Market account: {}", space);

    // Test serialization
    let market = Market {
        authority: Pubkey::default(),
        market_index: 0,
        bump: 255,
        question: "a".repeat(MAX_QUESTION_LENGTH),
        description: "b".repeat(MAX_DESCRIPTION_LENGTH),
        resolved: false,
        outcome: None,
        total_yes: 0,
        total_no: 0,
    };

    let serialized = market.try_to_vec().unwrap();
    println!("Actual serialized size: {}", serialized.len());
    println!("Serialized bytes: {:?}", serialized.get(0..20));
}
