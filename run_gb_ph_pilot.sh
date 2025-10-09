#!/bin/bash

# GB → Philippines Pilot Transaction Setup
# This script prepares the environment and executes the first pilot transaction

set -e

echo "🚀 GB → Philippines Pilot Transaction Setup"
echo "==========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Step 1: Validate environment
print_status "Validating environment..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning "Environment file .env.local not found"
    print_status "Creating environment template..."
    
    cat > .env.local << 'EOF'
# Visa Developer Platform Configuration
VISA_BASE_URL=https://sandbox.api.visa.com
VISA_JWKS_URL=https://sandbox.api.visa.com/jwks

# mTLS Certificates (update these paths)
VISA_CERT_PATH=./credentials/client_certificate.pem
VISA_KEY_PATH=./credentials/private_key.pem
VISA_CA_PATH=./credentials/ca_certificate.pem

# SDK Configuration
SDK_ENV=production
VISA_ENV=sandbox

# Test Configuration (REQUIRED - update with your values)
VISA_ORIGINATOR_ID=your_originator_id_here

# Storage
REDIS_URL=redis://127.0.0.1:6379

# Telemetry
OTEL_DISABLED=1
EOF
    
    print_warning "Please update .env.local with your actual values before proceeding"
    print_status "Required updates:"
    echo "  - VISA_ORIGINATOR_ID: Your Visa Developer Platform originator ID"
    echo "  - Certificate paths: Point to your downloaded certificates"
    echo ""
    read -p "Press Enter after updating .env.local..."
fi

# Source environment
source .env.local

# Validate required variables
required_vars=("VISA_BASE_URL" "VISA_JWKS_URL" "VISA_CERT_PATH" "VISA_KEY_PATH" "VISA_ORIGINATOR_ID")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set"
        exit 1
    fi
done

print_success "Environment validated"

# Step 2: Check certificates
print_status "Checking certificates..."

if [ ! -f "$VISA_CERT_PATH" ]; then
    print_error "Certificate file not found: $VISA_CERT_PATH"
    print_status "Please download your certificates from Visa Developer Portal"
    print_status "Place them in the ./credentials/ directory"
    exit 1
fi

if [ ! -f "$VISA_KEY_PATH" ]; then
    print_error "Private key file not found: $VISA_KEY_PATH"
    exit 1
fi

print_success "Certificates found"

# Step 3: Build SDKs
print_status "Building SDKs..."

# Build TypeScript SDK
cd typescript-sdk
npm run build
cd ..

print_success "SDKs built"

# Step 4: Test connectivity
print_status "Testing Visa API connectivity..."

# Test basic connectivity with curl
if command -v curl &> /dev/null; then
    print_status "Testing basic API connectivity..."
    if curl -s --connect-timeout 10 "$VISA_BASE_URL" > /dev/null; then
        print_success "API connectivity confirmed"
    else
        print_warning "API connectivity test failed, but continuing..."
    fi
else
    print_warning "curl not available, skipping connectivity test"
fi

# Step 5: Execute pilot transaction
print_status "Executing GB → PH pilot transaction..."

echo ""
echo "📋 Pilot Transaction Configuration:"
echo "  Source Country: GB (Great Britain)"
echo "  Target Country: PH (Philippines)"
echo "  Source Currency: GBP"
echo "  Target Currency: PHP"
echo "  Amount: £25.00 (2500 minor units)"
echo "  FX Lock: Required (cross-border)"
echo "  Compliance: Full checking enabled"
echo "  Daily Limit: 5 transactions"
echo "  Max Value: £250.00 (25000 minor units)"
echo ""

# Ask for confirmation
read -p "Proceed with pilot transaction? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Pilot transaction cancelled"
    exit 0
fi

# Execute TypeScript version
print_status "Running TypeScript pilot transaction..."
cd typescript-sdk
if node examples/gb_ph_pilot.js; then
    print_success "TypeScript pilot transaction completed"
else
    print_error "TypeScript pilot transaction failed"
    exit 1
fi
cd ..

# Step 6: Monitor results
print_status "Pilot transaction completed!"
print_status "Check the following for monitoring:"
echo "  - Transaction receipt details above"
echo "  - Telemetry spans in logs"
echo "  - Compliance status"
echo "  - FX rate applied"
echo "  - Processing time"
echo ""

# Step 7: Next steps
print_success "🎉 GB → PH Pilot Transaction Complete!"
echo ""
print_status "Next Steps:"
echo "1. Review transaction results above"
echo "2. Check Visa Developer Portal for transaction status"
echo "3. Monitor telemetry and compliance metrics"
echo "4. If successful, consider expanding to other corridors"
echo "5. If issues found, review error messages and fix configuration"
echo ""
print_status "For production deployment:"
echo "1. Update VISA_BASE_URL to production endpoint"
echo "2. Use production certificates"
echo "3. Configure monitoring and alerting"
echo "4. Set up proper logging and telemetry"
echo ""

print_success "Pilot setup complete! 🚀"
