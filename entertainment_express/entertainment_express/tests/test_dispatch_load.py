"""
Load test: 100 concurrent dispatch-board clients (phase-4 task 6.4).

Measures latency of day-view build, subscription metadata, and location cache
writes under concurrent load. Target: p95 < 500ms with 100 workers.

Optional live HTTP mode:
  DISPATCH_LOAD_URL=https://tenant.example.com/api/method/... python -m ...
"""

from __future__ import annotations

import os
import statistics
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable
from urllib import parse, request
from urllib.error import URLError

import frappe

from entertainment_express.api.dispatch_realtime import (
    build_day_view,
    store_crew_location,
    subscription_info,
)

CONCURRENCY = 100
LATENCY_BUDGET_MS = 500.0


def _timed(fn: Callable[[], object]) -> float:
    start = time.perf_counter()
    fn()
    return (time.perf_counter() - start) * 1000.0


def _percentile(sorted_vals: list[float], pct: float) -> float:
    if not sorted_vals:
        return 0.0
    k = (len(sorted_vals) - 1) * (pct / 100.0)
    f = int(k)
    c = min(f + 1, len(sorted_vals) - 1)
    if f == c:
        return sorted_vals[f]
    return sorted_vals[f] + (sorted_vals[c] - sorted_vals[f]) * (k - f)


def run_concurrent(label: str, worker: Callable[[int], float], n: int = CONCURRENCY) -> dict:
    latencies: list[float] = []
    errors = 0
    with ThreadPoolExecutor(max_workers=n) as pool:
        futures = [pool.submit(worker, i) for i in range(n)]
        for fut in as_completed(futures):
            try:
                latencies.append(fut.result())
            except Exception:
                errors += 1

    latencies.sort()
    summary = {
        "label": label,
        "workers": n,
        "success": len(latencies),
        "errors": errors,
        "p50_ms": round(_percentile(latencies, 50), 2) if latencies else None,
        "p95_ms": round(_percentile(latencies, 95), 2) if latencies else None,
        "max_ms": round(max(latencies), 2) if latencies else None,
        "mean_ms": round(statistics.mean(latencies), 2) if latencies else None,
        "budget_ms": LATENCY_BUDGET_MS,
        "within_budget": bool(latencies) and _percentile(latencies, 95) < LATENCY_BUDGET_MS and errors == 0,
    }
    return summary


def load_day_view(n: int = CONCURRENCY) -> dict:
    event_date = str(frappe.utils.getdate())

    def worker(_i: int) -> float:
        return _timed(lambda: build_day_view(event_date))

    return run_concurrent("dispatch_day_view", worker, n)


def load_subscribe_meta(n: int = CONCURRENCY) -> dict:
    event_date = str(frappe.utils.getdate())

    def worker(_i: int) -> float:
        return _timed(lambda: subscription_info(event_date))

    return run_concurrent("dispatch_subscribe_meta", worker, n)


def load_location_writes(n: int = CONCURRENCY) -> dict:
    def worker(i: int) -> float:
        return _timed(
            lambda: store_crew_location(
                f"EE-LOAD-{i}",
                40.0 + (i % 100) * 0.001,
                -74.0 - (i % 100) * 0.001,
                crew_id=f"EMP-LOAD-{i}",
                booking_id="EB-LOAD",
                status="checked_in",
            )
        )

    return run_concurrent("crew_location_cache_write", worker, n)


def load_live_http(n: int = CONCURRENCY) -> dict | None:
    """Optional: hit a live dispatch endpoint with 100 concurrent GETs."""
    url = os.environ.get("DISPATCH_LOAD_URL")
    if not url:
        return None
    token = os.environ.get("DISPATCH_LOAD_TOKEN", "")

    def worker(_i: int) -> float:
        def call():
            req = request.Request(url, method="GET")
            if token:
                req.add_header("Authorization", f"Bearer {token}")
            with request.urlopen(req, timeout=10) as resp:
                resp.read()

        return _timed(call)

    try:
        return run_concurrent("live_http_dispatch", worker, n)
    except URLError as exc:
        return {
            "label": "live_http_dispatch",
            "errors": n,
            "within_budget": False,
            "error": str(exc),
        }


def run_all(n: int = CONCURRENCY) -> list[dict]:
    results = [
        load_subscribe_meta(n),
        load_location_writes(n),
        load_day_view(n),
    ]
    live = load_live_http(n)
    if live:
        results.append(live)
    return results


class TestDispatchLoad:
    """pytest/bench-compatible load assertions (slightly smaller N if needed)."""

    def test_100_concurrent_subscribe_under_budget(self):
        summary = load_subscribe_meta(CONCURRENCY)
        assert summary["errors"] == 0
        assert summary["success"] == CONCURRENCY
        assert summary["p95_ms"] < LATENCY_BUDGET_MS, summary

    def test_100_concurrent_location_writes_under_budget(self):
        summary = load_location_writes(CONCURRENCY)
        assert summary["errors"] == 0
        assert summary["p95_ms"] < LATENCY_BUDGET_MS, summary

    def test_100_concurrent_day_view_under_budget(self):
        # Day-view hits DB; allow same SLA for empty/small datasets in CI.
        summary = load_day_view(CONCURRENCY)
        assert summary["errors"] == 0
        assert summary["p95_ms"] < LATENCY_BUDGET_MS, summary


if __name__ == "__main__":
    # Standalone runner when frappe is initialized externally via bench
    print(f"Running dispatch load test (n={CONCURRENCY}, budget={LATENCY_BUDGET_MS}ms)...")
    results = run_all()
    for row in results:
        status = "PASS" if row.get("within_budget") else "FAIL"
        print(
            f"  [{status}] {row['label']}: "
            f"p50={row.get('p50_ms')}ms p95={row.get('p95_ms')}ms "
            f"max={row.get('max_ms')}ms errors={row.get('errors')}"
        )
    if not all(r.get("within_budget") for r in results if "within_budget" in r):
        raise SystemExit(1)
