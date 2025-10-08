from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Dict, Iterator, Optional

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import ConsoleSpanExporter, SimpleSpanProcessor
from opentelemetry.trace import Span, Status, StatusCode

_provider_initialised = False
_disabled = False


def init_otel() -> None:
	global _provider_initialised, _disabled
	if _provider_initialised or _disabled:
		return
	if os.environ.get("OTEL_DISABLED") == "1":
		_disabled = True
		return
	provider = TracerProvider()
	provider.add_span_processor(SimpleSpanProcessor(ConsoleSpanExporter()))
	trace.set_tracer_provider(provider)
	_provider_initialised = True


def get_tracer():
	init_otel()
	return trace.get_tracer("visa-direct-sdk")


@contextmanager
def use_span(name: str, attributes: Optional[Dict[str, object]] = None) -> Iterator[Optional[Span]]:
	if _disabled or os.environ.get("OTEL_DISABLED") == "1":
		yield None
		return
	tracer = get_tracer()
	with tracer.start_as_current_span(name, attributes=attributes or {}) as span:
		try:
			yield span
		except Exception as exc:  # pragma: no cover - instrumentation
			span.record_exception(exc)
			span.set_status(Status(StatusCode.ERROR))
			raise


def redact(value: object) -> str:
	if value is None:
		return "[redacted]"
	if isinstance(value, str) and "*" in value:
		return value
	return "[redacted]"
