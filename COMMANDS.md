# Development Commands

## Quick Start Commands

### Start Simulator
```bash
cd simulator
python3 -m pip install -r requirements.txt
python3 app.py
```

### TypeScript SDK
```bash
cd typescript-sdk
npm install
npm run build
export VISA_BASE_URL=http://127.0.0.1:8766
node dist/examples/fi_internal_to_card.js
```

### Python SDK
```bash
cd python-sdk
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
export VISA_BASE_URL=http://127.0.0.1:8766
python examples/fi_internal_to_card.py
```

## Test Commands

### TypeScript Tests
```bash
cd typescript-sdk
npm run build
export VISA_BASE_URL=http://127.0.0.1:8766

# KV Stores test
node dist/tests/kv_stores.test.js

# MLE Telemetry test
node dist/tests/mle_telemetry.test.js

# Preflight Revalidate test
node dist/tests/preflight_revalidate.test.js

# Compensation Schema test
node dist/tests/compensation_schema.test.js
```

### Python Tests
```bash
cd python-sdk
source .venv/bin/activate
export VISA_BASE_URL=http://127.0.0.1:8766

# Basic functionality
python examples/fi_internal_to_card.py

# FX Policy test
python -c "
from visa_direct_sdk.dx.builder import PayoutBuilder
from visa_direct_sdk.errors import QuoteRequiredError
try:
    PayoutBuilder.create().for_originator('fi-001').with_funding_internal(True,'conf-123').to_card_direct('tok').for_amount('EUR',101).execute()
except QuoteRequiredError as e:
    print('FX policy enforced:', e)
"

# Alias resolution test
python -c "
from visa_direct_sdk.dx.builder import PayoutBuilder
builder = PayoutBuilder.create()
res = builder.for_originator('fi-001').with_funding_internal(True,'conf-123').to_card_via_alias('dev@example.com').for_amount('USD',101).with_idempotency_key('py-alias-test').execute()
print(res)
"
```

## Build Commands

### TypeScript
```bash
cd typescript-sdk
npm install
npm run build
```

### Python
```bash
cd python-sdk
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Environment Setup

### Required Software
- Node.js 18+
- Python 3.9+
- Flask (for simulator)

### Environment Variables
```bash
export VISA_BASE_URL=http://127.0.0.1:8766
export VISA_JWKS_URL=https://api.visa.com/jwks
export SDK_ENV=dev  # or 'production'
```

## Debug Commands

### Simulator Debug
```bash
cd simulator
python3 app.py  # Add debug=True to app.run() for detailed logging
```

### TypeScript Debug
```bash
cd typescript-sdk
npm run build
node --inspect dist/examples/fi_internal_to_card.js
```

### Python Debug
```bash
cd python-sdk
source .venv/bin/activate
python -m pdb examples/fi_internal_to_card.py
```

## Production Commands

### TypeScript Production Build
```bash
cd typescript-sdk
export SDK_ENV=production
npm run build
npm run prepublishOnly
```

### Python Production Build
```bash
cd python-sdk
source .venv/bin/activate
pip install -e .
pip install wheel
python -m build
```

## Cleanup Commands

### Reset Simulator State
```bash
# Restart simulator to reset in-memory state
pkill -f "python3 app.py"
cd simulator
python3 app.py
```

### Clean Build Artifacts
```bash
# TypeScript
cd typescript-sdk
rm -rf dist/
rm -rf node_modules/
npm install

# Python
cd python-sdk
rm -rf .venv/
rm -rf build/
rm -rf dist/
rm -rf *.egg-info/
```

## Validation Commands

### Verify Installation
```bash
# Check Node.js version
node --version

# Check Python version
python3 --version

# Check Flask installation
python3 -c "import flask; print(flask.__version__)"

# Check TypeScript compilation
cd typescript-sdk && npm run build && echo "TS build successful"

# Check Python package installation
cd python-sdk && source .venv/bin/activate && python -c "import visa_direct_sdk; print('Py SDK import successful')"
```

### Verify Simulator Endpoints
```bash
# Test basic connectivity
curl -s http://127.0.0.1:8766/visapayouts/v3/payouts/health || echo "Simulator not running"

# Test alias resolution
curl -X POST http://127.0.0.1:8766/visaaliasdirectory/v1/resolve \
  -H "Content-Type: application/json" \
  -d '{"alias": "test@example.com", "aliasType": "EMAIL"}'

# Test FX quote
curl -X POST http://127.0.0.1:8766/forexrates/v1/lock \
  -H "Content-Type: application/json" \
  -d '{"src": "USD", "dst": "EUR", "amount": {"minor": 100}}'
```

## Performance Testing

### Load Test Simulator
```bash
# Install Apache Bench
# brew install httpd  # macOS
# apt-get install apache2-utils  # Ubuntu

# Test alias resolution endpoint
ab -n 100 -c 10 -H "Content-Type: application/json" \
  -p <(echo '{"alias": "test@example.com", "aliasType": "EMAIL"}') \
  http://127.0.0.1:8766/visaaliasdirectory/v1/resolve
```

### Memory Usage
```bash
# Monitor TypeScript process
ps aux | grep node

# Monitor Python process
ps aux | grep python
```

## Troubleshooting Commands

### Check Port Usage
```bash
# Check if port 8766 is in use
lsof -i :8766

# Kill process on port 8766
lsof -ti:8766 | xargs kill -9
```

### Check Dependencies
```bash
# TypeScript dependencies
cd typescript-sdk && npm list

# Python dependencies
cd python-sdk && source .venv/bin/activate && pip list
```

### Log Analysis
```bash
# Check simulator logs
tail -f simulator.log  # if logging to file

# Check Node.js logs
node dist/examples/fi_internal_to_card.js 2>&1 | tee ts.log

# Check Python logs
python examples/fi_internal_to_card.py 2>&1 | tee py.log
```
