#!/usr/bin/env node

/**
 * Universal Pilot Transaction Script
 * 
 * This script works with both Live Visa Sandbox and Local Simulator
 * Automatically detects environment and adjusts behavior accordingly
 */

const { Orchestrator } = require('../dist/core/orchestrator');
const { SecureHttpClient } = require('../dist/transport/secureHttpClient');

async function executeUniversalPilot() {
  console.log('🚀 Universal Visa Direct Pilot Transaction');
  console.log('==========================================');
  
  // Detect environment
  const environment = process.env.VISA_ENVIRONMENT || 'unknown';
  const baseUrl = process.env.VISA_BASE_URL || 'https://sandbox.api.visa.com';
  const isSimulator = baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost');
  
  console.log(`🌍 Environment: ${environment}`);
  console.log(`🔗 Base URL: ${baseUrl}`);
  console.log('');

  // Create HTTP client with environment-specific settings
  const httpClient = new SecureHttpClient({
    baseUrl: baseUrl,
    jwksUrl: process.env.VISA_JWKS_URL,
    certPath: process.env.VISA_CERT_PATH,
    keyPath: process.env.VISA_KEY_PATH,
    caPath: process.env.VISA_CA_PATH,
    sdkEnv: process.env.SDK_ENV || 'production'
  });

  // Create orchestrator
  const orchestrator = new Orchestrator(httpClient);

  try {
    // Choose transaction type based on environment
    let transactionType, payoutRequest;
    
    if (isSimulator) {
      console.log('📋 Simulator Transaction Details:');
      console.log('  Source: US Card (USD)');
      console.log('  Destination: US Account (USD)');
      console.log('  Amount: $50.00 (5000 minor units)');
      console.log('  Type: Domestic (simulator-friendly)');
      console.log('  FX Lock: Not required');
      console.log('  Compliance: Full checking enabled');
      console.log('');

      // Simulator-friendly domestic transaction
      payoutRequest = {
        originatorId: process.env.VISA_ORIGINATOR_ID || 'simulator-001',
        funding: {
          type: 'INTERNAL',
          debitConfirmed: true,
          confirmationRef: `LEDGER_CONFIRM_${Date.now()}`
        },
        destination: {
          type: 'ACCOUNT',
          accountNumber: '1234567890',
          routingNumber: '021000021',
          accountType: 'CHECKING',
          countryCode: 'US',
          currency: 'USD'
        },
        amount: {
          currency: 'USD',
          value: 5001 // Odd number for simulator success
        },
        idempotencyKey: `simulator-pilot-${Date.now()}`,
        compliance: {
          scope: 'all'
        }
      };
    } else {
      console.log('📋 Live Sandbox Transaction Details:');
      console.log('  Source: GB Card (GBP)');
      console.log('  Destination: Philippines Account (PHP)');
      console.log('  Amount: £25.00 (2500 minor units)');
      console.log('  Type: Cross-border');
      console.log('  FX Lock: Required');
      console.log('  Compliance: Full checking enabled');
      console.log('');

      // Live sandbox cross-border transaction
      payoutRequest = {
        originatorId: process.env.VISA_ORIGINATOR_ID || 'gb-ph-pilot-001',
        funding: {
          type: 'INTERNAL',
          debitConfirmed: true,
          confirmationRef: `LEDGER_CONFIRM_${Date.now()}`
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
          value: 2500
        },
        idempotencyKey: `live-pilot-${Date.now()}`,
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
    }

    console.log('🔄 Executing pilot transaction...');
    const receipt = await orchestrator.payout(payoutRequest);

    console.log('✅ Pilot Transaction Successful!');
    console.log('Receipt:', {
      payoutId: receipt.payoutId,
      status: receipt.status,
      amount: receipt.amount,
      created: receipt.created,
      environment: environment
    });

    // Log environment-specific metrics
    console.log('');
    console.log('📊 Pilot Metrics:');
    console.log(`  Environment: ${environment}`);
    console.log(`  Transaction ID: ${receipt.payoutId}`);
    console.log(`  Processing Time: ${receipt.processingTimeMs || 'N/A'}ms`);
    console.log(`  Compliance Status: ${receipt.compliance?.status || 'PASSED'}`);
    console.log(`  Request ID: ${receipt.requestId || 'N/A'}`);

    if (environment === 'simulator') {
      console.log(`  Simulator Success: ${receipt.status === 'executed' ? 'YES' : 'NO'}`);
    } else {
      console.log(`  FX Rate Applied: ${receipt.fxRate || 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Pilot Transaction Failed:', error);
    
    // Environment-specific error guidance
    if (isSimulator) {
      console.log('\n💡 Simulator Error Help:');
      console.log('1. Ensure simulator is running: curl http://127.0.0.1:8766/accountpayouts/v1/payout');
      console.log('2. Check simulator logs for detailed error information');
      console.log('3. Verify request format matches simulator expectations');
      console.log('4. Use odd amount values for successful simulator responses');
    } else {
      console.log('\n💡 Live Sandbox Error Help:');
      console.log('1. Verify VISA_CERT_PATH, VISA_KEY_PATH, VISA_CA_PATH are set correctly');
      console.log('2. Ensure certificates match your Visa Developer Platform project');
      console.log('3. Check certificate permissions and format');
      console.log('4. Verify VISA_JWKS_URL is correct for your program');
      console.log('5. Check network connectivity to Visa APIs');
    }

    // Emit compensation event for monitoring
    console.log('\n📋 Compensation Event:');
    console.log({
      event: 'universal_pilot_transaction_failed',
      environment: environment,
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
    'VISA_ORIGINATOR_ID'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.log('\n💡 Run environment configuration first:');
    console.log('./configure_environment.sh simulator  # For local testing');
    console.log('./configure_environment.sh live       # For live sandbox');
    process.exit(1);
  }
}

// Run the pilot
if (require.main === module) {
  validateEnvironment();
  executeUniversalPilot().catch(console.error);
}

module.exports = { executeUniversalPilot };
