use anchor_lang::prelude::*;
use amafcoin::*;

mod test_utils;

use test_utils::*;

#[test]
fn test_create_contract() {
    let mut test_context = TestContext::new();
    
    let question = "Will BTC reach $100k by end of 2025?".to_string();
    let description = "Bitcoin price prediction market".to_string();
    let expiration_timestamp = Clock::get().unwrap().unix_timestamp + 86400 * 30; // 30 days from now
    
    // Create contract
    let contract_key = test_context.create_contract(
        question.clone(),
        description.clone(),
        expiration_timestamp
    );
    
    // Verify contract state
    let contract = test_context.get_contract(contract_key);
    assert_eq!(contract.authority, test_context.authority.pubkey());
    assert_eq!(contract.question, question);
    assert_eq!(contract.description, description);
    assert_eq!(contract.expiration_timestamp, expiration_timestamp);
    assert!(!contract.resolved);
    assert_eq!(contract.outcome, None);
    assert_eq!(contract.total_yes_amount, 0);
    assert_eq!(contract.total_no_amount, 0);
    assert_eq!(contract.bet_count, 0);
}

#[test]
fn test_place_bet_yes() {
    let mut test_context = TestContext::new();
    
    // Create contract first
    let contract_key = test_context.create_contract(
        "Test question".to_string(),
        "Test description".to_string(),
        Clock::get().unwrap().unix_timestamp + 86400
    );
    
    // Place YES bet
    let bet_amount = 1000;
    let bet_key = test_context.place_bet(contract_key, bet_amount, true);
    
    // Verify contract updated
    let contract = test_context.get_contract(contract_key);
    assert_eq!(contract.total_yes_amount, bet_amount);
    assert_eq!(contract.total_no_amount, 0);
    assert_eq!(contract.bet_count, 1);
    
    // Verify bet record
    let bet = test_context.get_bet(bet_key);
    assert_eq!(bet.bettor, test_context.bettor.pubkey());
    assert_eq!(bet.contract, contract_key);
    assert_eq!(bet.amount, bet_amount);
    assert!(bet.bet_on_yes);
}

#[test]
fn test_place_bet_no() {
    let mut test_context = TestContext::new();
    
    // Create contract first
    let contract_key = test_context.create_contract(
        "Test question".to_string(),
        "Test description".to_string(),
        Clock::get().unwrap().unix_timestamp + 86400
    );
    
    // Place NO bet
    let bet_amount = 2000;
    let bet_key = test_context.place_bet(contract_key, bet_amount, false);
    
    // Verify contract updated
    let contract = test_context.get_contract(contract_key);
    assert_eq!(contract.total_yes_amount, 0);
    assert_eq!(contract.total_no_amount, bet_amount);
    assert_eq!(contract.bet_count, 1);
    
    // Verify bet record
    let bet = test_context.get_bet(bet_key);
    assert_eq!(bet.bettor, test_context.bettor.pubkey());
    assert_eq!(bet.contract, contract_key);
    assert_eq!(bet.amount, bet_amount);
    assert!(!bet.bet_on_yes);
}

#[test]
fn test_multiple_bets() {
    let mut test_context = TestContext::new();
    
    let contract_key = test_context.create_contract(
        "Test question".to_string(),
        "Test description".to_string(),
        Clock::get().unwrap().unix_timestamp + 86400
    );
    
    // Place multiple bets
    let bet1_amount = 1000;
    let bet2_amount = 2000;
    let bet3_amount = 1500;
    
    test_context.place_bet(contract_key, bet1_amount, true);
    test_context.place_bet(contract_key, bet2_amount, false);
    test_context.place_bet(contract_key, bet3_amount, true);
    
    // Verify totals
    let contract = test_context.get_contract(contract_key);
    assert_eq!(contract.total_yes_amount, bet1_amount + bet3_amount);
    assert_eq!(contract.total_no_amount, bet2_amount);
    assert_eq!(contract.bet_count, 3);
}

#[test]
fn test_resolve_contract_yes() {
    let mut test_context = TestContext::new();
    
    let contract_key = test_context.create_contract(
        "Test question".to_string(),
        "Test description".to_string(),
        Clock::get().unwrap().unix_timestamp - 1 // Expired
    );
    
    // Resolve contract as YES
    test_context.resolve_contract(contract_key, true);
    
    // Verify resolution
    let contract = test_context.get_contract(contract_key);
    assert!(contract.resolved);
    assert_eq!(contract.outcome, Some(true));
}

#[test]
fn test_resolve_contract_no() {
    let mut test_context = TestContext::new();
    
    let contract_key = test_context.create_contract(
        "Test question".to_string(),
        "Test description".to_string(),
        Clock::get().unwrap().unix_timestamp - 1 // Expired
    );
    
    // Resolve contract as NO
    test_context.resolve_contract(contract_key, false);
    
    // Verify resolution
    let contract = test_context.get_contract(contract_key);
    assert!(contract.resolved);
    assert_eq!(contract.outcome, Some(false));
}

#[test]
#[should_panic(expected = "AlreadyResolved")]
fn test_resolve_already_resolved() {
    let mut test_context = TestContext::new();
    
    let contract_key = test_context.create_contract(
        "Test question".to_string(),
        "Test description".to_string(),
        Clock::get().unwrap().unix_timestamp - 1 // Expired
    );
    
    // Resolve once
    test_context.resolve_contract(contract_key, true);
    
    // Try to resolve again - should fail
    test_context.resolve_contract(contract_key, false);
}

#[test]
#[should_panic(expected = "NotExpired")]
fn test_resolve_not_expired() {
    let mut test_context = TestContext::new();
    
    let contract_key = test_context.create_contract(
        "Test question".to_string(),
        "Test description".to_string(),
        Clock::get().unwrap().unix_timestamp + 86400 // Not expired
    );
    
    // Try to resolve before expiration - should fail
    test_context.resolve_contract(contract_key, true);
}