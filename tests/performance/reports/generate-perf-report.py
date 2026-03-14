#!/usr/bin/env python3
"""
PT-RP-03 — Unified performance report generator.
Reads outputs from k6, JMeter, Gatling, and Locust and produces
a single self-contained HTML report with pass/fail per threshold.

Usage:
    python reports/generate-perf-report.py \
        --k6      results/k6-summary.json \
        --jmeter  results/jmeter-results.jtl \
        --gatling results/gatling-simulation.log \
        --locust  results/locust-stats_stats.csv \
        --output  reports/perf-report.html
"""
import argparse
import csv
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

# ── SLA thresholds (must match config/thresholds.js) ─────────────────────────
SLA = {
    "p95_ms":      300,
    "p99_ms":      800,
    "error_pct":   1.0,
}


# ── k6 parser ─────────────────────────────────────────────────────────────────
def parse_k6(path: Path) -> dict[str, Any]:
    with path.open() as f:
        data = json.load(f)
    metrics = data.get("metrics", {})
    p95  = metrics.get("http_req_duration", {}).get("values", {}).get("p(95)", 0)
    p99  = metrics.get("http_req_duration", {}).get("values", {}).get("p(99)", 0)
    fail = metrics.get("http_req_failed",  {}).get("values", {}).get("rate", 0) * 100
    reqs = metrics.get("http_reqs",        {}).get("values", {}).get("count", 0)
    return {"tool": "k6", "p95": p95, "p99": p99, "error_pct": fail,
            "total_requests": reqs, "raw": data}


# ── JMeter JTL parser ─────────────────────────────────────────────────────────
def parse_jmeter(path: Path) -> dict[str, Any]:
    times  = []
    errors = 0
    total  = 0
    with path.open(newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            elapsed = int(row.get("elapsed", 0))
            times.append(elapsed)
            if row.get("success", "true").lower() != "true":
                errors += 1
    if not times:
        return {"tool": "JMeter", "p95": 0, "p99": 0, "error_pct": 0, "total_requests": 0}
    times.sort()
    p95 = times[int(len(times) * 0.95)]
    p99 = times[int(len(times) * 0.99)]
    return {"tool": "JMeter", "p95": p95, "p99": p99,
            "error_pct": (errors / total * 100) if total else 0,
            "total_requests": total}


# ── Gatling simulation.log parser ─────────────────────────────────────────────
def parse_gatling(path: Path) -> dict[str, Any]:
    times  = []
    errors = 0
    with path.open(encoding="utf-8", errors="replace") as f:
        for line in f:
            parts = line.strip().split("\t")
            if len(parts) >= 5 and parts[0] == "REQUEST":
                start  = int(parts[3]) if parts[3].isdigit() else 0
                end    = int(parts[4]) if parts[4].isdigit() else 0
                status = parts[5] if len(parts) > 5 else "OK"
                elapsed = end - start
                if elapsed >= 0:
                    times.append(elapsed)
                if status != "OK":
                    errors += 1
    if not times:
        return {"tool": "Gatling", "p95": 0, "p99": 0, "error_pct": 0, "total_requests": 0}
    times.sort()
    total = len(times)
    p95   = times[int(total * 0.95)]
    p99   = times[int(total * 0.99)]
    return {"tool": "Gatling", "p95": p95, "p99": p99,
            "error_pct": (errors / total * 100) if total else 0,
            "total_requests": total}


# ── Locust CSV stats parser ───────────────────────────────────────────────────
def parse_locust(path: Path) -> dict[str, Any]:
    # Locust CSV: Name, # Requests, # Failures, Median(ms), 95%ile(ms), 99%ile(ms), ...
    with path.open(newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("Name", "").strip().upper() == "AGGREGATED":
                p95   = float(row.get("95%", 0) or 0)
                p99   = float(row.get("99%", 0) or 0)
                total = int(row.get("# Requests", 0) or 0)
                fails = int(row.get("# Failures", 0) or 0)
                err   = (fails / total * 100) if total else 0
                return {"tool": "Locust", "p95": p95, "p99": p99,
                        "error_pct": err, "total_requests": total}
    return {"tool": "Locust", "p95": 0, "p99": 0, "error_pct": 0, "total_requests": 0}


# ── HTML report builder ───────────────────────────────────────────────────────
def status_badge(value: float, threshold: float, low_is_good: bool = True) -> str:
    ok = value <= threshold if low_is_good else value >= threshold
    color = "#22c55e" if ok else "#ef4444"
    symbol = "✓" if ok else "✗"
    return f'<span style="color:{color};font-weight:700">{symbol} {value:.1f}</span>'


def build_html(results: list[dict]) -> str:
    rows = ""
    for r in results:
        p95_badge  = status_badge(r["p95"],       SLA["p95_ms"])
        p99_badge  = status_badge(r["p99"],       SLA["p99_ms"])
        err_badge  = status_badge(r["error_pct"], SLA["error_pct"])
        overall_ok = r["p95"] <= SLA["p95_ms"] and r["p99"] <= SLA["p99_ms"] and r["error_pct"] <= SLA["error_pct"]
        overall    = f'<span style="color:{"#22c55e" if overall_ok else "#ef4444"};font-weight:700">{"PASS" if overall_ok else "FAIL"}</span>'
        rows += f"""
        <tr>
          <td style="font-weight:600">{r['tool']}</td>
          <td>{r.get('total_requests', '-'):,}</td>
          <td>{p95_badge} ms</td>
          <td>{p99_badge} ms</td>
          <td>{err_badge} %</td>
          <td>{overall}</td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TaskFlow Pro — Performance Test Report</title>
  <style>
    body {{ font-family: -apple-system, Arial, sans-serif; margin: 40px; color: #1e293b; }}
    h1   {{ color: #1d4ed8; }}
    h2   {{ color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }}
    table{{ border-collapse: collapse; width: 100%; margin-bottom: 32px; }}
    th   {{ background: #1d4ed8; color: white; padding: 10px 14px; text-align: left; }}
    td   {{ padding: 10px 14px; border-bottom: 1px solid #e5e7eb; }}
    tr:hover {{ background: #f8fafc; }}
    .sla-box {{ background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;
                padding: 16px 24px; margin-bottom: 24px; }}
    .sla-box code {{ background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }}
    footer {{ margin-top: 40px; font-size: 0.85em; color: #64748b; }}
  </style>
</head>
<body>
  <h1>TaskFlow Pro — Unified Performance Report</h1>
  <p>Generated: {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}</p>

  <div class="sla-box">
    <strong>SLA Thresholds:</strong>
    P95 &lt; <code>{SLA['p95_ms']}ms</code> &nbsp;·&nbsp;
    P99 &lt; <code>{SLA['p99_ms']}ms</code> &nbsp;·&nbsp;
    Error rate &lt; <code>{SLA['error_pct']}%</code>
  </div>

  <h2>Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Tool</th><th>Total Requests</th>
        <th>P95 Latency</th><th>P99 Latency</th>
        <th>Error Rate</th><th>Result</th>
      </tr>
    </thead>
    <tbody>{rows}</tbody>
  </table>

  <footer>
    TaskFlow Pro Performance Testing Suite · Phase 7 · k6 · JMeter · Gatling · Locust
  </footer>
</body>
</html>"""


def main() -> None:
    p = argparse.ArgumentParser(description="Unified perf report generator")
    p.add_argument("--k6",      type=Path, help="k6 JSON summary (--summary-export)")
    p.add_argument("--jmeter",  type=Path, help="JMeter JTL results CSV")
    p.add_argument("--gatling", type=Path, help="Gatling simulation.log")
    p.add_argument("--locust",  type=Path, help="Locust *_stats.csv")
    p.add_argument("--output",  type=Path, default=Path("reports/perf-report.html"))
    args = p.parse_args()

    results = []
    parsers = [
        (args.k6,      parse_k6,      "k6"),
        (args.jmeter,  parse_jmeter,  "JMeter"),
        (args.gatling, parse_gatling, "Gatling"),
        (args.locust,  parse_locust,  "Locust"),
    ]
    for path, parser, name in parsers:
        if path and path.exists():
            print(f"[report] Parsing {name} results: {path}")
            results.append(parser(path))
        elif path:
            print(f"[report] WARN: {name} file not found: {path}", file=sys.stderr)

    if not results:
        print("[report] No results to process.", file=sys.stderr)
        sys.exit(1)

    html = build_html(results)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(html, encoding="utf-8")
    print(f"[report] Report written to: {args.output}")

    # Exit non-zero if any tool failed
    any_fail = any(
        r["p95"] > SLA["p95_ms"] or r["p99"] > SLA["p99_ms"] or r["error_pct"] > SLA["error_pct"]
        for r in results
    )
    if any_fail:
        print("[report] One or more tools exceeded SLA thresholds — see report.")
        sys.exit(1)


if __name__ == "__main__":
    main()
