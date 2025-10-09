#!/bin/bash

# Visa Direct Live Sandbox Setup Script
set -e

echo "🚀 Visa Direct Live Sandbox Setup"
echo "================================="

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

# Step 1: Create secrets directory
print_status "Creating secrets directory..."
mkdir -p secrets/visa/sandbox
print_success "Secrets directory created"

# Step 2: Create environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    print_status "Creating environment configuration..."
    cat > .env.local << 'EOF'
# Visa Developer Platform Configuration
VISA_BASE_URL=https://api.visa.com
VISA_JWKS_URL=https://api.visa.com/jwks

# mTLS Certificates (update these paths)
VISA_CERT_PATH=./secrets/visa/sandbox/client_certificate.pem
VISA_KEY_PATH=./secrets/visa/sandbox/private_key.pem
VISA_CA_PATH=./secrets/visa/sandbox/ca_certificate.pem

# SDK Configuration
SDK_ENV=production
VISA_ENV=sandbox

# Test Configuration (update with your values)
VISA_ORIGINATOR_ID=your_originator_id_here
VISA_TEST_PAN_TOKEN=your_test_pan_token_here

# Storage
REDIS_URL=redis://127.0.0.1:6379

# Telemetry
OTEL_DISABLED=1
EOF
    print_success "Environment file created: .env.local"
else
    print_warning "Environment file .env.local already exists"
fi

# Step 3: Start Redis
print_status "Starting Redis for local development..."
if ! docker ps | grep -q visa-redis; then
    docker run -d --name visa-redis -p 6379:6379 redis:7
    print_success "Redis started on port 6379"
else
    print_warning "Redis already running"
fi

# Step 4: Install dependencies
print_status "Installing dependencies..."
npm run install:all
print_success "Dependencies installed"

# Step 5: Build SDKs
print_status "Building SDKs..."
npm run build
print_success "SDKs built successfully"

echo ""
print_success "Setup completed! Next steps:"
echo ""
echo "1. Download your certificates from Visa Developer Platform"
echo "2. Place them in: ./secrets/visa/sandbox/"
echo "3. Update .env.local with your originator ID and test PAN token"
echo "4. Run: source .env.local"
echo "5. Test: npm run live:ts or npm run live:py"
echo ""
echo "For detailed instructions, see: MVP_LIVE_SANDBOX_GUIDE.md"
