export interface PredictionContract {
	authority: string;
	question: string;
	description: string;
	expirationTimestamp: number;
	resolved: boolean;
	outcome: boolean | null;
	totalYesAmount: number;
	totalNoAmount: number;
	betCount: number;
}

export interface Bet {
	bettor: string;
	contract: string;
	amount: number;
	betOnYes: boolean;
	timestamp: number;
}

export interface TokenState {
	authority: string;
	lastClaimTime: number;
	totalClaimed: number;
}

function readPublicKey(buffer: Buffer, offset: number): [string, number] {
	const pubkey = buffer.slice(offset, offset + 32).toString('hex');
	return [pubkey, offset + 32];
}

function readString(buffer: Buffer, offset: number): [string, number] {
	const len = buffer.readUInt32LE(offset);
	const str = buffer.slice(offset + 4, offset + 4 + len).toString('utf8');
	return [str, offset + 4 + len];
}

function readInt64(buffer: Buffer, offset: number): [bigint, number] {
	const value = buffer.readBigUInt64LE(offset);
	return [value, offset + 8];
}

function readUInt64(buffer: Buffer, offset: number): [bigint, number] {
	const value = buffer.readBigUInt64LE(offset);
	return [value, offset + 8];
}

function readBool(buffer: Buffer, offset: number): [boolean, number] {
	const value = buffer[offset] === 1;
	return [value, offset + 1];
}

function readOptionBool(buffer: Buffer, offset: number): [boolean | null, number] {
	const hasValue = buffer[offset] === 1;
	if (!hasValue) {
		return [null, offset + 1];
	}
	return [buffer[offset + 1] === 1, offset + 2];
}

export function deserializeContract(data: Buffer): PredictionContract | null {
	try {
		const accountData = data.slice(8);
		let offset = 0;

		const [authority] = readPublicKey(accountData, offset);
		offset += 32;

		const [question] = readString(accountData, offset);
		offset += 4 + Buffer.byteLength(question, 'utf8');

		const [description] = readString(accountData, offset);
		offset += 4 + Buffer.byteLength(description, 'utf8');

		const [expirationTimestamp] = readInt64(accountData, offset);
		offset += 8;

		const [resolved] = readBool(accountData, offset);
		offset += 1;

		const [outcome] = readOptionBool(accountData, offset);
		offset += 2;

		const [totalYesAmount] = readUInt64(accountData, offset);
		offset += 8;

		const [totalNoAmount] = readUInt64(accountData, offset);
		offset += 8;

		const [betCount] = readUInt64(accountData, offset);

		return {
			authority,
			question,
			description,
			expirationTimestamp: Number(expirationTimestamp),
			resolved,
			outcome,
			totalYesAmount: Number(totalYesAmount),
			totalNoAmount: Number(totalNoAmount),
			betCount: Number(betCount)
		};
	} catch (error) {
		console.error('Error deserializing contract:', error);
		return null;
	}
}

export function deserializeBet(data: Buffer): Bet | null {
	try {
		const accountData = data.slice(8);
		let offset = 0;

		const [bettor] = readPublicKey(accountData, offset);
		offset += 32;

		const [contract] = readPublicKey(accountData, offset);
		offset += 32;

		const [amount] = readUInt64(accountData, offset);
		offset += 8;

		const [betOnYes] = readBool(accountData, offset);
		offset += 1;

		const [timestamp] = readInt64(accountData, offset);

		return {
			bettor,
			contract,
			amount: Number(amount),
			betOnYes,
			timestamp: Number(timestamp)
		};
	} catch (error) {
		console.error('Error deserializing bet:', error);
		return null;
	}
}

export function deserializeTokenState(data: Buffer): TokenState | null {
	try {
		const accountData = data.slice(8);
		let offset = 0;

		const [authority] = readPublicKey(accountData, offset);
		offset += 32;

		const [lastClaimTime] = readInt64(accountData, offset);
		offset += 8;

		const [totalClaimed] = readUInt64(accountData, offset);

		return {
			authority,
			lastClaimTime: Number(lastClaimTime),
			totalClaimed: Number(totalClaimed)
		};
	} catch (error) {
		console.error('Error deserializing token state:', error);
		return null;
	}
}
