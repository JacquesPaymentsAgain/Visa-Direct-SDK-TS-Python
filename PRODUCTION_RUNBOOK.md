# 🛡️ PRODUCTION RUNBOOK - Visa Direct SDK

## 🚨 **Emergency Contacts & Escalation**

### **Visa Support**
- **Primary**: Visa Developer Platform Support Portal
- **Emergency**: Visa Technical Support Hotline
- **Escalation**: Visa Partner Success Manager

### **Internal Escalation**
- **L1**: Development Team Lead
- **L2**: Engineering Manager  
- **L3**: CTO/VP Engineering

---

## 🔧 **Operational Procedures**

### **Certificate Management**

#### **Hot Certificate Rotation**
```typescript
// 1. Validate new certificates
const probeClient = new VisaDirectClient({
  baseUrl: process.env.VISA_BASE_URL,
  certPath: '/new/cert.pem',
  keyPath: '/new/key.pem', 
  caPath: '/new/ca.pem'
});

// 2. Probe test
try {
  await probeClient.payouts.build()
    .forOriginator('probe-test')
    .withFundingInternal(true, 'probe-ref')
    .toCardDirect('tok_test_probe')
    .forAmount('USD', 1)
    .execute();
  console.log('✅ New certificates validated');
} catch (error) {
  console.error('❌ Certificate validation failed:', error);
  process.exit(1);
}

// 3. Hot swap
await client.reloadTransport({
  certPath: '/new/cert.pem',
  keyPath: '/new/key.pem',
  caPath: '/new/ca.pem'
});

// 4. Verify operation
await client.payouts.build()
  .forOriginator('verify-test')
  .withFundingInternal(true, 'verify-ref')
  .toCardDirect('tok_test_verify')
  .forAmount('USD', 1)
  .execute();
```

#### **Certificate Monitoring**
```bash
# Check certificate expiry
openssl x509 -in ./VDP/cert.pem -noout -dates

# Monitor certificate health
curl -v --cert ./VDP/cert.pem --key ./VDP/privateKey.pem \
  https://sandbox.api.visa.com/health
```

### **Circuit Breaker Management**

#### **JWKS Circuit Breaker Status**
```typescript
// Check circuit breaker state
const breakerState = httpClient.jwksCircuitBreaker.getState();
console.log('Circuit Breaker State:', breakerState);

// Manual reset (emergency only)
if (breakerState === 'OPEN') {
  console.log('⚠️ Circuit breaker is OPEN - JWKS service unavailable');
  // Alert: JWKS service down > 5 minutes
}
```

#### **Circuit Breaker Alerts**
```yaml
# Alert Rules
- alert: JWKSCircuitBreakerOpen
  expr: circuit_breaker_state == "OPEN"
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "JWKS Circuit Breaker OPEN for {{ $value }} minutes"
    description: "JWKS service unavailable, MLE operations failing"

- alert: JWKSHighFailureRate  
  expr: rate(jwks_fetch_failures_total[5m]) > 0.1
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "High JWKS failure rate: {{ $value }} failures/sec"
```

### **Error Handling & Retries**

#### **Retry Configuration**
```typescript
// Production retry config
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 10000,      // 10 seconds
  backoffMultiplier: 2,
  jitter: true,
  retryableStatusCodes: [429, 503, 502, 504]
};

// Monitor retry patterns
client.events.on('retry.attempt', (event) => {
  console.log(`Retry attempt ${event.attempt}/${event.maxRetries} for ${event.operation}`);
});
```

#### **Rate Limiting Response**
```typescript
// Handle 429 responses
if (error.httpStatus === 429) {
  const retryAfter = error.response.headers['retry-after'];
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
  
  // Implement client-side rate limiting
  await rateLimiter.wait(retryAfter * 1000);
}
```

---

## 🚨 **Incident Response**

### **Common Issues & Solutions**

#### **Authentication Errors (401/403)**
```bash
# Symptoms
- Many 401 Unauthorized responses
- 403 Forbidden responses
- Certificate validation errors

# Diagnosis
1. Check certificate paths and permissions
2. Verify certificate modulus matches
3. Validate program configuration
4. Check API credentials

# Resolution
1. Re-validate certificate chain
2. Check program status in VDP portal
3. Verify API key and shared secret
4. Contact Visa support if program issues
```

#### **JWE/MLE Errors**
```bash
# Symptoms  
- JWE encryption/decryption failures
- JWKS fetch errors
- Circuit breaker OPEN state

# Diagnosis
1. Check JWKS service availability
2. Verify MLE key configuration
3. Check circuit breaker state
4. Validate JWE payload format

# Resolution
1. Wait for JWKS service recovery
2. Manual circuit breaker reset (emergency)
3. Verify MLE key rotation
4. Check JWE payload structure
```

#### **High Error Rates**
```bash
# Symptoms
- Increased 4xx/5xx responses
- High retry counts
- Compensation events spike

# Diagnosis
1. Check Visa service status
2. Analyze error patterns by corridor
3. Review rate limiting
4. Check compliance policy changes

# Resolution
1. Implement client-side rate limiting
2. Adjust retry configuration
3. Review compliance policies
4. Scale horizontally if needed
```

### **Compensation Event Handling**

#### **Compensation Event Processing**
```typescript
// Monitor compensation events
client.events.on('payout_failed_requires_compensation', async (event) => {
  console.log('Compensation required:', {
    sagaId: event.sagaId,
    reason: event.reason,
    timestamp: event.timestamp,
    correlationId: event.correlationId
  });
  
  // Queue for processing
  await compensationQueue.add({
    type: 'COMPENSATION_REQUIRED',
    sagaId: event.sagaId,
    reason: event.reason,
    timestamp: event.timestamp,
    priority: 'high'
  });
});

// Process compensation
async function processCompensation(event) {
  try {
    // 1. Determine compensation type
    const compensationType = determineCompensationType(event.reason);
    
    // 2. Execute compensation
    await executeCompensation(compensationType, event);
    
    // 3. Log completion
    console.log(`Compensation completed for saga ${event.sagaId}`);
    
  } catch (error) {
    console.error(`Compensation failed for saga ${event.sagaId}:`, error);
    // Escalate to manual processing
    await escalateCompensation(event);
  }
}
```

---

## 📊 **Monitoring & Alerting**

### **Key Metrics to Monitor**

#### **Success Metrics**
```yaml
# Payout Success Rate
- payout.success_total by corridor
- payout.failure_total by corridor  
- payout.success_rate = success_total / (success_total + failure_total)

# Latency Metrics
- payout.latency_p50, p95, p99
- payout.latency_by_corridor
- payout.latency_by_rail

# Throughput Metrics
- payout.rate_per_second
- payout.rate_by_corridor
- payout.rate_by_originator
```

#### **Error Metrics**
```yaml
# Error Rates
- payout.error_rate by corridor
- payout.error_rate by error_type
- payout.error_rate by originator

# Guard Failures
- guard.failure_total{type} (LedgerNotConfirmed, ReceiptReused, ComplianceDenied)
- guard.failure_rate by type
- guard.failure_rate by corridor

# Compliance Metrics
- compliance.allowed_total vs compliance.denied_total
- compliance.denied_rate by reason
- compliance.latency_p95
```

#### **Security Metrics**
```yaml
# MLE/JWE Metrics
- jwe.encrypt_fail_total
- jwe.decrypt_fail_total
- jwks.fetch_total vs jwks.fetch_fail_total
- jwks.cache_hit_rate

# Circuit Breaker Metrics
- circuit_breaker.state (CLOSED/OPEN/HALF_OPEN)
- circuit_breaker.open_duration
- circuit_breaker.reset_count

# PII Protection
- pii.scan_results (should always be 0)
- pii.scan_failures_total
```

#### **Retry Metrics**
```yaml
# Retry Patterns
- retry.attempt_total by status_code
- retry.success_total after retry
- retry.budget_exhausted_total
- retry.latency_p95

# Rate Limiting
- rate_limit.429_total
- rate_limit.retry_after_avg
- rate_limit.client_side_total
```

### **Alert Rules**

#### **Critical Alerts**
```yaml
# Service Down
- alert: PayoutServiceDown
  expr: up{job="visa-direct-sdk"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Visa Direct SDK service is down"

# High Error Rate
- alert: HighPayoutErrorRate
  expr: rate(payout.failure_total[5m]) / rate(payout.total[5m]) > 0.05
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High payout error rate: {{ $value }}%"

# Circuit Breaker Open
- alert: JWKSCircuitBreakerOpen
  expr: circuit_breaker_state == "OPEN"
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "JWKS Circuit Breaker OPEN - MLE operations failing"
```

#### **Warning Alerts**
```yaml
# High Latency
- alert: HighPayoutLatency
  expr: histogram_quantile(0.95, rate(payout.latency_bucket[5m])) > 5000
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High payout latency: {{ $value }}ms p95"

# Compliance Denials
- alert: HighComplianceDenialRate
  expr: rate(compliance.denied_total[5m]) / rate(compliance.total[5m]) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High compliance denial rate: {{ $value }}%"

# Retry Budget Exhaustion
- alert: RetryBudgetExhaustion
  expr: rate(retry.budget_exhausted_total[5m]) > 0.01
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "Retry budget exhaustion rate: {{ $value }}"
```

---

## 🔍 **Troubleshooting Guide**

### **Debug Commands**

#### **Health Checks**
```bash
# Basic health check
curl -v https://your-service/health

# Detailed health check
curl -v https://your-service/health/detailed

# Visa API connectivity
curl -v --cert ./VDP/cert.pem --key ./VDP/privateKey.pem \
  https://sandbox.api.visa.com/health
```

#### **Log Analysis**
```bash
# Check for PII leakage
grep -E "(4111111111111111|user@example\.com|555-123-4567)" logs/*.log

# Check compliance events
grep "compliance" logs/*.log | jq '.'

# Check retry patterns
grep "retry" logs/*.log | jq '.retry_attempt'

# Check circuit breaker events
grep "circuit_breaker" logs/*.log | jq '.'
```

#### **Performance Analysis**
```bash
# Check latency percentiles
curl -s https://your-service/metrics | grep payout_latency

# Check error rates by corridor
curl -s https://your-service/metrics | grep payout_failure_total

# Check retry patterns
curl -s https://your-service/metrics | grep retry_attempt_total
```

### **Common Debug Scenarios**

#### **Slow Performance**
1. Check latency percentiles (p95, p99)
2. Analyze retry patterns
3. Check Visa API response times
4. Review compliance check latency
5. Check circuit breaker state

#### **High Error Rates**
1. Analyze error patterns by corridor
2. Check compliance policy changes
3. Review rate limiting
4. Check certificate validity
5. Verify program configuration

#### **Security Issues**
1. Run PII scan on logs
2. Check telemetry for sensitive data
3. Verify certificate rotation
4. Review compliance denials
5. Check circuit breaker behavior

---

## 📋 **Maintenance Procedures**

### **Daily Checks**
- [ ] Monitor success rates by corridor
- [ ] Check error rates and patterns
- [ ] Verify circuit breaker state
- [ ] Review compliance metrics
- [ ] Check certificate expiry dates

### **Weekly Checks**
- [ ] Analyze retry patterns
- [ ] Review compensation events
- [ ] Check PII scan results
- [ ] Update error mappings if needed
- [ ] Review compliance policies

### **Monthly Checks**
- [ ] Certificate rotation planning
- [ ] Performance trend analysis
- [ ] Security audit review
- [ ] Compliance policy updates
- [ ] Capacity planning review

---

## 📞 **Emergency Procedures**

### **Service Outage**
1. **Immediate**: Check service health endpoints
2. **Diagnose**: Review logs and metrics
3. **Escalate**: Contact Visa support if API issues
4. **Communicate**: Notify stakeholders
5. **Recover**: Implement fix or workaround
6. **Post-mortem**: Document incident and improvements

### **Security Incident**
1. **Immediate**: Isolate affected systems
2. **Assess**: Determine scope and impact
3. **Contain**: Prevent further damage
4. **Eradicate**: Remove threat
5. **Recover**: Restore normal operations
6. **Lessons**: Update security procedures

### **Data Breach**
1. **Immediate**: Stop all data processing
2. **Assess**: Determine data exposure
3. **Notify**: Contact legal and compliance
4. **Contain**: Prevent further exposure
5. **Investigate**: Root cause analysis
6. **Remediate**: Implement fixes and monitoring

---

**Last Updated**: 2024-01-15  
**Version**: 1.0  
**Next Review**: Post-pilot feedback integration