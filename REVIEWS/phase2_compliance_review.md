# Visa Direct SDK Phase 2 Compliance Review

## Phase 1 Objectives
- [x] **LedgerGuard enforced** – internal funding requires `debitConfirmed` and `confirmationRef` in both SDKs. 【F:typescript-sdk/src/core/orchestrator.ts†L52-L64】【F:python-sdk/visa_direct_sdk/core/orchestrator.py†L51-L68】
- [x] **FundingGuard covers AFT/PIS single use** – Redis adapters now perform `SET NX`/`EX` to prevent reuse across processes. 【F:typescript-sdk/src/storage/receiptStore.ts†L16-L52】【F:python-sdk/visa_direct_sdk/storage/receipt_store.py†L20-L31】
- [x] **Destination routing** – Orchestrator dispatches card → OCT, account/wallet → payout APIs. 【F:typescript-sdk/src/core/orchestrator.ts†L84-L91】
- [x] **Saga-level idempotency with pluggable stores** – Redis adapters serialize payloads with TTL support. 【F:typescript-sdk/src/storage/idempotencyStore.ts†L1-L69】【F:python-sdk/visa_direct_sdk/storage/idempotency_store.py†L33-L47】
- [x] **Compensation events on post-funding failures** – Python orchestrator now imports `datetime`, schedules async emission safely, and emitter validates schema. 【F:python-sdk/visa_direct_sdk/core/orchestrator.py†L86-L112】【F:python-sdk/visa_direct_sdk/utils/events.py†L10-L21】

## Phase 2 Objectives
- [x] **MLE/JWE conditional encryption** – High-risk endpoints marked `requiresMLE:true`; clients encrypt when JWKS is available. 【F:endpoints/endpoints.json†L5-L33】【F:typescript-sdk/src/transport/secureHttpClient.ts†L66-L123】
- [x] **JWKS cache & retry** – Both SDKs retry on decrypt failures and refresh JWKS with environment-aware fallbacks. 【F:typescript-sdk/src/transport/secureHttpClient.ts†L95-L115】【F:python-sdk/visa_direct_sdk/transport/secure_http_client.py†L83-L151】
- [x] **Production fail-closed** – When JWKS cannot be fetched in production, both transports throw `JWEDecryptError`. 【F:typescript-sdk/src/transport/secureHttpClient.ts†L104-L109】【F:python-sdk/visa_direct_sdk/transport/secure_http_client.py†L123-L131】
- [x] **Dev mode passthrough** – Simulator flows fall back to JSON with correct headers while logging telemetry. 【F:typescript-sdk/src/transport/secureHttpClient.ts†L82-L105】【F:python-sdk/visa_direct_sdk/transport/secure_http_client.py†L112-L121】
- [x] **Error handling classes** – Orchestrators raise typed errors for FX policy violations and receipt reuse. 【F:typescript-sdk/src/core/orchestrator.ts†L97-L145】【F:python-sdk/visa_direct_sdk/core/orchestrator.py†L68-L90】
- [x] **Preflight chain + cache** – Orchestrator runs alias → PAV → FTAI with background cache refresh; compliance hooks included. 【F:typescript-sdk/src/core/orchestrator.ts†L113-L143】【F:python-sdk/visa_direct_sdk/services/recipient_service.py†L12-L49】
- [x] **FX policy enforcement** – FX locks acquired in orchestrator with expiry checks; cross-border payouts require quotes. 【F:typescript-sdk/src/core/orchestrator.ts†L131-L143】【F:python-sdk/visa_direct_sdk/core/orchestrator.py†L113-L139】
- [x] **Pluggable storage completeness** – Redis stores implemented for TypeScript and Python; caches expose `get_with_revalidate`. 【F:typescript-sdk/src/storage/cache.ts†L1-L29】【F:python-sdk/visa_direct_sdk/storage/cache.py†L5-L39】
- [x] **Compensation event schema enforcement** – Python emitter validates payload before logging redacted fields. 【F:python-sdk/visa_direct_sdk/utils/events.py†L10-L21】
- [x] **Builder parity** – Both builders now avoid direct HTTP clients and hand preflight hints to the orchestrator. 【F:typescript-sdk/src/dx/builder.ts†L7-L55】【F:python-sdk/visa_direct_sdk/dx/builder.py†L11-L84】
- [ ] **Testing coverage** – Scripts remain ad-hoc; unified runners (`npm test`/`pytest`) still pending. 【F:typescript-sdk/src/tests/kv_stores.test.ts†L1-L44】

## Architecture Compliance
- [x] **Builder delegates only** – Builders exclusively construct requests and rely on orchestration services. 【F:typescript-sdk/src/dx/builder.ts†L7-L55】【F:python-sdk/visa_direct_sdk/dx/builder.py†L11-L84】
- [x] **FundingGuard** – Redis receipt adapters enforce single-use semantics. 【F:typescript-sdk/src/storage/receiptStore.ts†L16-L52】
- [x] **Idempotency rule** – Redis idempotency stores persist saga state with TTL. 【F:typescript-sdk/src/storage/idempotencyStore.ts†L36-L69】
- [x] **MLE rule** – High-risk endpoints now require MLE; transports honour config. 【F:endpoints/endpoints.json†L5-L23】
- [x] **Security logging** – Both SDKs redact compensation logs after schema validation. 【F:typescript-sdk/src/utils/events.ts†L14-L23】【F:python-sdk/visa_direct_sdk/utils/events.py†L10-L21】

## Code Quality
- Builder implementations eliminate ad-hoc HTTP clients and rely on shared dependencies. 【F:typescript-sdk/src/dx/builder.ts†L7-L55】
- Python orchestrator imports `datetime` and guards async emission within existing event loops. 【F:python-sdk/visa_direct_sdk/core/orchestrator.py†L86-L112】
- Documentation now matches implemented behaviour (preflight orchestration, fail-closed transport, Redis adapters). 【F:README.md†L5-L112】【F:HANDOVER.md†L7-L60】

## Production Readiness Summary
Core flows now enforce single-use receipts, saga idempotency (Redis), and fail-closed MLE in production. Remaining gaps are telemetry instrumentation, corridor policy ingestion, and automated test runners before shipping.

## Phase 3 Recommendations
1. Wire corridor policy engine + config-driven FX/corridor rules into orchestrator. 【Planned】
2. Add DynamoDB adapters and corresponding integration smoke tests. 【F:README.md†L181-L191】
3. Instrument OpenTelemetry spans/metrics for preflight, guards, and transport. 【F:HANDOVER.md†L98-L118】
4. Establish unified test runners (`npm test`/`pytest`) that exercise simulator contract flows. 【F:typescript-sdk/src/tests/kv_stores.test.ts†L1-L44】
5. Automate CI/CD packaging with semantic release once telemetry and corridor policy ship. 【F:HANDOVER.md†L121-L139】
