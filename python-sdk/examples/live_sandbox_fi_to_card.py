import os
import sys
from visa_direct_sdk.client import VisaDirectClient

def main():
    print('🚀 Testing Visa Direct SDK with Live Sandbox API')
    print('================================================')

    # Create client (reads from environment variables)
    client = VisaDirectClient()

    try:
        # Execute FI → Card payout using internal funds
        receipt = client.payouts.build() \
            .for_originator(os.getenv('VISA_ORIGINATOR_ID', 'fi-001')) \
            .with_funding_internal(True, 'LEDGER_CONFIRM_123') \
            .to_card_direct(os.getenv('VISA_TEST_PAN_TOKEN', 'tok_pan_411111******1111')) \
            .for_amount('USD', 101) \
            .with_idempotency_key(f'live-test-py-{int(__import__("time").time())}') \
            .execute()

        print('✅ Payout successful!')
        print('Receipt:', {
            'payoutId': receipt.get('payoutId'),
            'status': receipt.get('status'),
            'amount': receipt.get('amount'),
            'created': receipt.get('created')
        })

    except Exception as error:
        print(f'❌ Payout failed: {error}')
        
        # Provide helpful error context
        error_msg = str(error).lower()
        if 'certificate' in error_msg:
            print('\n💡 Certificate Error Help:')
            print('1. Verify your mTLS certificates are in the correct location')
            print('2. Check that VISA_CERT_PATH, VISA_KEY_PATH, VISA_CA_PATH are set correctly')
            print('3. Ensure certificates match your Visa Developer Platform project')
        
        if 'jwks' in error_msg:
            print('\n💡 JWKS Error Help:')
            print('1. Verify VISA_JWKS_URL is correct for your program')
            print('2. Check network connectivity to Visa APIs')
            print('3. Ensure SDK_ENV=production for fail-closed behavior')
        
        if '401' in error_msg or '403' in error_msg:
            print('\n💡 Authentication Error Help:')
            print('1. Verify your originator ID is correct')
            print('2. Check that your Visa Developer Platform project is active')
            print('3. Ensure mTLS certificates are properly configured')
    
    finally:
        client.close()

if __name__ == '__main__':
    main()
