import { VisaDirectClient } from '../src/client/VisaDirectClient';

async function main() {
  console.log('🚀 Testing Visa Direct SDK with Live Sandbox API');
  console.log('================================================');

  // Create client (reads from environment variables)
  const client = new VisaDirectClient();

  try {
    // Execute FI → Card payout using internal funds
    const receipt = await client.payouts.build()
      .forOriginator(process.env.VISA_ORIGINATOR_ID || 'fi-001')
      .withFundingInternal(true, 'LEDGER_CONFIRM_123')
      .toCardDirect(process.env.VISA_TEST_PAN_TOKEN || 'tok_pan_411111******1111')
      .forAmount('USD', 101) // $1.01
      .withIdempotencyKey(`live-test-${Date.now()}`)
      .execute();

    console.log('✅ Payout successful!');
    console.log('Receipt:', {
      payoutId: receipt.payoutId,
      status: receipt.status,
      amount: receipt.amount,
      created: receipt.created
    });

  } catch (error: any) {
    console.error('❌ Payout failed:', error);
    
    // Provide helpful error context
    if (error.message.includes('certificate')) {
      console.log('\n💡 Certificate Error Help:');
      console.log('1. Verify your mTLS certificates are in the correct location');
      console.log('2. Check that VISA_CERT_PATH, VISA_KEY_PATH, VISA_CA_PATH are set correctly');
      console.log('3. Ensure certificates match your Visa Developer Platform project');
    }
    
    if (error.message.includes('JWKS')) {
      console.log('\n💡 JWKS Error Help:');
      console.log('1. Verify VISA_JWKS_URL is correct for your program');
      console.log('2. Check network connectivity to Visa APIs');
      console.log('3. Ensure SDK_ENV=production for fail-closed behavior');
    }
    
    if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n💡 Authentication Error Help:');
      console.log('1. Verify your originator ID is correct');
      console.log('2. Check that your Visa Developer Platform project is active');
      console.log('3. Ensure mTLS certificates are properly configured');
    }
  } finally {
    await client.close();
  }
}

// Run with environment variables
if (require.main === module) {
  main().catch(console.error);
}
