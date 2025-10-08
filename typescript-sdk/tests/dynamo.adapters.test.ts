import { describe, it, expect } from 'vitest';
import { PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { DynamoIdempotencyStore } from '../src/storage/dynamoIdempotencyStore';
import { DynamoReceiptStore } from '../src/storage/dynamoReceiptStore';
import { Orchestrator, ReceiptReused } from '../src/core/orchestrator';

class FakeDynamoClient {
	private tables = new Map<string, Map<string, any>>();

	private ensureTable(name: string) {
		if (!this.tables.has(name)) {
			this.tables.set(name, new Map());
		}
		return this.tables.get(name)!;
	}

	async send(command: any): Promise<any> {
		if (command instanceof GetItemCommand) {
			const table = this.ensureTable(command.input.TableName!);
			const keyEntry = Object.entries(command.input.Key!)[0] as [string, { S?: string }];
			const key = keyEntry[1]?.S ?? '';
			const item = table.get(key);
			if (!item) return { Item: undefined };
			const ttl = item.ttl?.N ? Number(item.ttl.N) : undefined;
			if (ttl && ttl < Math.floor(Date.now() / 1000)) {
				table.delete(key);
				return { Item: undefined };
			}
			return { Item: item };
		}
		if (command instanceof PutItemCommand) {
			const table = this.ensureTable(command.input.TableName!);
			const itemEntries = Object.entries(command.input.Item!);
			const primaryEntry = itemEntries.find(([key]) => ['idk', 'receiptId', 'cacheKey'].includes(key)) ?? itemEntries[0];
			const primaryKey = primaryEntry[1]?.S ?? '';
			if (command.input.ConditionExpression?.includes('attribute_not_exists') && table.has(primaryKey)) {
				const err = new Error('ConditionalCheckFailedException');
				(err as any).name = 'ConditionalCheckFailedException';
				throw err;
			}
			table.set(primaryKey, command.input.Item);
			return {};
		}
		throw new Error('Unsupported command');
	}
}

class StubHttpClient {
	public calls = 0;

	async post() {
		this.calls += 1;
		return {
			data: { payoutId: `payout-${this.calls}`, status: 'executed' },
			status: 200,
			headers: {}
		};
	}
}

describe('DynamoDB adapters', () => {
	it('shares idempotency results across orchestrators', async () => {
		const dynamo = new FakeDynamoClient();
		const idStore = new DynamoIdempotencyStore<any>('idem-table', dynamo as any);
		const receiptStore = new DynamoReceiptStore('receipt-table', dynamo as any, 60);
		const http = new StubHttpClient();
		const orchestratorA = new Orchestrator(http as any, { idempotencyStore: idStore, receiptStore });
		const orchestratorB = new Orchestrator(http as any, { idempotencyStore: idStore, receiptStore });

		const request = {
			originatorId: 'fi-dynamo',
			idempotencyKey: 'idem-key-1',
			funding: { type: 'INTERNAL', debitConfirmed: true, confirmationRef: 'conf-dyn' } as const,
			destination: { type: 'CARD' as const, panToken: 'tok_pan_411111******1111' },
			amount: { currency: 'USD', minor: 101 },
			preflight: {}
		};

		const first = await orchestratorA.payout(request);
		const second = await orchestratorB.payout(request);

		expect(first.payoutId).toBe('payout-1');
		expect(second.payoutId).toBe('payout-1');
		expect(http.calls).toBe(1);
	});

	it('prevents receipt reuse across orchestrators', async () => {
		const dynamo = new FakeDynamoClient();
		const idStore = new DynamoIdempotencyStore<any>('idem-table-2', dynamo as any);
		const receiptStore = new DynamoReceiptStore('receipt-table-2', dynamo as any, 60);
		const http = new StubHttpClient();
		const orchestratorA = new Orchestrator(http as any, { idempotencyStore: idStore, receiptStore });
		const orchestratorB = new Orchestrator(http as any, { idempotencyStore: idStore, receiptStore });

		const baseRequest = {
			originatorId: 'fi-dynamo',
			destination: { type: 'CARD' as const, panToken: 'tok_pan_411111******1111' },
			amount: { currency: 'USD', minor: 103 },
			preflight: {}
		};

		await orchestratorA.payout({
			...baseRequest,
			idempotencyKey: 'idem-key-2',
			funding: { type: 'AFT', receiptId: 'receipt-123', status: 'approved' as const }
		});

		await expect(orchestratorB.payout({
			...baseRequest,
			idempotencyKey: 'idem-key-3',
			funding: { type: 'AFT', receiptId: 'receipt-123', status: 'approved' as const }
		})).rejects.toBeInstanceOf(ReceiptReused);
		expect(http.calls).toBe(1);
	});
});
