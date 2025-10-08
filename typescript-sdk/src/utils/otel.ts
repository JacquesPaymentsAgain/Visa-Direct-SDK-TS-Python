import { diag, DiagConsoleLogger, DiagLogLevel, Span, SpanOptions, SpanStatusCode, trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

let provider: NodeTracerProvider | undefined;
let disabled = false;

function ensureProvider(): void {
	if (provider || disabled) return;
	if (process.env.OTEL_DISABLED === '1') {
		disabled = true;
		return;
	}

	diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);
	provider = new NodeTracerProvider();
	provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
	provider.register();
}

export function initOtel(): void {
	ensureProvider();
}

export function getTracer() {
	ensureProvider();
	if (disabled) return undefined;
	return trace.getTracer('visa-direct-sdk');
}

type WithSpanOptions = SpanOptions & { attributes?: Record<string, unknown> };

export async function withSpan<T>(name: string, fn: (span: Span | undefined) => Promise<T> | T, options: WithSpanOptions = {}): Promise<T> {
	const tracer = getTracer();
	if (!tracer) {
		return await fn(undefined);
	}

	return await tracer.startActiveSpan(name, options, async (span) => {
		try {
			if (options.attributes) {
				for (const [key, value] of Object.entries(options.attributes)) {
					if (value !== undefined) span.setAttribute(key, value as any);
				}
			}
			const result = await fn(span);
			return result;
		} catch (err) {
			span.recordException(err as Error);
			span.setStatus({ code: SpanStatusCode.ERROR });
			throw err;
		} finally {
			span.end();
		}
	});
}

export function redact(value: unknown): string {
	if (value === undefined || value === null) return '[redacted]';
	if (typeof value === 'string') {
		if (value.includes('*')) return value;
		return '[redacted]';
	}
	return '[redacted]';
}
