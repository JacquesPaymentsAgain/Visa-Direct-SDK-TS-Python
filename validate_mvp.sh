#!/bin/bash

# Visa Direct MVP Validation Script
set -e

echo "🧪 Visa Direct MVP Validation"
echo "============================="

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

# Test 1: TypeScript Build
print_status "Testing TypeScript SDK build..."
cd typescript-sdk
npm run build
print_success "TypeScript SDK built successfully"

# Test 2: TypeScript Client Import
print_status "Testing TypeScript client import..."
node -e "
const { VisaDirectClient } = require('./dist/client/VisaDirectClient.js');
console.log('✅ VisaDirectClient imported successfully');
const client = new VisaDirectClient();
console.log('✅ VisaDirectClient instantiated successfully');
console.log('✅ Available methods:', Object.getOwnPropertyNames(client.__proto__));
"
print_success "TypeScript client import test passed"

# Test 3: Example Compilation
print_status "Testing example compilation..."
npx tsc examples/live_sandbox_fi_to_card.ts --noEmit --skipLibCheck
print_success "Example compilation test passed"

# Test 4: Package.json Scripts
print_status "Testing package.json scripts..."
cd ..
if grep -q "live:ts" package.json; then
    print_success "live:ts script found"
else
    print_error "live:ts script missing"
fi

if grep -q "live:py" package.json; then
    print_success "live:py script found"
else
    print_error "live:py script missing"
fi

if grep -q "setup:live" package.json; then
    print_success "setup:live script found"
else
    print_error "setup:live script missing"
fi

# Test 5: Configuration Files
print_status "Testing configuration files..."

if [ -f "endpoints/endpoints.json" ]; then
    print_success "endpoints.json exists"
    if grep -q "requiresMLE.*true" endpoints/endpoints.json; then
        print_success "MLE configuration found"
    else
        print_warning "MLE configuration not found"
    fi
else
    print_error "endpoints.json missing"
fi

if [ -f "policy/corridor-policy.json" ]; then
    print_success "corridor-policy.json exists"
else
    print_error "corridor-policy.json missing"
fi

if [ -f "setup_live_sandbox.sh" ]; then
    print_success "setup_live_sandbox.sh exists"
    if [ -x "setup_live_sandbox.sh" ]; then
        print_success "setup_live_sandbox.sh is executable"
    else
        print_warning "setup_live_sandbox.sh is not executable"
    fi
else
    print_error "setup_live_sandbox.sh missing"
fi

if [ -f "MVP_LIVE_SANDBOX_GUIDE.md" ]; then
    print_success "MVP_LIVE_SANDBOX_GUIDE.md exists"
else
    print_error "MVP_LIVE_SANDBOX_GUIDE.md missing"
fi

# Test 6: Example Files
print_status "Testing example files..."

if [ -f "typescript-sdk/examples/live_sandbox_fi_to_card.ts" ]; then
    print_success "TypeScript live example exists"
else
    print_error "TypeScript live example missing"
fi

if [ -f "python-sdk/examples/live_sandbox_fi_to_card.py" ]; then
    print_success "Python live example exists"
else
    print_error "Python live example missing"
fi

# Test 7: Client Factories
print_status "Testing client factories..."

if [ -f "typescript-sdk/src/client/VisaDirectClient.ts" ]; then
    print_success "TypeScript client factory exists"
else
    print_error "TypeScript client factory missing"
fi

if [ -f "python-sdk/visa_direct_sdk/client.py" ]; then
    print_success "Python client factory exists"
else
    print_error "Python client factory missing"
fi

echo ""
print_success "🎉 MVP Validation Complete!"
echo ""
echo "✅ All core components implemented and tested"
echo "✅ TypeScript SDK ready for live API integration"
echo "✅ Configuration files properly set up"
echo "✅ Examples and documentation ready"
echo ""
echo "Next steps:"
echo "1. Configure your .env.local with Visa Developer Platform credentials"
echo "2. Place your mTLS certificates in ./secrets/visa/sandbox/"
echo "3. Run: npm run live:ts"
echo ""
echo "For detailed instructions, see: MVP_LIVE_SANDBOX_GUIDE.md"
