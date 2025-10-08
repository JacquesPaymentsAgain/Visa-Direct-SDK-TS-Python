import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

export class DynamoCache<V = any> {
	private client: DynamoDBClient;

	constructor(
		private tableName: string,
		client?: DynamoDBClient,
		private payloadAttribute = 'payload',
		private ttlAttribute = 'ttl',
		private createdAtAttribute = 'createdAt'
	) {
		this.client = client ?? new DynamoDBClient({});
	}

	async get(key: string): Promise<V | undefined> {
		const response = await this.client.send(new GetItemCommand({
			TableName: this.tableName,
			Key: { cacheKey: { S: key } }
		}));
		const item = response.Item;
		if (!item) return undefined;
		const ttlValue = item[this.ttlAttribute]?.N;
		if (ttlValue && Number(ttlValue) < Math.floor(Date.now() / 1000)) {
			return undefined;
		}
		const payload = item[this.payloadAttribute]?.S;
		return payload ? JSON.parse(payload) as V : undefined;
	}

	async set(key: string, value: V, ttlSeconds: number): Promise<void> {
		const now = Math.floor(Date.now() / 1000);
		await this.client.send(new PutItemCommand({
			TableName: this.tableName,
			Item: {
				cacheKey: { S: key },
				[this.payloadAttribute]: { S: JSON.stringify(value) },
				[this.ttlAttribute]: { N: String(now + ttlSeconds) },
				[this.createdAtAttribute]: { N: String(now) }
			}
		}));
	}

	async getWithRevalidate(key: string): Promise<{ value: V | undefined; shouldRevalidate: boolean }> {
		const response = await this.client.send(new GetItemCommand({
			TableName: this.tableName,
			Key: { cacheKey: { S: key } }
		}));
		const item = response.Item;
		if (!item) return { value: undefined, shouldRevalidate: false };
		const ttlValue = item[this.ttlAttribute]?.N;
		if (ttlValue && Number(ttlValue) < Math.floor(Date.now() / 1000)) {
			return { value: undefined, shouldRevalidate: false };
		}
		const createdAt = item[this.createdAtAttribute]?.N ? Number(item[this.createdAtAttribute].N) : undefined;
		const ttl = ttlValue ? Number(ttlValue) : undefined;
		const payload = item[this.payloadAttribute]?.S;
		const value = payload ? JSON.parse(payload) as V : undefined;
		let shouldRevalidate = false;
		if (createdAt && ttl) {
			const age = Math.floor(Date.now() / 1000) - createdAt;
			const totalTtl = ttl - createdAt;
			shouldRevalidate = totalTtl > 0 ? age > totalTtl / 2 : false;
		}
		return { value, shouldRevalidate };
	}
}
