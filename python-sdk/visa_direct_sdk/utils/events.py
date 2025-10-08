from typing import Any, Dict


class CompensationEventEmitter:

	async def emit(self, event: Dict[str, Any]) -> None:  # pragma: no cover
		raise NotImplementedError


class LogEmitter(CompensationEventEmitter):

	async def emit(self, event: Dict[str, Any]) -> None:  # pragma: no cover
		if not validate_compensation_event(event):
			raise ValueError("Invalid compensation event payload")
		print('[compensation]', {k: event.get(k) for k in ('event', 'sagaId', 'reason', 'timestamp')})


def validate_compensation_event(event: Dict[str, Any]) -> bool:
	have_required = all(event.get(field) for field in ("event", "sagaId", "reason", "timestamp"))
	return bool(have_required and event.get("event") == "payout_failed_requires_compensation")

