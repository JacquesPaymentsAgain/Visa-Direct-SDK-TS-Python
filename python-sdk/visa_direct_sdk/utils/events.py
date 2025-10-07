from typing import Any, Dict


class CompensationEventEmitter:

	async def emit(self, event: Dict[str, Any]) -> None:  # pragma: no cover
		raise NotImplementedError


class LogEmitter(CompensationEventEmitter):

	async def emit(self, event: Dict[str, Any]) -> None:  # pragma: no cover
		print('[compensation]', {k: event.get(k) for k in ('event', 'sagaId', 'reason', 'timestamp')})


