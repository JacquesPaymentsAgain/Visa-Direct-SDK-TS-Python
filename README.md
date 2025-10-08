# Visa Direct SDK & Orchestrator

A production-grade dual-language SDK (TypeScript + Python) with a unified Visa Direct orchestration framework, comprehensive DevX platform, and professional documentation hosted on Mintlify.

## 🚀 Quick Start

### **Unified Development (Recommended)**
```bash
# Install all dependencies
npm run install:all

# Start everything (simulator + DevX surface + docs)
npm run dev:all

# Or start individual components
npm run dev:simulator    # Flask simulator on :8766
npm run dev:surface      # Next.js Dashboard on :3000
npm run dev:docs         # Mintlify docs on :3001
```

### **Individual Component Setup**

#### **1. Start Simulator**
```bash
cd simulator
python app.py
# Runs on http://127.0.0.1:8766
```

#### **2. Install & Run SDKs**

**TypeScript SDK:**
```bash
cd typescript-sdk
npm install
npm run build
export VISA_BASE_URL=http://127.0.0.1:8766
node dist/examples/fi_internal_to_card.js
```

**Python SDK:**
```bash
cd python-sdk
python -m venv .venv && source .venv/bin/activate
pip install -e .
export VISA_BASE_URL=http://127.0.0.1:8766
python examples/fi_internal_to_card.py
```

#### **3. DevX Dashboard**
```bash
cd visa-direct-surface
npm install
npm run dev
# Runs on http://localhost:3000
```

#### **4. Documentation**
```bash
cd mintlify-docs
mintlify dev
# Runs on http://localhost:3001
```

## 📁 Project Structure

```
visa-direct-sdk-cursor-pack-v2/
├── 📁 typescript-sdk/           # TypeScript SDK
│   ├── src/
│   │   ├── core/orchestrator.ts
│   │   ├── dx/builder.ts
│   │   └── transport/secureHttpClient.ts
│   └── package.json
├── 📁 python-sdk/               # Python SDK
│   ├── visa_direct_sdk/
│   │   ├── core/orchestrator.py
│   │   ├── dx/builder.py
│   │   └── transport/secure_http_client.py
│   └── pyproject.toml
├── 📁 visa-direct-surface/      # DevX Dashboard (Next.js)
│   ├── src/
│   │   ├── app/                 # Dashboard pages
│   │   └── components/          # UI Components
│   └── package.json
├── 📁 mintlify-docs/            # Documentation (Mintlify)
│   ├── mint.json                # Mintlify configuration
│   ├── introduction.mdx         # Main docs pages
│   ├── reference/               # API reference
│   └── guides/                  # Tutorial guides
├── 📁 simulator/                # Local Flask Simulator
│   ├── app.py
│   └── requirements.txt
├── 📁 endpoints/                # API Configuration
│   └── endpoints.json
├── 📁 policy/                   # Policy Engine
└── 📄 package.json             # Root package.json (unified scripts)
```

## 🎯 Three-Part Platform

### **1. DevX Dashboard (Next.js)**
- **SDK Management** - Monitor TypeScript and Python SDKs
- **API Key Management** - Production and sandbox key management
- **Usage Analytics** - Request tracking and performance metrics
- **Quick Actions** - Common tasks and shortcuts
- **Professional UI** - Clean, fintech-forward interface

### **2. Documentation (Mintlify)**
- **Interactive Documentation** - Professional docs with live examples
- **API Reference** - Complete TypeScript and Python API docs
- **Code Examples** - Interactive code snippets and tutorials
- **Search & Navigation** - Powerful search and organized navigation
- **Hosted Solution** - Professional documentation hosting

### **3. Production SDKs**
- **TypeScript SDK** - Full type safety and modern JavaScript features
- **Python SDK** - Identical API with comprehensive error handling
- **Local Simulator** - Flask-based simulator for testing
- **Security Features** - mTLS, MLE/JWE, idempotency, and guards

## 🔧 Development Commands

### **Unified Commands (Root Directory)**
```bash
npm run dev:all              # Start simulator + dashboard + docs
npm run dev                  # Start simulator + dashboard
npm run dev:docs             # Start Mintlify documentation
npm run build                # Build all components
npm run build:docs           # Build Mintlify documentation
npm run test                 # Run all tests
npm run install:all          # Install all dependencies
npm run deploy:docs          # Deploy docs to Mintlify
```

### **Individual Component Commands**
```bash
# TypeScript SDK
cd typescript-sdk
npm run build                # Build TypeScript
npm test                     # Run TypeScript tests

# Python SDK
cd python-sdk
pip install -e .             # Install in development mode
python -m pytest             # Run Python tests

# DevX Dashboard
cd visa-direct-surface
npm run dev                  # Development server
npm run build                # Production build

# Documentation
cd mintlify-docs
mintlify dev                 # Development server
mintlify build               # Build documentation
mintlify deploy              # Deploy to Mintlify

# Simulator
cd simulator
python app.py                # Start simulator
```

## 🏗️ Architecture

### **Platform Architecture**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Documentation   │    │   Production     │
│   (Next.js)     │    │   (Mintlify)     │    │   SDKs          │
│                 │    │                  │    │                 │
│ • SDK Mgmt      │    │ • Interactive    │    │ • TypeScript    │
│ • Usage Metrics │    │   Documentation  │    │ • Python        │
│ • Quick Actions │    │ • API Reference  │    │ • Simulator     │
│ • Key Mgmt      │    │ • Code Examples  │    │ • Security      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌──────────────────┐
                    │   Visa Direct     │
                    │   API             │
                    └──────────────────┘
```

### **SDK Architecture**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   DX Builder    │───▶│   Orchestrator    │───▶│ Secure Transport │
│  (Fluent API)   │    │  (Core Logic)    │    │  (mTLS + MLE)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Preflight      │    │     Guards        │    │   Visa Direct   │
│  Services       │    │  (Ledger/Funding) │    │      API        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔐 Security Features

- **mTLS Authentication** - Client certificate validation
- **MLE/JWE Encryption** - End-to-end encryption for sensitive data
- **JWKS Key Rotation** - Automatic key rotation with retry logic
- **Idempotency Protection** - Saga-level deduplication
- **Single-use Receipts** - Prevents receipt reuse across processes
- **Fail-closed Behavior** - Production-mode security enforcement

## 📊 Production Readiness

- ✅ **Comprehensive Testing** - Unit, integration, and contract tests
- ✅ **Error Handling** - Typed exceptions with compensation events
- ✅ **Telemetry & Logging** - Structured logging with OpenTelemetry
- ✅ **Pluggable Storage** - Redis adapters with in-memory fallbacks
- ✅ **Policy Engine** - Externalized configuration management
- ✅ **Professional Documentation** - Mintlify-hosted interactive docs

## 🚀 Deployment

### **Development**
```bash
npm run dev:all              # Start all services locally
```

### **Production**
```bash
npm run build                # Build all components
npm run deploy:docs          # Deploy docs to Mintlify
```

## 📚 Documentation

- **[Dashboard](./visa-direct-surface/README.md)** - DevX dashboard and management
- **[SDK Documentation](./typescript-sdk/README.md)** - Complete TypeScript API reference
- **[Python Documentation](./python-sdk/README.md)** - Complete Python API reference
- **[Simulator Guide](./simulator/README.md)** - Local testing and development
- **[Mintlify Docs](./mintlify-docs/)** - Professional documentation
- **[Handover Guide](./HANDOVER.md)** - Project handover and team collaboration
- **[Commands Reference](./COMMANDS.md)** - Quick command reference

## 🌐 Live URLs

- **Dashboard**: `https://visa-direct-surface.vercel.app/dashboard`
- **Documentation**: `https://visa-direct-sdk.mintlify.app`
- **GitHub**: `https://github.com/JacquesPaymentsAgain/Visa-Direct-SDK-TS-Python`

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** - `git checkout -b feature/amazing-feature`
3. **Make your changes** - Follow the established patterns
4. **Run tests** - `npm run test`
5. **Commit changes** - `git commit -m 'Add amazing feature'`
6. **Push to branch** - `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation** - Check the comprehensive Mintlify docs
- **Dashboard** - Use the DevX dashboard for management
- **Issues** - Report bugs and feature requests via GitHub Issues
- **Discussions** - Join community discussions for questions and ideas

---

**Built with ❤️ for the Visa Direct developer community**