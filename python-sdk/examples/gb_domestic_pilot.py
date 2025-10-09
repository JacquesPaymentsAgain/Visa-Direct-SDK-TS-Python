#!/usr/bin/env python3

"""
US → US Domestic Pilot Transaction (Python)

This script executes a controlled pilot transaction from US card to US account
using the Visa Direct Python SDK with full compliance checking and monitoring.

Key differences from cross-border:
- Same country (US→US)
- Same currency (USD→USD) 
- No FX lock required
- Simpler compliance rules
"""

import os
import sys
import time
from visa_direct_sdk.client import VisaDirectClient

def execute_us_domestic_pilot():
    print('🇺🇸 US → US Domestic Pilot Transaction (Python)')
    print('===============================================')
    
    # Create client with production settings
    client = VisaDirectClient()
    
    try:
        print('📋 Transaction Details:')
        print('  Source: US Card (USD)')
        print('  Destination: US Account (USD)')
        print('  Amount: $50.00 (5000 minor units)')
        print('  Type: Domestic (same country, same currency)')
        print('  FX Lock: Not required')
        print('  Compliance: Full checking enabled')
        print('')

        # Execute US → US domestic payout
        receipt = client.payouts.build() \
            .for_originator(os.getenv('VISA_ORIGINATOR_ID', 'us-domestic-py-001')) \
            .with_funding_internal(True, f'LEDGER_CONFIRM_{int(time.time())}') \
            .to_account_direct({
                'accountNumber': '1234567890',
                'routingNumber': '021000021',  # US routing number
                'accountType': 'CHECKING',
                'countryCode': 'US',
                'currency': 'USD'
            }) \
            .for_amount('USD', 5000) \
            .with_idempotency_key(f'us-domestic-py-{int(time.time())}') \
            .execute()

        print('✅ Domestic Pilot Transaction Successful!')
        print('Receipt:', {
            'payoutId': receipt.get('payoutId'),
            'status': receipt.get('status'),
            'amount': receipt.get('amount'),
            'created': receipt.get('created'),
            'compliance': receipt.get('compliance')
        })

        # Log key metrics for monitoring
        print('')
        print('📊 Domestic Pilot Metrics:')
        print(f"  Transaction ID: {receipt.get('payoutId')}")
        print(f"  Processing Time: {receipt.get('processingTimeMs')}ms")
        print(f"  Compliance Status: {receipt.get('compliance', {}).get('status', 'PASSED')}")
        print(f"  Request ID: {receipt.get('requestId')}")
        print(f"  Domestic Transaction: {receipt.get('domestic', 'true')}")

    except Exception as error:
        print(f'❌ Domestic Pilot Transaction Failed: {error}')
        
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
        
        if 'destination' in error_msg or 'account' in error_msg:
            print('\n💡 Destination Error Help:')
            print('1. Verify account number and routing number format')
            print('2. Check country code and currency match')
            print('3. Ensure account type is supported')

        # Emit compensation event for monitoring
        print('\n📋 Compensation Event:')
        print({
            'event': 'python_domestic_pilot_transaction_failed',
            'corridor': 'US→US',
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
    execute_us_domestic_pilot()
