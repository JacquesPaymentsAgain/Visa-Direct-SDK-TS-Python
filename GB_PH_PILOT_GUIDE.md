# 🇬🇧→🇵🇭 GB to Philippines Pilot Transaction Guide

## 🎯 Pilot Overview

This guide walks you through executing your first controlled pilot transaction from a GB (Great Britain) card to a Philippines account using the Visa Direct SDK.

### Pilot Configuration
- **Source**: GB Card (GBP)
- **Destination**: Philippines Account (PHP)  
- **Amount**: £25.00 (2500 minor units)
- **Type**: Cross-border with FX lock required
- **Compliance**: Full checking enabled
- **Limits**: 5 transactions/day, max £250.00

## 📋 Prerequisites

### 1. Visa Developer Account Setup
- [ ] Register at [Visa Developer Portal](https://developer.visa.com/)
- [ ] Create a new project
- [ ] Enable Visa Direct APIs
- [ ] Download certificates (client_certificate.pem, private_key.pem)
- [ ] Note your Originator ID

### 2. Environment Setup
- [ ] Node.js 18+ installed
- [ ] Python 3.9+ installed
- [ ] Certificates downloaded and placed in `./credentials/`
- [ ] Environment variables configured

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Run the complete pilot setup and execution
npm run pilot:gb-ph
```

### Option 2: Manual Steps
```bash
# 1. Set up environment
source .env.local

# 2. Build SDKs
npm run build

# 3. Run TypeScript pilot
npm run pilot:ts

# 4. Or run Python pilot
npm run pilot:py
```

## 🔧 Environment Configuration

Create or update `.env.local`:

```bash
# Visa Developer Platform Configuration
VISA_BASE_URL=https://sandbox.api.visa.com
VISA_JWKS_URL=https://sandbox.api.visa.com/jwks

# mTLS Certificates
VISA_CERT_PATH=./credentials/client_certificate.pem
VISA_KEY_PATH=./credentials/private_key.pem
VISA_CA_PATH=./credentials/ca_certificate.pem

# SDK Configuration
SDK_ENV=production
VISA_ENV=sandbox

# REQUIRED: Your Visa Developer Originator ID
VISA_ORIGINATOR_ID=your_originator_id_here

# Storage
REDIS_URL=redis://127.0.0.1:6379

# Telemetry
OTEL_DISABLED=1
```

## 📊 Pilot Transaction Details

### Transaction Flow
1. **Validation**: Check corridor policy (GB→PH)
2. **Compliance**: Full compliance checking enabled
3. **FX Lock**: Required for cross-border transaction
4. **Funding**: Internal ledger confirmation
5. **Execution**: Visa Direct API call
6. **Monitoring**: Telemetry and compensation events

### Expected Results
```json
{
  "payoutId": "payout_123456789",
  "status": "COMPLETED",
  "amount": {
    "currency": "GBP",
    "value": 2500
  },
  "fxRate": 68.45,
  "compliance": {
    "status": "PASSED",
    "checks": ["AML", "KYC", "SANCTIONS"]
  },
  "processingTimeMs": 1250,
  "requestId": "req_abc123"
}
```

## 🔍 Monitoring & Observability

### Key Metrics to Watch
- **Success Rate**: `payout.success_total / payout.failure_total`
- **Compliance**: `compliance.passed_total / compliance.failed_total`
- **FX Performance**: `fx.lock_success_total / fx.lock_failure_total`
- **Processing Time**: `payout.processing_time_p95`

### Telemetry Spans
The SDK generates OpenTelemetry spans for:
- `orchestrator.payout` - Main transaction flow
- `orchestrator.guards` - Guard validation
- `orchestrator.compliance` - Compliance checking
- `secureHttpClient.post` - API communication
- `fx.lock` - FX rate locking

### Compensation Events
Monitor for compensation events:
```json
{
  "event": "payout_failed_requires_compensation",
  "sagaId": "gb-ph-pilot-1234567890",
  "reason": "NetworkError",
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

## 🚨 Troubleshooting

### Common Issues

#### Certificate Errors
```bash
# Verify certificate format
openssl x509 -in credentials/client_certificate.pem -text -noout

# Test with curl
curl -X GET https://sandbox.api.visa.com/visapayouts/v3/payouts/health \
  --cert credentials/client_certificate.pem \
  --key credentials/private_key.pem
```

#### JWKS Issues
```bash
# Test JWKS endpoint
curl https://sandbox.api.visa.com/jwks
```

#### Compliance Failures
- Check corridor policy configuration
- Verify transaction limits
- Review compliance service logs

#### FX Lock Failures
- Ensure FX service is available
- Check currency pair support
- Verify FX lock configuration

### Error Codes Reference
- `CERT_AUTH_FAILED`: Certificate authentication failed
- `JWKS_UNAVAILABLE`: JWKS service unavailable
- `COMPLIANCE_DENIED`: Transaction blocked by compliance
- `FX_LOCK_FAILED`: FX rate lock failed
- `INSUFFICIENT_FUNDS`: Ledger confirmation failed

## 📈 Success Criteria

### Pilot Success Indicators
- [ ] Transaction completes successfully
- [ ] Compliance checks pass
- [ ] FX rate locked and applied
- [ ] Telemetry spans generated correctly
- [ ] No PII leakage in logs
- [ ] Processing time < 5 seconds
- [ ] Request ID properly traced

### Post-Pilot Actions
1. **Review Results**: Analyze transaction metrics
2. **Check Logs**: Verify no errors or warnings
3. **Validate Compliance**: Confirm all checks passed
4. **Monitor Telemetry**: Check span attributes
5. **Document Issues**: Note any problems encountered

## 🔄 Next Steps

### If Pilot Succeeds
1. **Expand Corridors**: Add more country pairs
2. **Increase Limits**: Gradually raise transaction limits
3. **Production Prep**: Move to production endpoints
4. **Monitoring Setup**: Configure alerts and dashboards

### If Pilot Fails
1. **Debug Issues**: Review error messages and logs
2. **Fix Configuration**: Update certificates or settings
3. **Retry Transaction**: Run pilot again after fixes
4. **Contact Support**: Escalate if issues persist

## 📞 Support Resources

- **Visa Developer Portal**: [developer.visa.com](https://developer.visa.com/)
- **API Documentation**: Check your project dashboard
- **SDK Issues**: Review project documentation
- **Authentication**: Verify certificate setup

## 🏷️ Version Information

- **SDK Version**: v0.9.0-pilot
- **Pilot Date**: 2025-01-09
- **Corridor**: GB→PH
- **Status**: Ready for execution

---

**Ready to execute your first pilot transaction? Run `npm run pilot:gb-ph` to get started! 🚀**
