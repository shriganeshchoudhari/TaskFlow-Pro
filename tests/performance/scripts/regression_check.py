#!/usr/bin/env python3
"""
PT-RP-05 — Performance regression checker.
Compares current k6 JSON summary against perf-baseline.json.
Fails (exit 1) if any endpoint's P95 has degraded > 20% from baseline.
Posts a summary table as a GitHub PR comment when GITHUB_TOKEN is set.

Usage:
    python scripts/regression_check.py k6-summary.json
    python scripts/regression_check.py k6-summary.json \
        --baseline baselines/perf-baseline.json \
        --threshold 20
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any

DEFAULT_BASELINE  = Path(__file__).parent.parent / "baselines" / "perf-baseline.json"
DEFAULT_THRESHOLD = 20   # percent regression allowed


def load_json(path: Path) -> dict[str, Any]:
    with path.open() as f:
        return json.load(f)


def extract_k6_p95(summary: dict) -> dict[str, float]:
    """
    Parse k6 JSON summary output (produced with --summary-export=summary.json).
    Returns {metric_name: p95_ms} for all http_req_duration trend metrics.
    """
    results: dict[str, float] = {}
    metrics = summary.get("metrics", {})
    for name, data in metrics.items():
        if "duration" in name or name == "http_req_duration":
            p95 = data.get("values", {}).get("p(95)")
            if p95 is not None:
                results[name] = float(p95)
    return results


def match_endpoint(k6_metric: str, endpoint: str) -> bool:
    """Fuzzy-match k6 metric names to baseline endpoint keys."""
    # k6 metric names: http_req_duration, login_duration, get_projects_duration, etc.
    slug = endpoint.lower().replace("/", "_").replace(":", "").replace(" ", "_").strip("_")
    return slug in k6_metric.lower() or k6_metric.lower() in slug


def check_regression(
    current: dict[str, float],
    baseline: dict,
    threshold_pct: int,
) -> list[dict]:
    failures = []
    baseline_endpoints = baseline.get("endpoints", {})

    for endpoint, base_data in baseline_endpoints.items():
        base_p95 = base_data.get("p95")
        if base_p95 is None:
            continue

        # Find matching current metric
        matched_p95 = None
        for k6_metric, p95 in current.items():
            if match_endpoint(k6_metric, endpoint):
                matched_p95 = p95
                break

        if matched_p95 is None:
            print(f"  [WARN] No current metric found for: {endpoint}")
            continue

        pct_change = ((matched_p95 - base_p95) / base_p95) * 100
        status = "✓" if pct_change <= threshold_pct else "✗"

        row = {
            "endpoint":   endpoint,
            "base_p95":   base_p95,
            "curr_p95":   matched_p95,
            "pct_change": pct_change,
            "status":     status,
        }
        if pct_change > threshold_pct:
            failures.append(row)
        else:
            print(f"  {status} {endpoint:<55} base={base_p95:>5.0f}ms  curr={matched_p95:>5.0f}ms  Δ={pct_change:>+.1f}%")

    return failures


def post_pr_comment(table: str) -> None:
    token   = os.environ.get("GITHUB_TOKEN")
    repo    = os.environ.get("GITHUB_REPOSITORY")
    pr_num  = os.environ.get("PR_NUMBER")

    if not all([token, repo, pr_num]):
        print("[regression] Skipping PR comment (GITHUB_TOKEN / GITHUB_REPOSITORY / PR_NUMBER not set)")
        return

    url  = f"https://api.github.com/repos/{repo}/issues/{pr_num}/comments"
    body = json.dumps({"body": f"## Performance Regression Report\n\n{table}"}).encode()
    req  = urllib.request.Request(url, data=body, method="POST", headers={
        "Authorization": f"token {token}",
        "Content-Type":  "application/json",
        "Accept":        "application/vnd.github.v3+json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[regression] PR comment posted (HTTP {resp.status})")
    except urllib.error.HTTPError as e:
        print(f"[regression] Failed to post PR comment: {e.code}", file=sys.stderr)


def build_markdown_table(failures: list[dict], all_rows: list[dict]) -> str:
    lines = ["| Endpoint | Baseline P95 | Current P95 | Change | Status |",
             "|----------|-------------|------------|--------|--------|"]
    for r in all_rows:
        lines.append(
            f"| `{r['endpoint']}` | {r['base_p95']:.0f}ms | {r['curr_p95']:.0f}ms "
            f"| {r['pct_change']:+.1f}% | {r['status']} |"
        )
    return "\n".join(lines)


def main() -> None:
    p = argparse.ArgumentParser(description="Performance regression checker")
    p.add_argument("summary",   type=Path, help="k6 JSON summary file (--summary-export)")
    p.add_argument("--baseline",  type=Path, default=DEFAULT_BASELINE)
    p.add_argument("--threshold", type=int,  default=DEFAULT_THRESHOLD,
                   help="Max allowed P95 regression %% (default: 20)")
    args = p.parse_args()

    if not args.summary.exists():
        print(f"[regression] ERROR: summary file not found: {args.summary}", file=sys.stderr)
        sys.exit(1)
    if not args.baseline.exists():
        print(f"[regression] ERROR: baseline file not found: {args.baseline}", file=sys.stderr)
        sys.exit(1)

    summary  = load_json(args.summary)
    baseline = load_json(args.baseline)
    current  = extract_k6_p95(summary)

    print(f"\n[regression] Comparing against baseline (threshold: {args.threshold}% regression)\n")
    failures = check_regression(current, baseline, args.threshold)

    all_rows = []
    for endpoint, base_data in baseline.get("endpoints", {}).items():
        base_p95 = base_data.get("p95", 0)
        curr_p95 = next((v for k, v in current.items() if match_endpoint(k, endpoint)), base_p95)
        pct      = ((curr_p95 - base_p95) / base_p95) * 100 if base_p95 else 0
        all_rows.append({"endpoint": endpoint, "base_p95": base_p95,
                          "curr_p95": curr_p95, "pct_change": pct,
                          "status": "✗" if pct > args.threshold else "✓"})

    table = build_markdown_table(failures, all_rows)
    post_pr_comment(table)

    if failures:
        print("\n[REGRESSION DETECTED]")
        for f in failures:
            print(f"  ✗ {f['endpoint']}: {f['base_p95']:.0f}ms → {f['curr_p95']:.0f}ms ({f['pct_change']:+.1f}%)")
        sys.exit(1)
    else:
        print("\n[ALL ENDPOINTS WITHIN THRESHOLD] No regression detected.")


if __name__ == "__main__":
    main()
