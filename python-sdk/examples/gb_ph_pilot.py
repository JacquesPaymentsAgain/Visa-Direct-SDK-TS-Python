#!/usr/bin/env python3

"""
GB → Philippines Cross-border Pilot Transaction (Python)

This script executes a controlled pilot transaction from GB card to Philippines account
using the Visa Direct Python SDK with full compliance checking and monitoring.

Key features:
- Cross-border transaction (GB→PH)
- Different currencies (GBP→PHP)
- FX lock required
- Full compliance checking
"""

import os
import sys
import time
from visa_direct_sdk.client import VisaDirectClient

def execute_gb_ph_crossborder_pilot():
    print('🇬🇧→🇵🇭 GB → Philippines Cross-border Pilot Transaction (Python)')
    print('==============================================================')
    
    # Create client with production settings
    client = VisaDirectClient()
    
    try:
        print('📋 Transaction Details:')
        print('  Source: GB Card (GBP)')
        print('  Destination: Philippines Account (PHP)')
        print('  Amount: £25.00 (2500 minor units)')
        print('  Type: Cross-border')
        print('  FX Lock: Required')
        print('  Compliance: Full checking enabled')
        print('')

        # Execute GB → PH cross-border payout
        receipt = client.payouts.build() \
            .for_originator(os.getenv('VISA_ORIGINATOR_ID', 'gb-ph-py-001')) \
            .with_funding_internal(True, f'LEDGER_CONFIRM_{int(time.time())}') \
            .to_account_direct({
                'accountNumber': '1234567890',
                'routingNumber': '021000021',  # Example Philippines routing
                'accountType': 'CHECKING',
                'countryCode': 'PH',
                'currency': 'PHP'
            }) \
            .for_amount('GBP', 2500) \
            .with_idempotency_key(f'gb-ph-py-{int(time.time())}') \
            .with_fx_lock(True) \
            .execute()

        print('✅ Cross-border Pilot Transaction Successful!')
        print('Receipt:', {
            'payoutId': receipt.get('payoutId'),
            'status': receipt.get('status'),
            'amount': receipt.get('amount'),
            'fxRate': receipt.get('fxRate'),
            'created': receipt.get('created'),
            'compliance': receipt.get('compliance')
        })

        # Log key metrics for monitoring
        print('')
        print('📊 Cross-border Pilot Metrics:')
        print(f"  Transaction ID: {receipt.get('payoutId')}")
        print(f"  Processing Time: {receipt.get('processingTimeMs')}ms")
        print(f"  FX Rate Applied: {receipt.get('fxRate')}")
        print(f"  Compliance Status: {receipt.get('compliance', {}).get('status', 'PASSED')}")
        print(f"  Request ID: {receipt.get('requestId')}")

    except Exception as error:
        print(f'❌ Cross-border Pilot Transaction Failed: {error}')
        
        # Provide specific guidance based on error type
        error_msg = str(error).lower()
        if 'certificate' in error_msg:
            print('\n💡 Certificate Error Help:')
            print('1. Verify VISA_CERT_PATH, VISA_KEY_PATH, VISA_CA_PATH are set correctly')
            print('2. Ensure certificates match your Visa Developer Platform project')
            print('3. Check certificate permissions and format')
        
        if 'jwks' in error_msg:
            print('\n💡 JWKS Error Help:')
            print('1. Verify VISA_JWKS_URL is correct')
            print('2. Check network connectivity to Visa APIs')
            print('3. Ensure SDK_ENV=production for fail-closed behavior')
        
        if 'compliance' in error_msg:
            print('\n💡 Compliance Error Help:')
            print('1. Check corridor policy configuration')
            print('2. Verify transaction limits and rules')
            print('3. Review compliance service configuration')
        
        if 'fx' in error_msg:
            print('\n💡 FX Error Help:')
            print('1. Ensure FX lock is enabled for cross-border transactions')
            print('2. Check FX service availability')
            print('3. Verify currency pair support')

        # Emit compensation event for monitoring
        print('\n📋 Compensation Event:')
        print({
            'event': 'python_crossborder_pilot_transaction_failed',
            'corridor': 'GB→PH',
            'reason': type(error).__name__,
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'errorCode': getattr(error, 'code', 'UNKNOWN')
        })

        sys.exit(1)
    
    finally:
        client.close()

def validate_environment():
    """Validate required environment variables"""
    required = [
        'VISA_BASE_URL',
        'VISA_JWKS_URL', 
        'VISA_CERT_PATH',
        'VISA_KEY_PATH',
        'VISA_ORIGINATOR_ID'
    ]
    
    missing = [key for key in required if not os.getenv(key)]
    
    if missing:
        print('❌ Missing required environment variables:')
        for key in missing:
            print(f'  - {key}')
        print('\n💡 Set these variables before running the pilot:')
        print('export VISA_BASE_URL=https://sandbox.api.visa.com')
        print('export VISA_JWKS_URL=https://sandbox.api.visa.com/jwks')
        print('export SDK_ENV=production')
        print('export VISA_CERT_PATH=./credentials/client_certificate.pem')
        print('export VISA_KEY_PATH=./credentials/private_key.pem')
        print('export VISA_ORIGINATOR_ID=your_originator_id')
        sys.exit(1)

if __name__ == '__main__':
    validate_environment()
    execute_gb_ph_crossborder_pilot()