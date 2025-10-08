# Python SDK Documentation

## Overview
The Python SDK provides a fluent builder interface for Visa Direct payouts, with a core orchestrator that enforces business rules and handles secure communication.

## Installation
```bash
cd python-sdk
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Quick Start
```python
from visa_direct_sdk.dx.builder import PayoutBuilder

builder = PayoutBuilder.create()
result = builder \
  .for_originator('fi-001') \
  .with_funding_internal(True, 'conf-123') \
  .to_card_direct('tok_pan_411111******1111') \
  .for_amount('USD', 101) \
  .execute()
```

## API Reference

### PayoutBuilder

#### Core Methods
- `for_originator(originator_id: str)` - Set the originator ID
- `with_funding_internal(debit_confirmed: bool, confirmation_ref: str)` - Internal funding
- `with_funding_from_card(receipt_id: str, status: str)` - AFT funding
- `with_funding_from_external(payment_id: str, status: str)` - PIS funding
- `to_card_direct(pan_token: str)` - Direct card payout
- `to_account(account_id: str)` - Account payout
- `to_wallet(wallet_id: str)` - Wallet payout
- `for_amount(currency: str, minor: int)` - Set amount
- `with_idempotency_key(key: str)` - Set idempotency key

#### Advanced Methods
- `to_card_via_alias(alias: str, alias_type: str = 'EMAIL')` - Queue alias resolution for orchestrator preflight
- `with_quote_lock(src_currency: str, dst_currency: str)` - Request FX lock during preflight
- `with_compliance(payload)` - Attach compliance payload for screening

#### Execution
- `execute()` - Builds the payout request and delegates to the orchestrator (FX policy and compliance enforced centrally)

### Orchestrator

#### Guards
- **LedgerGuard**: Requires `debitConfirmed: true` and `confirmationRef` for internal funding
- **FundingGuard**: Validates AFT/PIS status and enforces single-use receipts
- **ReceiptReused**: Raised when same receipt is used twice

#### Routing
- Card destinations → `/visadirect/fundstransfer/v1/pushfunds`
- Account destinations → `/accountpayouts/v1/payout`
- Wallet destinations → `/walletpayouts/v1/payout`

### SecureHttpClient

#### MLE/JWE Support
- Conditional encryption based on `requires_mle(path)` from config
- JWKS cache with TTL, retry on `kid` mismatch, and environment-aware fallbacks
- Production mode: fail-closed when JWKS unavailable
- Dev mode: JSON passthrough when JWKS is absent (simulator-friendly)

#### mTLS Support
```python
from visa_direct_sdk.transport.secure_http_client import SecureHttpClient

client = SecureHttpClient(
    cert_path='/path/to/client.crt',
    key_path='/path/to/client.key',
    ca_path='/path/to/ca.crt'
)
```

### Preflight Services

#### RecipientService
- `resolve_alias(alias, alias_type)` - Resolve alias with background cache revalidation
- `pav(pan_token)` - Card validation with revalidation
- `ftai(pan_token)` - Fund transfer attributes inquiry with revalidation
- `validate(destination_hash, payload)` - Account/wallet validation with revalidation

#### QuotingService
- `lock(src_currency, dst_currency, amount_minor)` - Lock FX quote with background refresh

### Storage Interfaces

#### IdempotencyStore
```python
class IdempotencyStore:
    def get(self, key: str) -> Optional[Any]: ...
    def put(self, key: str, value: Any, ttl_seconds: int) -> None: ...
```

#### ReceiptStore
```python
class ReceiptStore:
    def consume_once(self, namespace: str, receipt_id: str) -> bool: ...
```

#### Cache
```python
class Cache:
    def get(self, key: str) -> Optional[Any]: ...
    def set(self, key: str, value: Any, ttl_seconds: int) -> None: ...
    def get_with_revalidate(self, key: str) -> tuple[Optional[Any], bool]: ...
```

## Error Handling

### Exception Classes
- `LedgerNotConfirmed` - Internal funding not confirmed
- `AFTDeclined` - AFT not approved
- `PISFailed` - PIS not executed
- `ReceiptReused` - Receipt already used
- `QuoteRequiredError` - FX quote required for cross-border
- `QuoteExpiredError` - FX quote expired
- `JWEKidUnknownError` - Unknown JWE key ID
- `JWEDecryptError` - JWE decryption failed

### Example Error Handling
```python
from visa_direct_sdk.errors import QuoteRequiredError, ReceiptReused

try:
    result = builder.execute()
except QuoteRequiredError:
    # Handle missing FX quote
    pass
except ReceiptReused:
    # Handle receipt reuse
    pass
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
      "requiresMLE": true
    }
  ],
  "jwks": {
    "url": "${VISA_JWKS_URL:-https://api.visa.com/jwks}",
    "cacheTtlSeconds": 300
  }
}
```

## Testing

### Running Tests
```bash
# Basic functionality test
export VISA_BASE_URL=http://127.0.0.1:8766
python examples/fi_internal_to_card.py

# FX policy test
python -c "
from visa_direct_sdk.dx.builder import PayoutBuilder
from visa_direct_sdk.errors import QuoteRequiredError
try:
    PayoutBuilder.create().for_originator('fi-001').with_funding_internal(True,'conf-123').to_card_direct('tok').for_amount('EUR',101).execute()
except QuoteRequiredError as e:
    print('FX policy enforced:', e)
"
```

## Examples

### Basic FI Internal to Card
```python
from visa_direct_sdk.dx.builder import PayoutBuilder

def basic_payout():
    builder = PayoutBuilder.create()
    result = builder \
        .for_originator('fi-001') \
        .with_funding_internal(True, 'conf-123') \
        .to_card_direct('tok_pan_411111******1111') \
        .for_amount('USD', 101) \
        .with_idempotency_key('demo-1') \
        .execute()
    
    print('Payout result:', result)
```

### Alias Resolution with FX Quote
```python
def advanced_payout():
    builder = PayoutBuilder.create()
    result = builder \
        .for_originator('fi-001') \
        .with_funding_internal(True, 'conf-123') \
        .to_card_via_alias('dev@example.com') \
        .with_quote_lock('USD', 'EUR') \
        .for_amount('EUR', 100) \
        .execute()
    
    print('Advanced payout result:', result)
```

### Custom Stores
```python
from visa_direct_sdk.core.orchestrator import Orchestrator
from visa_direct_sdk.storage.idempotency_store import RedisIdempotencyStore
from visa_direct_sdk.storage.receipt_store import RedisReceiptStore

orchestrator = Orchestrator(
    http_client,
    idempotency_store=RedisIdempotencyStore(redis_client),
    receipt_store=RedisReceiptStore(redis_client)
)
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

## Dependencies

### Required
- `requests>=2.31.0` - HTTP client
- `jwcrypto>=1.5.6` - JWE encryption/decryption

### Optional (for production)
- `redis` - For Redis store adapters
- `pydantic` - For schema validation
- `structlog` - For structured logging
