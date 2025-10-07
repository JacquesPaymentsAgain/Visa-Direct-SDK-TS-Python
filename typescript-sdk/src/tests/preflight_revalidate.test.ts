import { InMemoryCache } from '../storage/cache';

async function testPreflightRevalidate() {
	console.log('Testing preflight background revalidate...');
	
	const cache = new InMemoryCache();
	
	// Set entry with 60s TTL
	cache.set('test-key', { data: 'cached' }, 60);
	
	// Immediate get should not trigger revalidate
	const immediate = cache.getWithRevalidate('test-key');
	console.log('Immediate get:', immediate.shouldRevalidate === false);
	
	// Simulate aging by modifying internal timestamp
	const entry = (cache as any).store.get('test-key');
	if (entry) {
		entry.createdAt = Date.now() - 35000; // 35s ago (more than half of 60s TTL)
	}
	
	const aged = cache.getWithRevalidate('test-key');
	console.log('Aged get triggers revalidate:', aged.shouldRevalidate === true);
	console.log('Aged value preserved:', aged.value?.data === 'cached');
}

testPreflightRevalidate().catch(console.error);
