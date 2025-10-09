# 🚀 Visa Direct API Transition - Quick Reference

## 📋 What You Need

### 1. Visa Developer Account
- Register at [developer.visa.com](https://developer.visa.com/)
- Create project with Visa Direct APIs enabled
- Download certificates from project credentials

### 2. Required Files
Place these in `credentials/` directory:
- `client_certificate.pem` - Your client certificate
- `private_key.pem` - Your private key
- `ca_certificate.pem` - CA certificate (if provided)

## 🔧 Quick Setup

### Step 1: Get Credentials
```bash
# Create credentials directory
mkdir -p credentials

# Download from Visa Developer Portal and place:
# - client_certificate.pem
# - private_key.pem
# - ca_certificate.pem (optional)
```

### Step 2: Run Setup Script
```bash
./setup_real_api.sh
```

### Step 3: Test Connection
```bash
./test_real_api.sh
```

## 🌐 Environment Variables

### For Real API (Production Mode)
```bash
export VISA_BASE_URL=https://sandbox.api.visa.com
export VISA_JWKS_URL=https://sandbox.api.visa.com/jwks
export SDK_ENV=production
```

### For Simulator (Development Mode)
```bash
export VISA_BASE_URL=http://127.0.0.1:8766
export SDK_ENV=dev
```

## 🧪 Testing Commands

### Python SDK Test
```bash
cd python-sdk
source .venv/bin/activate
export VISA_BASE_URL=https://sandbox.api.visa.com
export SDK_ENV=production

python -c "
from visa_direct_sdk.dx.builder import PayoutBuilder
from visa_direct_sdk.transport.secure_http_client import SecureHttpClient

client = SecureHttpClient(
    cert_path='../credentials/client_certificate.pem',
    key_path='../credentials/private_key.pem'
)

builder = PayoutBuilder.create(client)
res = builder.for_originator('YOUR_ORIGINATOR_ID').with_funding_internal(True,'conf-123').to_card_direct('test_token').for_amount('USD',101).with_idempotency_key('test').execute()
print(res)
"
```

### TypeScript SDK Test
```bash
cd typescript-sdk
export VISA_BASE_URL=https://sandbox.api.visa.com
export SDK_ENV=production

node -e "
const { PayoutBuilder } = require('./dist/dx/builder');
const { SecureHttpClient } = require('./dist/transport/secureHttpClient');

const client = new SecureHttpClient({
    certPath: '../credentials/client_certificate.pem',
    keyPath: '../credentials/private_key.pem'
});

const builder = PayoutBuilder.create(client);
builder.forOriginator('YOUR_ORIGINATOR_ID')
    .withFundingInternal(true, 'conf-123')
    .toCardDirect('test_token')
    .forAmount('USD', 101)
    .withIdempotencyKey('test')
    .execute()
    .then(res => console.log(res))
    .catch(err => console.error(err));
"
```

## 🔐 Authentication Methods

### mTLS (Mutual TLS) - Recommended
- Uses client certificate + private key
- Most secure method
- Required for production

### API Key + Shared Secret
- Alternative method
- Check Visa documentation for implementation

## 📊 API Endpoints

### Sandbox URLs
- **Base**: `https://sandbox.api.visa.com`
- **JWKS**: `https://sandbox.api.visa.com/jwks`

### Key Endpoints
- Card Payouts: `/visadirect/fundstransfer/v1/pushfunds`
- Account Payouts: `/accountpayouts/v1/payout`
- Wallet Payouts: `/walletpayouts/v1/payout`
- Alias Resolution: `/visaaliasdirectory/v1/resolve`
- FX Quotes: `/forexrates/v1/lock`

## ⚠️ Important Notes

### Differences from Simulator
1. **Authentication Required**: Real API needs proper certificates
2. **MLE/JWE Enforced**: Encryption required for sensitive endpoints
3. **Rate Limits**: Real API has rate limiting
4. **Strict Validation**: More rigorous error checking

### Expected Errors
- **Authentication errors are normal** when testing
- **401/403 errors** indicate certificates are working
- **404 errors** may indicate wrong endpoint or originator ID

## 🐛 Troubleshooting

### Certificate Issues
```bash
# Test certificate validity
openssl x509 -in credentials/client_certificate.pem -text -noout
openssl rsa -in credentials/private_key.pem -check
```

### Connectivity Issues
```bash
# Test basic connectivity
curl -X GET https://sandbox.api.visa.com/visapayouts/v3/payouts/health

# Test with certificates
curl -X GET https://sandbox.api.visa.com/visapayouts/v3/payouts/health \
  --cert credentials/client_certificate.pem \
  --key credentials/private_key.pem
```

### SDK Issues
- Ensure `SDK_ENV=production` for real API
- Check certificate file paths
- Verify JWKS URL is correct

## 📞 Support Resources

- [Visa Developer Portal](https://developer.visa.com/)
- [API Documentation](https://developer.visa.com/apibrowser)
- [Authentication Guide](https://developer.visa.com/pages/working-with-visa-apis/visa-developer-quick-start-guide)
- Project Documentation: `./mintlify-docs/`

## 🎯 Next Steps

1. **Get Credentials**: Download from Visa Developer Portal
2. **Run Setup**: Execute `./setup_real_api.sh`
3. **Test Connection**: Run `./test_real_api.sh`
4. **Get Originator ID**: From your Visa Developer project
5. **Update Tests**: Replace placeholder originator ID
6. **Start Development**: Begin real API integration

---

**Remember**: Authentication errors are expected and normal - they confirm your setup is working correctly!

