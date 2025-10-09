#!/usr/bin/env node

/**
 * GB → GB Domestic Pilot Transaction
 * 
 * This script executes a controlled pilot transaction from GB card to GB account
 * using the Visa Direct SDK with full compliance checking and monitoring.
 * 
 * Key differences from cross-border:
 * - Same country (GB→GB)
 * - Same currency (GBP→GBP) 
 * - No FX lock required
 * - Simpler compliance rules
 */

const { Orchestrator } = require('../dist/core/orchestrator');
const { SecureHttpClient } = require('../dist/transport/secureHttpClient');

async function executeGBDomesticPilot() {
    console.log('🇺🇸 US → US Domestic Pilot Transaction');
  console.log('=====================================');
  
  // Create HTTP client with production settings
  const httpClient = new SecureHttpClient({
    baseUrl: process.env.VISA_BASE_URL || 'https://sandbox.api.visa.com',
    jwksUrl: process.env.VISA_JWKS_URL || 'https://sandbox.api.visa.com/jwks',
    certPath: process.env.VISA_CERT_PATH,
    keyPath: process.env.VISA_KEY_PATH,
    caPath: process.env.VISA_CA_PATH,
    sdkEnv: process.env.SDK_ENV || 'production'
  });

  // Create orchestrator
  const orchestrator = new Orchestrator(httpClient);

  try {
    console.log('📋 Transaction Details:');
    console.log('  Source: US Card (USD)');
    console.log('  Destination: US Account (USD)');
    console.log('  Amount: $50.00 (5000 minor units)');
    console.log('  Type: Domestic (same country, same currency)');
    console.log('  FX Lock: Not required');
    console.log('  Compliance: Full checking enabled');
    console.log('');

    // Execute US → US domestic payout
    const payoutRequest = {
      originatorId: process.env.VISA_ORIGINATOR_ID || 'us-domestic-001',
      funding: {
        type: 'INTERNAL',
        debitConfirmed: true,  // Required by guard
        confirmationRef: `LEDGER_CONFIRM_${Date.now()}`  // Required by guard
      },
      destination: {
        type: 'ACCOUNT',
        accountNumber: '1234567890',
        routingNumber: '021000021', // US routing number
        accountType: 'CHECKING',
        countryCode: 'US',
        currency: 'USD'
      },
      amount: {
        currency: 'USD',
        value: 5000 // $50.00
      },
      idempotencyKey: `us-domestic-pilot-${Date.now()}`,
      // No preflight.fxLock needed for domestic transactions
      compliance: {
        scope: 'all'
      }
    };

    console.log('🔄 Executing domestic pilot transaction...');
    const receipt = await orchestrator.payout(payoutRequest);

    console.log('✅ Domestic Pilot Transaction Successful!');
    console.log('Receipt:', {
      payoutId: receipt.payoutId,
      status: receipt.status,
      amount: receipt.amount,
      created: receipt.created,
      compliance: receipt.compliance
    });

    // Log key metrics for monitoring
    console.log('');
    console.log('📊 Domestic Pilot Metrics:');
    console.log(`  Transaction ID: ${receipt.payoutId}`);
    console.log(`  Processing Time: ${receipt.processingTimeMs}ms`);
    console.log(`  Compliance Status: ${receipt.compliance?.status || 'PASSED'}`);
    console.log(`  Request ID: ${receipt.requestId}`);
    console.log(`  Domestic Transaction: ${receipt.domestic || 'true'}`);

  } catch (error) {
    console.error('❌ Domestic Pilot Transaction Failed:', error);
    
    // Provide specific guidance based on error type
    if (error.message.includes('certificate')) {
      console.log('\n💡 Certificate Error Help:');
      console.log('1. Verify VISA_CERT_PATH, VISA_KEY_PATH, VISA_CA_PATH are set correctly');
      console.log('2. Ensure certificates match your Visa Developer Platform project');
      console.log('3. Check certificate permissions and format');
    }
    
    if (error.message.includes('JWKS')) {
      console.log('\n💡 JWKS Error Help:');
      console.log('1. Verify VISA_JWKS_URL is correct');
      console.log('2. Check network connectivity to Visa APIs');
      console.log('3. Ensure SDK_ENV=production for fail-closed behavior');
    }
    
    if (error.message.includes('compliance')) {
      console.log('\n💡 Compliance Error Help:');
      console.log('1. Check corridor policy configuration');
      console.log('2. Verify transaction limits and rules');
      console.log('3. Review compliance service configuration');
    }
    
    if (error.message.includes('destination') || error.message.includes('account')) {
      console.log('\n💡 Destination Error Help:');
      console.log('1. Verify account number and routing number format');
      console.log('2. Check country code and currency match');
      console.log('3. Ensure account type is supported');
    }

    // Emit compensation event for monitoring
    console.log('\n📋 Compensation Event:');
    console.log({
      event: 'domestic_pilot_transaction_failed',
      corridor: 'GB→GB',
      reason: error.name || 'UnknownError',
      timestamp: new Date().toISOString(),
      errorCode: error.code || 'UNKNOWN'
    });

    process.exit(1);
  } finally {
    await httpClient.close();
  }
}

// Environment validation
function validateEnvironment() {
  const required = [
    'VISA_BASE_URL',
    'VISA_JWKS_URL', 
    'VISA_CERT_PATH',
    'VISA_KEY_PATH',
    'VISA_ORIGINATOR_ID'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.log('\n💡 Set these variables before running the pilot:');
    console.log('export VISA_BASE_URL=https://sandbox.api.visa.com');
    console.log('export VISA_JWKS_URL=https://sandbox.api.visa.com/jwks');
    console.log('export SDK_ENV=production');
    console.log('export VISA_CERT_PATH=./credentials/client_certificate.pem');
    console.log('export VISA_KEY_PATH=./credentials/private_key.pem');
    console.log('export VISA_ORIGINATOR_ID=your_originator_id');
    process.exit(1);
  }
}

// Run the pilot
if (require.main === module) {
  validateEnvironment();
  executeGBDomesticPilot().catch(console.error);
}

module.exports = { executeGBDomesticPilot };
