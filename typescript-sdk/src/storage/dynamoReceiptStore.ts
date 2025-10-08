import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { ReceiptStore } from './receiptStore';

export class DynamoReceiptStore implements ReceiptStore {
	private client: DynamoDBClient;

	constructor(
		private tableName: string,
		client?: DynamoDBClient,
		private ttlSeconds = 86400
	) {
		this.client = client ?? new DynamoDBClient({});
	}

	async consumeOnce(namespace: 'AFT' | 'PIS', receiptId: string): Promise<boolean> {
		const compositeId = `${namespace}#${receiptId}`;
		const ttl = Math.floor(Date.now() / 1000) + this.ttlSeconds;
		try {
			await this.client.send(new PutItemCommand({
				TableName: this.tableName,
				Item: {
					receiptId: { S: compositeId },
					ttl: { N: String(ttl) }
				},
				ConditionExpression: 'attribute_not_exists(receiptId)'
			}));
			return true;
		} catch (err: any) {
			if (err?.name === 'ConditionalCheckFailedException') {
				return false;
			}
			throw err;
		}
	}
}
