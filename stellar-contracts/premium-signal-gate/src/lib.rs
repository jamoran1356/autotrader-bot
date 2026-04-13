#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Symbol};

#[contract]
pub struct PremiumSignalGate;

#[contractimpl]
impl PremiumSignalGate {
    pub fn version() -> u32 {
        1
    }

    pub fn quote_price_stroops() -> i128 {
        5_000_000
    }

    pub fn protocol() -> Symbol {
        symbol_short!("x402")
    }
}
