#!/bin/bash

# Visa Direct SDK Environment Configuration
# Allows users to choose between Live Visa Sandbox and Local Simulator

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() { echo -e "${BLUE}$1${NC}"; }
print_success() { echo -e "${GREEN}$1${NC}"; }
print_warning() { echo -e "${YELLOW}$1${NC}"; }
print_error() { echo -e "${RED}$1${NC}"; }

print_header "🔧 Visa Direct SDK Environment Configuration"
echo "=================================================="
echo ""

# Check if simulator is running
check_simulator() {
    if curl -s http://127.0.0.1:8766/accountpayouts/v1/payout > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Start simulator if not running
start_simulator() {
    print_warning "Starting Visa Direct Simulator..."
    cd simulator
    python3 app.py &
    SIMULATOR_PID=$!
    cd ..
    
    # Wait for simulator to start
    sleep 3
    
    if check_simulator; then
        print_success "✅ Simulator started successfully (PID: $SIMULATOR_PID)"
        echo "SIMULATOR_PID=$SIMULATOR_PID" > .simulator.pid
    else
        print_error "❌ Failed to start simulator"
        exit 1
    fi
}

# Stop simulator
stop_simulator() {
    if [ -f .simulator.pid ]; then
        SIMULATOR_PID=$(cat .simulator.pid)
        kill $SIMULATOR_PID 2>/dev/null || true
        rm -f .simulator.pid
        print_success "✅ Simulator stopped"
    fi
}

# Configure for Live Visa Sandbox
configure_live_sandbox() {
    print_header "🌐 Configuring for Live Visa Sandbox"
    echo ""
    
    cat > .env.live << EOF
# Live Visa Developer Sandbox Configuration
VISA_BASE_URL=https://sandbox.api.visa.com
VISA_JWKS_URL=https://sandbox.api.visa.com/jwks
VISA_CERT_PATH=./VDP/cert.pem
VISA_KEY_PATH=./VDP/privateKey-b8a134ff-be32-4d2e-91c7-a1d3a64e36d7.pem
VISA_CA_PATH=./VDP/SBX-2024-Prod-Root.pem

# Two-way SSL credentials
VISA_USERNAME=EZANQAD1ODZ8RFMIBKZU21Lj1JZ5mZYoTvPthJtMCicdKy_oY
VISA_PASSWORD=5Q2skcZWsbkDHJ9sq9UQ

# Message Level Encryption (optional)
VISA_MLE_KEY_ID=2c5adc04-3f11-4c84-be3e-e471800b7577
VISA_MLE_PUBLIC_KEY_PATH=./VDP/mle-public.pem
VISA_MLE_PRIVATE_KEY_PATH=./VDP/mle-private.pem

# SDK runtime configuration
VISA_ENDPOINTS_FILE=./endpoints/endpoints.json
SDK_ENV=production
VISA_ENV=sandbox

# Originator ID
VISA_ORIGINATOR_ID=EZANQAD1ODZ8RFMIBKZU21Lj1JZ5mZYoTvPthJtMCicdKy_oY

# Environment indicator
VISA_ENVIRONMENT=live_sandbox
EOF

    print_success "✅ Live sandbox configuration created (.env.live)"
    echo ""
    echo "📋 Live Sandbox Features:"
    echo "  - Real Visa Direct API endpoints"
    echo "  - Full MLE/JWE encryption"
    echo "  - Real JWKS validation"
    echo "  - Production-grade security"
    echo "  - Real transaction processing"
    echo ""
    print_warning "⚠️  Note: Requires valid certificates and may have rate limits"
}

# Configure for Local Simulator
configure_simulator() {
    print_header "🏠 Configuring for Local Simulator"
    echo ""
    
    # Start simulator if not running
    if ! check_simulator; then
        start_simulator
    else
        print_success "✅ Simulator already running"
    fi
    
    cat > .env.simulator << EOF
# Local Visa Direct Simulator Configuration
VISA_BASE_URL=http://127.0.0.1:8766
VISA_JWKS_URL=http://127.0.0.1:8766/jwks
VISA_CERT_PATH=./simulator/cert.pem
VISA_KEY_PATH=./simulator/key.pem
VISA_CA_PATH=./simulator/ca.pem

# Simulator credentials (not used)
VISA_USERNAME=simulator
VISA_PASSWORD=simulator

# Message Level Encryption (disabled for simulator)
VISA_MLE_KEY_ID=simulator-key
VISA_MLE_PUBLIC_KEY_PATH=./simulator/mle-public.pem
VISA_MLE_PRIVATE_KEY_PATH=./simulator/mle-private.pem

# SDK runtime configuration
VISA_ENDPOINTS_FILE=./endpoints/endpoints.json
SDK_ENV=development
VISA_ENV=simulator

# Originator ID
VISA_ORIGINATOR_ID=simulator-001

# Environment indicator
VISA_ENVIRONMENT=simulator
EOF

    print_success "✅ Simulator configuration created (.env.simulator)"
    echo ""
    echo "📋 Simulator Features:"
    echo "  - Fast local testing"
    echo "  - Deterministic responses"
    echo "  - No rate limits"
    echo "  - No certificate requirements"
    echo "  - Easy debugging"
    echo ""
    print_success "✅ Simulator running on http://127.0.0.1:8766"
}

# Test current configuration
test_configuration() {
    print_header "🧪 Testing Current Configuration"
    echo ""
    
    if [ -f .env.current ]; then
        source .env.current
        
        echo "Current Environment: $VISA_ENVIRONMENT"
        echo "Base URL: $VISA_BASE_URL"
        echo ""
        
        if [ "$VISA_ENVIRONMENT" = "simulator" ]; then
            print_header "Testing Simulator..."
            curl -X POST $VISA_BASE_URL/accountpayouts/v1/payout \
                -H "Content-Type: application/json" \
                -H "x-idempotency-key: test-config-$(date +%s)" \
                -d '{"originatorId": "test-001", "funding": {"type": "INTERNAL", "debitConfirmed": true, "confirmationRef": "conf-123"}, "destination": {"type": "ACCOUNT", "accountNumber": "1234567890", "routingNumber": "021000021"}, "amount": {"currency": "USD", "minor": 101}}' \
                -s | jq '.' 2>/dev/null || echo "Response received (jq not available)"
                
        elif [ "$VISA_ENVIRONMENT" = "live_sandbox" ]; then
            print_header "Testing Live Sandbox..."
            print_warning "⚠️  Live sandbox test requires valid certificates"
            echo "Skipping live test (certificate validation needed)"
        fi
        
        print_success "✅ Configuration test completed"
    else
        print_error "❌ No current configuration found. Run setup first."
    fi
}

# Switch environment
switch_environment() {
    local env_type="$1"
    
    case "$env_type" in
        "live"|"sandbox")
            configure_live_sandbox
            cp .env.live .env.current
            print_success "✅ Switched to Live Visa Sandbox"
            ;;
        "simulator"|"local")
            configure_simulator
            cp .env.simulator .env.current
            print_success "✅ Switched to Local Simulator"
            ;;
        *)
            print_error "❌ Invalid environment: $env_type"
            echo "Valid options: live, sandbox, simulator, local"
            exit 1
            ;;
    esac
    
    echo ""
    print_header "📋 Usage Instructions"
    echo "========================"
    echo ""
    echo "To use this configuration in your scripts:"
    echo "  source .env.current"
    echo ""
    echo "Or run SDK examples:"
    echo "  npm run pilot:ts    # TypeScript examples"
    echo "  npm run pilot:py    # Python examples"
    echo ""
    echo "To switch environments:"
    echo "  ./configure_environment.sh live     # Switch to live sandbox"
    echo "  ./configure_environment.sh simulator # Switch to simulator"
    echo ""
}

# Main menu
show_menu() {
    echo ""
    print_header "🎯 Choose Environment Configuration"
    echo "========================================"
    echo ""
    echo "1) 🌐 Live Visa Sandbox (Production-like)"
    echo "2) 🏠 Local Simulator (Development)"
    echo "3) 🧪 Test Current Configuration"
    echo "4) 🛑 Stop Simulator"
    echo "5) ℹ️  Show Status"
    echo "6) ❌ Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            switch_environment "live"
            ;;
        2)
            switch_environment "simulator"
            ;;
        3)
            test_configuration
            ;;
        4)
            stop_simulator
            ;;
        5)
            show_status
            ;;
        6)
            print_success "👋 Goodbye!"
            exit 0
            ;;
        *)
            print_error "❌ Invalid choice. Please try again."
            show_menu
            ;;
    esac
}

# Show current status
show_status() {
    print_header "📊 Current Status"
    echo "=================="
    echo ""
    
    if [ -f .env.current ]; then
        source .env.current
        echo "Environment: $VISA_ENVIRONMENT"
        echo "Base URL: $VISA_BASE_URL"
        echo "SDK Environment: $SDK_ENV"
    else
        echo "No configuration set"
    fi
    
    echo ""
    if check_simulator; then
        print_success "✅ Simulator: Running on http://127.0.0.1:8766"
    else
        print_warning "⚠️  Simulator: Not running"
    fi
    
    echo ""
    if [ -f .simulator.pid ]; then
        SIMULATOR_PID=$(cat .simulator.pid)
        echo "Simulator PID: $SIMULATOR_PID"
    fi
}

# Handle command line arguments
if [ $# -eq 0 ]; then
    show_menu
else
    case "$1" in
        "live"|"sandbox")
            switch_environment "live"
            ;;
        "simulator"|"local")
            switch_environment "simulator"
            ;;
        "test")
            test_configuration
            ;;
        "stop")
            stop_simulator
            ;;
        "status")
            show_status
            ;;
        *)
            print_error "❌ Invalid argument: $1"
            echo "Usage: $0 [live|simulator|test|stop|status]"
            echo "  live      - Configure for live Visa sandbox"
            echo "  simulator - Configure for local simulator"
            echo "  test      - Test current configuration"
            echo "  stop      - Stop simulator"
            echo "  status    - Show current status"
            exit 1
            ;;
    esac
fi
