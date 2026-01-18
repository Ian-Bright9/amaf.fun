import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercentage, shortenAddress } from '$lib/utils/format.js';

describe('formatCurrency', () => {
	it('formats numbers with default decimals', () => {
		expect(formatCurrency(1.23456)).toBe('1.23 SOL');
	});

	it('formats numbers with custom decimals', () => {
		expect(formatCurrency(1.23456, 4)).toBe('1.2346 SOL');
	});

	it('formats integers correctly', () => {
		expect(formatCurrency(10)).toBe('10.00 SOL');
	});
});

describe('formatPercentage', () => {
	it('formats decimal as percentage', () => {
		expect(formatPercentage(0.5)).toBe('50.0%');
	});

	it('handles edge cases', () => {
		expect(formatPercentage(0)).toBe('0.0%');
		expect(formatPercentage(1)).toBe('100.0%');
	});
});

describe('shortenAddress', () => {
	it('shortens addresses with default length', () => {
		expect(shortenAddress('1234567890123456789012345678901234567890')).toBe('1234...7890');
	});

	it('shortens addresses with custom length', () => {
		expect(shortenAddress('1234567890123456789012345678901234567890', 6)).toBe('123456...567890');
	});
});
