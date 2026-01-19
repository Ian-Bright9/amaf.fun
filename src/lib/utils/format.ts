export function formatCurrency(amount: number, decimals: number = 2): string {
	return `${amount.toFixed(decimals)} SOL`;
}

export function formatAmafCurrency(amount: number, decimals: number = 2): string {
	return `${amount.toFixed(decimals)} ¤`;
}

export function formatPercentage(value: number): string {
	return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function shortenAddress(address: string, chars: number = 4): string {
	return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function calculateProbability(yesPrice: number, noPrice: number): number {
	return yesPrice / (yesPrice + noPrice);
}
