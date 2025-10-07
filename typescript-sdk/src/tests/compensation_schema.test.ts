import { LogEmitter, validateCompensationEvent, CompensationEvent } from '../utils/events';

async function testCompensationSchema() {
	console.log('Testing compensation event schema validation...');
	
	const emitter = new LogEmitter();
	
	// Test valid event
	const validEvent: CompensationEvent = {
		event: 'payout_failed_requires_compensation',
		sagaId: 'test-saga-123',
		funding: { type: 'AFT', receiptId: 'r1' },
		reason: 'NetworkError',
		timestamp: new Date().toISOString()
	};
	
	console.log('Valid event schema:', validateCompensationEvent(validEvent));
	
	// Test invalid event
	const invalidEvent = { event: 'wrong-event', sagaId: 'test' };
	console.log('Invalid event schema:', validateCompensationEvent(invalidEvent));
	
	// Test emitter validation
	try {
		await emitter.emit(validEvent);
		console.log('Valid event emitted successfully');
	} catch (e) {
		console.log('Valid event emit error:', e);
	}
	
	try {
		await emitter.emit(invalidEvent as any);
		console.log('Invalid event unexpectedly emitted');
	} catch (e) {
		console.log('Invalid event correctly rejected:', e);
	}
}

testCompensationSchema().catch(console.error);
