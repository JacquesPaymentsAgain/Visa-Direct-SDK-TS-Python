export type CompensationEvent = {
	event: 'payout_failed_requires_compensation';
	sagaId: string;
	funding: any;
	reason: string;
	metadata?: any;
	timestamp: string;
};

export interface CompensationEventEmitter {
	emit(evt: CompensationEvent): Promise<void>;
}

export class LogEmitter implements CompensationEventEmitter {
	async emit(evt: CompensationEvent): Promise<void> {
		// Validate schema before emit
		if (!evt.event || !evt.sagaId || !evt.reason || !evt.timestamp) {
			throw new Error('Invalid compensation event schema');
		}
		// Avoid PII; log minimal redacted info
		console.warn('[compensation]', { event: evt.event, sagaId: evt.sagaId, reason: evt.reason, timestamp: evt.timestamp });
	}
}

// Schema validator for compensation events
export function validateCompensationEvent(evt: any): evt is CompensationEvent {
	return evt && 
		typeof evt.event === 'string' &&
		typeof evt.sagaId === 'string' &&
		typeof evt.reason === 'string' &&
		typeof evt.timestamp === 'string' &&
		evt.event === 'payout_failed_requires_compensation';
}


