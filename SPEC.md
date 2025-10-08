# Visa Direct SDK & Orchestrator – Phase 2 Baseline

## Goals
- Provide a parity TypeScript/Python SDK that orchestrates Visa Direct payouts (card, account, wallet) behind a consistent builder interface.
- Centralise guardrails (ledger, funding, receipts, idempotency) and preflight flows (alias → PAV → FTAI → compliance → FX) within a single `PayoutOrchestrator`.
- Deliver secure transport (mTLS + MLE/JWE) with production fail-closed behaviour and simulator-friendly passthrough.
- Ship pluggable persistence for saga state (idempotency), receipt single-use, and cache layers with working Redis implementations.

## Flow Overview
1. **Builder** collects originator, funding, destination, amount, and optional preflight hints (alias, FX lock request, compliance payload).
2. **Orchestrator**:
   - Runs funding guards (ledger confirmation, AFT/PIS receipt single-use) via configured stores.
   - Executes preflight pipeline:
     - Resolve alias → PAV → FTAI with cache revalidation.
     - Screen optional compliance payload.
     - Acquire FX quote when requested and enforce cross-border requirements.
   - Dispatches to Visa Direct endpoints through `SecureHttpClient` with MLE enforced per route.
   - Persists response in idempotency store; emits redacted compensation event on failure.

## Key Components
- `SecureHttpClient` (TS/Py): mTLS support, JWKS cache + retry, production fail-closed, dev JSON fallback.
- `Storage` packages: in-memory defaults and Redis adapters for idempotency/receipts/cache (async in TS).
- `Services`: Recipient & Quoting services with TTL caches and background refresh.
- `Events`: Compensation emitter validating schema and redacting sensitive fields.

## Extensibility Points (Phase 3 Targets)
- **Corridor Policy Engine**: externalised corridor config driving FX/compliance requirements.
- **Telemetry**: OpenTelemetry traces/metrics around preflight, guards, transport.
- **Persistence**: DynamoDB adapters complementing Redis.
- **CI/CD**: Unified simulator contract tests for TS/Py, automated packaging (npm/PyPI).

## Non-Negotiables
- Builder never issues direct HTTP calls; all execution flows through `PayoutOrchestrator`.
- Single-use receipts enforced across processes.
- Idempotency span covers entire payout saga; fail closed on guard/pipeline failure.
- MLE/JWE must be active on flagged endpoints in production environments.
