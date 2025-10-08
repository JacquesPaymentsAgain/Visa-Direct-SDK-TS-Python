import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { IdempotencyStore } from './idempotencyStore';

export class DynamoIdempotencyStore<T = any> implements IdempotencyStore<T> {
	private client: DynamoDBClient;

	constructor(
		private tableName: string,
		client?: DynamoDBClient,
		private payloadAttribute = 'payload',
		private ttlAttribute = 'ttl'
	) {
		this.client = client ?? new DynamoDBClient({});
	}

	async get(idempotencyKey: string): Promise<T | undefined> {
		const response = await this.client.send(new GetItemCommand({
			TableName: this.tableName,
			Key: { idk: { S: idempotencyKey } }
		}));
		const item = response.Item;
		if (!item) return undefined;
		const ttlAttribute = item[this.ttlAttribute];
		if (ttlAttribute?.N) {
			const ttl = Number(ttlAttribute.N);
			if (ttl > 0 && ttl < Math.floor(Date.now() / 1000)) {
				return undefined;
			}
		}
		const payload = item[this.payloadAttribute]?.S;
		if (!payload) return undefined;
		return JSON.parse(payload) as T;
	}

	async put(idempotencyKey: string, value: T, ttlSeconds: number): Promise<void> {
		const ttl = Math.floor(Date.now() / 1000) + ttlSeconds;
		try {
			await this.client.send(new PutItemCommand({
				TableName: this.tableName,
				Item: {
					idk: { S: idempotencyKey },
					[this.payloadAttribute]: { S: JSON.stringify(value) },
					[this.ttlAttribute]: { N: String(ttl) }
				},
				ConditionExpression: 'attribute_not_exists(idk)'
			}));
		} catch (err: any) {
			if (err?.name === 'ConditionalCheckFailedException') {
				return;
			}
			throw err;
		}
	}
}
