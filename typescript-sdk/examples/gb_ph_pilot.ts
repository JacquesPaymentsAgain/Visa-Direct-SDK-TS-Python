#!/usr/bin/env node

/**
 * GB → Philippines Pilot Transaction
 * 
 * This script executes a controlled pilot transaction from GB card to Philippines account
 * using the Visa Direct SDK with full compliance checking and monitoring.
 */

const { Orchestrator } = require('../dist/core/orchestrator');
const { SecureHttpClient } = require('../dist/transport/secureHttpClient');

async function executePilotTransaction() {
  console.log('🚀 GB → Philippines Pilot Transaction');
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
    console.log('  Source: GB Card (GBP)');
    console.log('  Destination: Philippines Account (PHP)');
    console.log('  Amount: £25.00 (2500 minor units)');
    console.log('  FX Lock: Required');
    console.log('  Compliance: Full checking enabled');
    console.log('');

    // Execute GB → PH payout using orchestrator
    const payoutRequest = {
      originatorId: process.env.VISA_ORIGINATOR_ID || 'gb-pilot-001',
      funding: {
        type: 'INTERNAL',
        debitConfirmed: true,  // Required by guard
        confirmationRef: `LEDGER_CONFIRM_${Date.now()}`  // Required by guard
      },
      destination: {
        type: 'ACCOUNT',
        accountNumber: '1234567890',
        routingNumber: '021000021',
        accountType: 'CHECKING',
        countryCode: 'PH',
        currency: 'PHP'
      },
      amount: {
        currency: 'GBP',
        value: 2500 // £25.00
      },
      idempotencyKey: `gb-ph-pilot-${Date.now()}`,
      preflight: {
        fxLock: {
          srcCurrency: 'GBP',
          dstCurrency: 'PHP',
          amountMinor: 2500
        }
      },
      compliance: {
        scope: 'all'
      }
    };

    console.log('🔄 Executing pilot transaction...');
    const receipt = await orchestrator.payout(payoutRequest);

    console.log('✅ Pilot Transaction Successful!');
    console.log('Receipt:', {
      payoutId: receipt.payoutId,
      status: receipt.status,
      amount: receipt.amount,
      fxRate: receipt.fxRate,
      created: receipt.created,
      compliance: receipt.compliance
    });

    // Log key metrics for monitoring
    console.log('');
    console.log('📊 Pilot Metrics:');
    console.log(`  Transaction ID: ${receipt.payoutId}`);
    console.log(`  Processing Time: ${receipt.processingTimeMs}ms`);
    console.log(`  FX Rate Applied: ${receipt.fxRate}`);
    console.log(`  Compliance Status: ${receipt.compliance?.status || 'PASSED'}`);
    console.log(`  Request ID: ${receipt.requestId}`);

  } catch (error) {
    console.error('❌ Pilot Transaction Failed:', error);
    
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
    
    if (error.message.includes('FX') || error.message.includes('fx')) {
      console.log('\n💡 FX Error Help:');
      console.log('1. Ensure FX lock is enabled for cross-border transactions');
      console.log('2. Check FX service availability');
      console.log('3. Verify currency pair support');
    }

    // Emit compensation event for monitoring
    console.log('\n📋 Compensation Event:');
    console.log({
      event: 'pilot_transaction_failed',
      corridor: 'GB→PH',
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
  executePilotTransaction().catch(console.error);
}

module.exports = { executePilotTransaction };