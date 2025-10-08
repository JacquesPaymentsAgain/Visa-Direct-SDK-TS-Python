from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from importlib import resources
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class CorridorRules:
	fx: Optional[Dict[str, object]] = None
	compliance: Optional[Dict[str, object]] = None
	rails: Optional[Dict[str, List[str]]] = None
	limits: Optional[Dict[str, object]] = None
	sla: Optional[Dict[str, object]] = None


@dataclass
class Corridor:
	sourceCountry: str
	targetCountry: str
	currencies: Optional[Dict[str, str]]
	rules: CorridorRules


@dataclass
class Policy:
	version: str
	corridors: List[Corridor]


class PolicyNotFoundError(Exception):
	pass


def _candidate_paths() -> List[Path]:
	cwd = Path(os.getcwd())
	return [
		cwd / "policy" / "corridor-policy.json",
		cwd.parent / "policy" / "corridor-policy.json",
		Path(__file__).resolve().parents[2] / "policy" / "corridor-policy.json",
		Path(__file__).resolve().parents[3] / "policy" / "corridor-policy.json",
	]


def _load_embedded_policy() -> Policy:
	with resources.files(__package__).joinpath("corridor-policy.default.json").open("r", encoding="utf-8") as handle:
		raw = json.load(handle)
	return Policy(
		version=raw.get("version", "0.0.0"),
		corridors=[
			Corridor(
				sourceCountry=c["sourceCountry"],
				targetCountry=c["targetCountry"],
				currencies=c.get("currencies"),
				rules=CorridorRules(**c.get("rules", {}))
			)
			for c in raw.get("corridors", [])
		]
	)


@lru_cache(maxsize=1)
def load_policy(file: Optional[str] = None, policy: Optional[Policy] = None) -> Policy:
	if policy:
		return policy
	if file:
		candidate = Path(file)
		if not candidate.exists():
			raise PolicyNotFoundError(f"Corridor policy file not found at {candidate}")
		with candidate.open("r", encoding="utf-8") as handle:
			raw = json.load(handle)
		return Policy(
			version=raw.get("version", "0.0.0"),
			corridors=[
				Corridor(
					sourceCountry=c["sourceCountry"],
					targetCountry=c["targetCountry"],
					currencies=c.get("currencies"),
					rules=CorridorRules(**c.get("rules", {}))
				)
				for c in raw.get("corridors", [])
			]
		)
	return _load_embedded_policy()


def get_rules(policy: Policy, *, source_country: str, target_country: str, source_currency: Optional[str] = None, target_currency: Optional[str] = None) -> CorridorRules:
	for corridor in policy.corridors:
		if corridor.sourceCountry != source_country:
			continue
		if corridor.targetCountry != target_country:
			continue
		if corridor.currencies:
			src_ok = corridor.currencies.get("source") == source_currency if corridor.currencies.get("source") else True
			dst_ok = corridor.currencies.get("target") == target_currency if corridor.currencies.get("target") else True
			if not (src_ok and dst_ok):
				continue
		return corridor.rules or CorridorRules()
	raise PolicyNotFoundError(f"No corridor policy for {source_country}->{target_country}")
