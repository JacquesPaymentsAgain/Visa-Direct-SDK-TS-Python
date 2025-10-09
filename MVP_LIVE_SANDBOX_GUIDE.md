# Visa Direct SDK MVP - Live Sandbox Integration Guide

## 🚀 Quick Start

Your Visa Direct SDK is now ready for live Visa Developer Platform integration! Here's how to get started:

### Prerequisites ✅
- ✅ Visa Developer Platform account with active project
- ✅ mTLS certificates downloaded from VDP
- ✅ Environment variables configured in `.env.local`

### One-Command Setup
```bash
npm run setup:live
```

### One-Command Testing
```bash
npm run live:ts    # Test TypeScript SDK
npm run live:py    # Test Python SDK
npm run live:test  # Test both SDKs
```

## 📁 What's Been Implemented

### ✅ Core Infrastructure
- **Client Factories**: `VisaDirectClient` for both TypeScript and Python
- **Environment Configuration**: Automatic loading from `.env.local`
- **Redis Integration**: Production-ready storage for idempotency and receipts
- **Live API Examples**: Ready-to-run examples for Visa Developer Platform

### ✅ Security Features
- **mTLS Authentication**: Automatic certificate loading
- **MLE/JWE Encryption**: Enabled for sensitive endpoints
- **Fail-Closed Behavior**: Production security with `SDK_ENV=production`
- **PII Redaction**: Automatic token masking in logs

### ✅ Developer Experience
- **One-Command Setup**: Automated environment configuration
- **Comprehensive Error Handling**: Helpful error messages with troubleshooting
- **Environment Switching**: Easy transition between simulator and live API
- **Unified API**: Identical interfaces across TypeScript and Python

## 🔧 Configuration

### Environment Variables (.env.local)
```bash
# Visa Developer Platform Configuration
VISA_BASE_URL=https://api.visa.com
VISA_JWKS_URL=https://api.visa.com/jwks

# mTLS Certificates
VISA_CERT_PATH=./secrets/visa/sandbox/client_certificate.pem
VISA_KEY_PATH=./secrets/visa/sandbox/private_key.pem
VISA_CA_PATH=./secrets/visa/sandbox/ca_certificate.pem

# SDK Configuration
SDK_ENV=production
VISA_ENV=sandbox

# Test Configuration
VISA_ORIGINATOR_ID=your_originator_id_here
VISA_TEST_PAN_TOKEN=your_test_pan_token_here

# Storage
REDIS_URL=redis://127.0.0.1:6379

# Telemetry
OTEL_DISABLED=1
```

### Certificate Setup
1. Download certificates from Visa Developer Platform
2. Place in `./secrets/visa/sandbox/`
3. Update paths in `.env.local`

## 🧪 Testing

### TypeScript SDK
```typescript
import { VisaDirectClient } from './src/client/VisaDirectClient';

const client = new VisaDirectClient();

const receipt = await client.payouts.build()
  .forOriginator(process.env.VISA_ORIGINATOR_ID!)
  .withFundingInternal(true, 'LEDGER_CONFIRM_123')
  .toCardDirect(process.env.VISA_TEST_PAN_TOKEN!)
  .forAmount('USD', 101)
  .withIdempotencyKey(`test-${Date.now()}`)
  .execute();

console.log('✅ Payout successful:', receipt);
```

### Python SDK
```python
from visa_direct_sdk.client import VisaDirectClient

client = VisaDirectClient()

receipt = client.payouts.build() \
    .for_originator(os.getenv('VISA_ORIGINATOR_ID')) \
    .with_funding_internal(True, 'LEDGER_CONFIRM_123') \
    .to_card_direct(os.getenv('VISA_TEST_PAN_TOKEN')) \
    .for_amount('USD', 101) \
    .with_idempotency_key(f'test-{int(time.time())}') \
    .execute()

print('✅ Payout successful:', receipt)
```

## 🔍 Troubleshooting

### Certificate Errors
```
💡 Certificate Error Help:
1. Verify your mTLS certificates are in the correct location
2. Check that VISA_CERT_PATH, VISA_KEY_PATH, VISA_CA_PATH are set correctly
3. Ensure certificates match your Visa Developer Platform project
```

### JWKS Errors
```
💡 JWKS Error Help:
1. Verify VISA_JWKS_URL is correct for your program
2. Check network connectivity to Visa APIs
3. Ensure SDK_ENV=production for fail-closed behavior
```

### Authentication Errors
```
💡 Authentication Error Help:
1. Verify your originator ID is correct
2. Check that your Visa Developer Platform project is active
3. Ensure mTLS certificates are properly configured
```

## 📊 Success Criteria

### ✅ Technical Validation
- [ ] Live HTTPS calls to `api.visa.com` with mTLS succeed
- [ ] MLE/JWE encryption engaged on required endpoints
- [ ] Idempotency works correctly (same key = same result)
- [ ] Receipt single-use prevents duplicate transactions
- [ ] Policy enforcement rejects invalid corridors
- [ ] No PII in logs (tokens masked, spans redacted)

### ✅ Security Validation
- [ ] Fail-closed behavior when JWKS unavailable
- [ ] Certificate validation with proper error messages
- [ ] mTLS authentication working correctly
- [ ] PII redaction in all logging and telemetry

## 🚀 Next Steps

1. **Test with Sandbox**: Run `npm run live:ts` to test TypeScript SDK
2. **Verify Security**: Ensure all security features work correctly
3. **Test Error Scenarios**: Validate error handling and recovery
4. **Move to Certification**: Update certificates and endpoints for cert environment
5. **Production Deployment**: Deploy with production certificates and monitoring

## 📚 Additional Resources

- **Documentation**: [Mintlify Docs](https://visa-direct-docs.vercel.app)
- **Landing Page**: [DevX Surface](https://visa-direct-surface.vercel.app)
- **API Reference**: Complete API documentation in `/mintlify-docs`
- **Examples**: More examples in `/typescript-sdk/examples` and `/python-sdk/examples`

---

**🎉 Congratulations!** Your Visa Direct SDK is now ready for live Visa Developer Platform integration with production-grade security and developer experience.
