# Simulator Documentation

## Overview
The Flask simulator provides a testing environment for the Visa Direct SDK, implementing all required endpoints with deterministic behavior for development and testing.

## Setup
```bash
cd simulator
python3 -m pip install -r requirements.txt
python3 app.py
```

The simulator runs on `http://127.0.0.1:8766` by default.

## Endpoints

### Payout Endpoints

#### Card Payout (OCT)
- **POST** `/visadirect/fundstransfer/v1/pushfunds`
- **Behavior**: Executes if `amount.minor` is odd, fails if even
- **Response**: `{ "payoutId": "...", "status": "executed|failed", "destination": "card", "amount": {...}, "created": "..." }`

#### Account Payout
- **POST** `/accountpayouts/v1/payout`
- **Behavior**: Executes if `amount.minor` is odd, fails if even
- **Response**: `{ "payoutId": "...", "status": "executed|failed", "destination": "account", "amount": {...}, "created": "..." }`

#### Wallet Payout
- **POST** `/walletpayouts/v1/payout`
- **Behavior**: Executes if `amount.minor` is odd, fails if even
- **Response**: `{ "payoutId": "...", "status": "executed|failed", "destination": "wallet", "amount": {...}, "created": "..." }`

#### Payout Status
- **GET** `/visapayouts/v3/payouts/<payout_id>`
- **Behavior**: Returns stored payout data or 404 if not found

### Funding Endpoints

#### AFT/PIS Funding
- **POST** `/visadirect/fundstransfer/v1/pullfunds`
- **Behavior**: Approved if `amount.minor` is odd, declined if even
- **Response**: `{ "fundingType": "AFT|PIS", "status": "approved|declined", "receiptId": "...", "amount": {...}, "created": "..." }`

### Preflight Endpoints

#### Alias Resolution
- **POST** `/visaaliasdirectory/v1/resolve`
- **Request**: `{ "alias": "dev@example.com", "aliasType": "EMAIL" }`
- **Response**: `{ "alias": "...", "aliasType": "...", "credentialType": "CARD", "panToken": "..." }`
- **Behavior**: Deterministic panToken generation from alias hash

#### Card Validation (PAV)
- **POST** `/pav/v1/card/validation`
- **Request**: `{ "panToken": "..." }`
- **Response**: `{ "cardStatus": "GOOD|BAD" }`
- **Behavior**: GOOD unless panToken ends with '0'

#### Fund Transfer Attributes (FTAI)
- **POST** `/paai/v1/fundstransfer/attributes/inquiry`
- **Request**: `{ "panToken": "..." }`
- **Response**: `{ "octEligible": true|false, "reasonCodes": [...] }`
- **Behavior**: Eligible unless panToken ends with '9'

#### Payout Validation
- **POST** `/visapayouts/v3/payouts/validate`
- **Request**: Any payload
- **Response**: `{ "valid": true, "warnings": [] }`
- **Behavior**: Always valid

### FX Endpoints

#### FX Quote Lock
- **POST** `/forexrates/v1/lock`
- **Request**: `{ "src": "USD", "dst": "EUR", "amount": { "minor": 100 } }`
- **Response**: `{ "quoteId": "Q-...", "expiresAt": "2025-10-07T15:06:35.393Z" }`
- **Behavior**: Generates deterministic quoteId and current timestamp

## Idempotency Support

All endpoints support idempotency via the `x-idempotency-key` header:
- First request with a key stores the response
- Subsequent requests with the same key return the stored response
- No duplicate network effects

## Testing Patterns

### Successful Payouts
Use odd `amount.minor` values for successful operations:
```json
{ "amount": { "currency": "USD", "minor": 101 } }
```

### Failed Payouts
Use even `amount.minor` values for failed operations:
```json
{ "amount": { "currency": "USD", "minor": 100 } }
```

### Card Validation
- GOOD: panToken ending in any digit except '0'
- BAD: panToken ending in '0'

### OCT Eligibility
- Eligible: panToken ending in any digit except '9'
- Not Eligible: panToken ending in '9'

## Example Requests

### Basic Card Payout
```bash
curl -X POST http://127.0.0.1:8766/visadirect/fundstransfer/v1/pushfunds \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-1" \
  -d '{
    "originatorId": "fi-001",
    "funding": {"type": "INTERNAL", "debitConfirmed": true, "confirmationRef": "conf-123"},
    "destination": {"type": "CARD", "panToken": "tok_pan_411111******1111"},
    "amount": {"currency": "USD", "minor": 101}
  }'
```

### Alias Resolution
```bash
curl -X POST http://127.0.0.1:8766/visaaliasdirectory/v1/resolve \
  -H "Content-Type: application/json" \
  -d '{"alias": "dev@example.com", "aliasType": "EMAIL"}'
```

### FX Quote Lock
```bash
curl -X POST http://127.0.0.1:8766/forexrates/v1/lock \
  -H "Content-Type: application/json" \
  -d '{"src": "USD", "dst": "EUR", "amount": {"minor": 100}}'
```

## Development Notes

### Deterministic Behavior
The simulator uses deterministic algorithms to ensure consistent test results:
- Alias → panToken: SHA256 hash of alias
- Payout success: Based on amount minor parity
- Card validation: Based on panToken last character
- FX quotes: Based on source currency hash

### In-Memory Storage
- Idempotency responses stored in `IDEMPOTENCY_STORE`
- Payout statuses stored in `PAYOUT_STATUS`
- Used receipts tracked in `USED_RECEIPTS`
- Alias mappings stored in `ALIAS_MAP`

### Error Responses
- 404 for unknown payout IDs
- Standard HTTP status codes
- JSON error responses with descriptive messages

## Integration with SDKs

### TypeScript SDK
```typescript
export VISA_BASE_URL=http://127.0.0.1:8766
node dist/examples/fi_internal_to_card.js
```

### Python SDK
```python
export VISA_BASE_URL=http://127.0.0.1:8766
python examples/fi_internal_to_card.py
```

## Limitations

### Production Differences
- No real MLE/JWE encryption (passes through plaintext)
- No real JWKS validation
- Simplified error responses
- No rate limiting or authentication
- Deterministic rather than realistic response times

### Testing Considerations
- Simulator state persists across requests within a session
- Restart simulator to reset state
- Use unique idempotency keys for different test scenarios
- Monitor simulator logs for debugging

## Troubleshooting

### Common Issues
1. **Port already in use**: Change port in `app.py` or kill existing process
2. **Import errors**: Ensure Flask is installed (`pip install Flask`)
3. **Connection refused**: Verify simulator is running on correct port
4. **Unexpected responses**: Check request format matches expected schema

### Debug Mode
Add debug logging to `app.py`:
```python
app.run(host="127.0.0.1", port=8766, debug=True)
```

This enables:
- Detailed error messages
- Request/response logging
- Auto-reload on code changes
