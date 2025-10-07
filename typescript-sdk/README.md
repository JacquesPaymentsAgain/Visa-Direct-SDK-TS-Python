# TypeScript SDK Documentation

## Overview
The TypeScript SDK provides a fluent builder interface for Visa Direct payouts, with a core orchestrator that enforces business rules and handles secure communication.

## Installation
```bash
cd typescript-sdk
npm install
npm run build
```

## Quick Start
```typescript
import { PayoutBuilder } from './dist/dx/builder';

const result = await PayoutBuilder.create()
  .forOriginator('fi-001')
  .withFundingInternal(true, 'conf-123')
  .toCardDirect('tok_pan_411111******1111')
  .forAmount('USD', 101)
  .execute();
```

## API Reference

### PayoutBuilder

#### Core Methods
- `forOriginator(originatorId: string)` - Set the originator ID
- `withFundingInternal(debitConfirmed: boolean, confirmationRef: string)` - Internal funding
- `withFundingFromCard(receiptId: string, status: 'approved' | 'declined')` - AFT funding
- `withFundingFromExternal(paymentId: string, status: 'executed' | 'failed')` - PIS funding
- `toCardDirect(panToken: string)` - Direct card payout
- `toAccount(accountId: string)` - Account payout
- `toWallet(walletId: string)` - Wallet payout
- `forAmount(currency: string, minor: number)` - Set amount
- `withIdempotencyKey(key: string)` - Set idempotency key

#### Advanced Methods
- `toCardViaAlias({ alias, aliasType })` - Resolve alias to panToken
- `withQuoteLock({ srcCurrency, dstCurrency, amountMinor? })` - Lock FX quote
- `withCompliance(payload)` - Add compliance screening

#### Execution
- `execute()` - Execute the payout (enforces FX policy)

### Orchestrator

#### Guards
- **LedgerGuard**: Requires `debitConfirmed: true` and `confirmationRef` for internal funding
- **FundingGuard**: Validates AFT/PIS status and enforces single-use receipts
- **ReceiptReused**: Thrown when same receipt is used twice

#### Routing
- Card destinations → `/visadirect/fundstransfer/v1/pushfunds`
- Account destinations → `/accountpayouts/v1/payout`
- Wallet destinations → `/walletpayouts/v1/payout`

### SecureHttpClient

#### MLE/JWE Support
- Conditional encryption based on `requiresMLE(path)` from config
- JWKS cache with TTL and 1x retry on `kid` mismatch
- Production mode: fail-closed when JWKS unavailable
- Dev mode: no-op passthrough for simulator

#### mTLS Support
```typescript
const client = new SecureHttpClient({
  certPath: '/path/to/client.crt',
  keyPath: '/path/to/client.key',
  caPath: '/path/to/ca.crt'
});
```

### Preflight Services

#### RecipientService
- `resolveAlias(alias, aliasType)` - Resolve alias to credentials
- `pav(panToken)` - Card validation
- `ftai(panToken)` - Fund transfer attributes inquiry
- `validate(destinationHash, payload)` - Account/wallet validation

#### QuotingService
- `lock(srcCurrency, dstCurrency, amountMinor)` - Lock FX quote

### Storage Interfaces

#### IdempotencyStore
```typescript
interface IdempotencyStore<T> {
  get(idempotencyKey: string): T | undefined;
  put(idempotencyKey: string, value: T, ttlSeconds: number): void;
}
```

#### ReceiptStore
```typescript
interface ReceiptStore {
  consumeOnce(namespace: 'AFT' | 'PIS', receiptId: string): boolean;
}
```

#### Cache
```typescript
interface Cache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V, ttlSeconds: number): void;
  getWithRevalidate(key: K): { value: V | undefined; shouldRevalidate: boolean };
}
```

## Error Handling

### Error Classes
- `LedgerNotConfirmed` - Internal funding not confirmed
- `AFTDeclined` - AFT not approved
- `PISFailed` - PIS not executed
- `ReceiptReused` - Receipt already used
- `QuoteRequiredError` - FX quote required for cross-border
- `QuoteExpiredError` - FX quote expired
- `JWEKidUnknownError` - Unknown JWE key ID
- `JWEDecryptError` - JWE decryption failed

### Example Error Handling
```typescript
try {
  const result = await builder.execute();
} catch (error) {
  if (error instanceof QuoteRequiredError) {
    // Handle missing FX quote
  } else if (error instanceof ReceiptReused) {
    // Handle receipt reuse
  }
}
```

## Configuration

### Environment Variables
- `VISA_BASE_URL` - API base URL
- `VISA_JWKS_URL` - JWKS endpoint
- `SDK_ENV` - `production` or `dev`

### Endpoints Configuration
The SDK reads from `endpoints/endpoints.json`:
```json
{
  "baseUrls": {
    "visa": "${VISA_BASE_URL:-https://api.visa.com}"
  },
  "routes": [
    {
      "path": "/visadirect/fundstransfer/v1/pushfunds",
      "requiresMLE": false
    }
  ],
  "jwks": {
    "url": "${VISA_JWKS_URL:-https://api.visa.com/jwks}",
    "cacheTtlSeconds": 300
  }
}
```

## Testing

### Test Files
- `src/tests/kv_stores.test.ts` - Store behavior tests
- `src/tests/mle_telemetry.test.ts` - MLE/JWE tests
- `src/tests/preflight_revalidate.test.ts` - Cache tests
- `src/tests/compensation_schema.test.ts` - Event validation tests

### Running Tests
```bash
npm run build
node dist/tests/kv_stores.test.js
```

## Examples

### Basic FI Internal to Card
```typescript
import { PayoutBuilder } from './dist/dx/builder';

async function basicPayout() {
  const result = await PayoutBuilder.create()
    .forOriginator('fi-001')
    .withFundingInternal(true, 'conf-123')
    .toCardDirect('tok_pan_411111******1111')
    .forAmount('USD', 101)
    .withIdempotencyKey('demo-1')
    .execute();
  
  console.log('Payout result:', result);
}
```

### Alias Resolution with FX Quote
```typescript
async function advancedPayout() {
  const result = await PayoutBuilder.create()
    .forOriginator('fi-001')
    .withFundingInternal(true, 'conf-123')
    .toCardViaAlias({ alias: 'dev@example.com', aliasType: 'EMAIL' })
    .withQuoteLock({ srcCurrency: 'USD', dstCurrency: 'EUR' })
    .forAmount('EUR', 100)
    .execute();
  
  console.log('Advanced payout result:', result);
}
```

### Custom Stores
```typescript
import { Orchestrator } from './dist/core/orchestrator';
import { RedisIdempotencyStore, RedisReceiptStore } from './dist/storage/';

const orchestrator = new Orchestrator(
  httpClient,
  new RedisIdempotencyStore(redisClient),
  new RedisReceiptStore(redisClient)
);
```

## Production Considerations

### Security
- Use mTLS certificates in production
- Set `SDK_ENV=production` for fail-closed MLE behavior
- Never log sensitive data (PAN, plaintext JWE)

### Performance
- Use Redis stores for idempotency and receipts in production
- Configure appropriate TTL values for caches
- Monitor JWKS cache hit rates

### Monitoring
- Implement proper logging for telemetry events
- Set up alerts for compensation events
- Monitor FX quote expiration rates
