# Visa Direct API Setup Guide

## 🚀 Moving from Simulator to Real Visa Direct API

This guide will help you transition from the local simulator to the real Visa Direct sandbox API.

## 📋 Prerequisites

### 1. Visa Developer Account
- Register at [Visa Developer Portal](https://developer.visa.com/)
- Create a new project
- Enable Visa Direct APIs in your project

### 2. Required Credentials
You'll need to download these from your Visa Developer project:
- **Client Certificate** (`.pem` file)
- **Private Key** (`.pem` file) 
- **Certificate Password** (provided in portal)
- **API Key** (for some endpoints)

### 3. Sandbox Project Status
On your Visa Developer dashboard, open the project and confirm each API shows a **green** status indicator before invoking live sandbox endpoints.  
- **Green** – Ready to use; you can begin calling the API immediately.  
- **Gray** – Activation still in progress; click the refresh icon until the status updates.  
- **Red** – Activation failed; create a new project because the status will not recover.

## 🔧 Configuration Steps

### Step 1: Create Credentials Directory
```bash
mkdir -p credentials
# Place your downloaded files here:
# - client_certificate.pem
# - private_key.pem
# - ca_certificate.pem (if provided)
```

### Step 2: Set Environment Variables
```bash
# Visa Direct API Configuration
export VISA_BASE_URL=https://sandbox.api.visa.com
export VISA_JWKS_URL=https://sandbox.api.visa.com/jwks
export SDK_ENV=production

# Certificate Paths
export VISA_CERT_PATH=./credentials/client_certificate.pem
export VISA_KEY_PATH=./credentials/private_key.pem
export VISA_CA_PATH=./credentials/ca_certificate.pem

# Optional: Certificate Password
export VISA_CERT_PASSWORD=your_certificate_password
```

### Step 3: Update Endpoints Configuration
The SDKs will automatically use the real Visa Direct endpoints when you set `VISA_BASE_URL` to the sandbox URL.

## 🧪 Testing Real API Connectivity

### Test 1: Basic Connectivity
```bash
# Test basic API connectivity
curl -X GET https://sandbox.api.visa.com/visapayouts/v3/payouts/health \
  --cert ./credentials/client_certificate.pem \
  --key ./credentials/private_key.pem
```

### Test 2: Python SDK
```bash
cd python-sdk
source .venv/bin/activate
export VISA_BASE_URL=https://sandbox.api.visa.com
export SDK_ENV=production
python -c "
from visa_direct_sdk.dx.builder import PayoutBuilder
from visa_direct_sdk.transport.secure_http_client import SecureHttpClient

# Create client with certificates
client = SecureHttpClient(
    cert_path='../credentials/client_certificate.pem',
    key_path='../credentials/private_key.pem'
)

# Test basic payout
builder = PayoutBuilder.create(client)
res = builder.for_originator('your_originator_id').with_funding_internal(True,'conf-123').to_card_direct('test_token').for_amount('USD',101).with_idempotency_key('test-real-api').execute()
print('Real API Result:', res)
"
```

### Test 3: TypeScript SDK
```bash
cd typescript-sdk
export VISA_BASE_URL=https://sandbox.api.visa.com
export SDK_ENV=production
node -e "
const { PayoutBuilder } = require('./dist/dx/builder');
const { SecureHttpClient } = require('./dist/transport/secureHttpClient');

// Create client with certificates
const client = new SecureHttpClient({
  certPath: '../credentials/client_certificate.pem',
  keyPath: '../credentials/private_key.pem'
});

// Test basic payout
async function test() {
  const builder = PayoutBuilder.create(client);
  const res = await builder
    .forOriginator('your_originator_id')
    .withFundingInternal(true, 'conf-123')
    .toCardDirect('test_token')
    .forAmount('USD', 101)
    .withIdempotencyKey('test-real-api')
    .execute();
  console.log('Real API Result:', res);
}
test().catch(console.error);
"
```

## 🔐 Authentication Methods

### Method 1: mTLS (Mutual TLS) - Recommended
- Uses client certificate and private key
- Most secure method
- Required for production

### Method 2: API Key + Shared Secret
- Uses X-Pay-Token header
- Alternative authentication method
- Check Visa documentation for implementation

## 📊 Real API Endpoints

### Visa Direct Sandbox URLs
- **B2B Base URL**: `https://sandbox.api.visa.com`
- **B2C (Flex/Token) Base URL**: `https://sandbox.webapi.visa.com`
- **JWKS URL**: `https://sandbox.api.visa.com/jwks`

Set `VISA_BASE_URL` to the URL that matches the API family you are invoking. Most Visa Direct payouts stay on the B2B base URL; Flex tokenization for B2C requires the `sandbox.webapi` host.

### Key Endpoints
- **Card Payouts**: `/visadirect/fundstransfer/v1/pushfunds`
- **Account Payouts**: `/accountpayouts/v1/payout`
- **Wallet Payouts**: `/walletpayouts/v1/payout`
- **Alias Resolution**: `/visaaliasdirectory/v1/resolve`
- **FX Quotes**: `/forexrates/v1/lock`
- **PAV**: `/pav/v1/card/validation`
- **FTAI**: `/paai/v1/fundstransfer/attributes/inquiry`

## 🧪 Visa Sandbox Test Data

Visa provides canonical test values that you can reuse when building sandbox payloads. Update the timestamp fields to current values and mix in country-specific data if required.

| Request Parameter | Value |
| --- | --- |
| `businessApplicationId` | `AA` |
| `acquirerCountryCode` | `840` |
| `merchantCategoryCode` | `6012` |
| `feeProgramIndicator` | `123` |
| `cardAcceptor.terminalId` | `365539` |
| `cardAcceptor.IdCode` | `VMT200911026070` |
| `pullCardAcceptor.terminalId` | `365529` |
| `pullCardAcceptor.IdCode` | `VMT200911086070` |
| `pushCardAcceptor.terminalId` | `375539` |
| `pushCardAcceptor.IdCode` | `VMT200911026070` |
| `pointOfServiceCapability.posTerminalType` | `4` |
| `pointOfServiceCapability.posTerminalEntryCapability` | `2` |
| `pointOfServiceData.panEntryMode` | `90` |
| `pointOfServiceData.posConditionCode` | `0` |
| `pointOfServiceData.motoECIIndicator` | `0` |
| `pinData.securityRelatedControlInfo.zoneKeyIndex` | `1` |
| `pinData.securityRelatedControlInfo.pinBlockFormatCode` | `1` |
| `pinData.pinDataBlock` | `1cd948f2b961b682` |
| `magneticStripeData.track1Data` | `1010101010101010101010101010` |
| `magneticStripeData.track2Data` | `4008310000000007D130310191014085` |
| `systemsTraceAuditNumber` | `451000` |
| `pullSystemsTraceAuditNumber` | `792155` |
| `pushSystemsTraceAuditNumber` | `806805` |
| `retrievalReferenceNumber` | `330000550000` |
| `pullRetrievalReferenceNumber` | `717311813559` |
| `pushRetrievalReferenceNumber` | `717311813560` |
| `transactionIdentifier` | `381228649430011` |
| `Cavv` | `0000010926000071934977253000000000000000` |
| `localTransactionDateTime` | Current timestamp in `YYYY-MM-DDThh:mm:ss` |

## ⚠️ Important Differences from Simulator

### 1. Authentication Required
- Real API requires proper certificates
- No passthrough mode in production

### 2. MLE/JWE Encryption
- Real API enforces encryption for sensitive endpoints
- JWKS must be properly configured

### 3. Rate Limits
- Real API has rate limiting
- Implement proper retry logic

### 4. Error Handling
- Different error codes and messages
- More strict validation

## 🐛 Troubleshooting

### Common Issues

#### Certificate Errors
```bash
# Verify certificate format
openssl x509 -in client_certificate.pem -text -noout

# Test certificate with curl
curl -X GET https://sandbox.api.visa.com/visapayouts/v3/payouts/health \
  --cert client_certificate.pem \
  --key private_key.pem \
  --verbose
```

#### JWKS Issues
```bash
# Test JWKS endpoint
curl https://sandbox.api.visa.com/jwks
```

#### MLE Encryption Issues
- Ensure JWKS URL is correct
- Check certificate permissions
- Verify SDK_ENV=production

## 🧰 Visa Developer Center Playground

Download the VDC Playground from **Visa Developer → Project Dashboard → Asset Management**. The desktop utility preconfigures authentication (including mTLS, API key, and Message Level Encryption) so you can validate endpoints before wiring them into your SDKs.

Key capabilities:
- Generate `jks`/`p12` key stores from the certificate bundle.
- Exercise REST calls with the same credentials and test data listed above.
- Save sessions and export full requests/responses for debugging or support tickets.

Use the Playground to confirm payloads, then mirror the working configuration in your Python or TypeScript integration.

## 📝 Next Steps

1. **Get Credentials**: Download certificates from Visa Developer Portal
2. **Test Connectivity**: Use curl to verify basic connectivity
3. **Configure SDKs**: Update environment variables
4. **Run Tests**: Execute SDK examples with real API
5. **Monitor**: Check logs and telemetry for issues

## 🔗 Useful Links

- [Visa Developer Portal](https://developer.visa.com/)
- [Visa Direct API Documentation](https://developer.visa.com/apibrowser)
- [Authentication Guide](https://developer.visa.com/pages/working-with-visa-apis/visa-developer-quick-start-guide)
- [SDK Documentation](./mintlify-docs/)

## 📞 Support

- Visa Developer Support: Available through the portal
- SDK Issues: Check project documentation
- Authentication Issues: Verify certificate setup

