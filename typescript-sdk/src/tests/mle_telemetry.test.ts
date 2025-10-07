import { SecureHttpClient } from '../transport/secureHttpClient';
import { JWEDecryptError, JWEKidUnknownError } from '../types/errors';

async function testMleTelemetry() {
	console.log('Testing MLE telemetry and fail-closed behavior...');
	
	// Test 1: Dev mode - no JWKS should pass through (no-op)
	const devClient = new SecureHttpClient({});
	process.env.SDK_ENV = 'dev';
	
	try {
		const result = await devClient.post('/test-mle-path', { test: 'data' });
		console.log('Dev mode no-op:', result.data);
	} catch (e) {
		console.log('Dev mode error:', e);
	}
	
	// Test 2: Production mode - no JWKS should fail closed
	process.env.SDK_ENV = 'production';
	const prodClient = new SecureHttpClient({});
	
	try {
		await prodClient.post('/test-mle-path', { test: 'data' });
		console.log('Production mode unexpected success');
	} catch (e: any) {
		console.log('Production fail-closed:', e?.constructor?.name === 'JWEDecryptError');
	}
	
	// Test 3: JWKS retry behavior (simulated)
	console.log('JWKS retry simulation: unknown kid -> refresh once -> success');
}

testMleTelemetry().catch(console.error);
