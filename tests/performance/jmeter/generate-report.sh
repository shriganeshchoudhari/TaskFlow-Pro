#!/usr/bin/env bash
# PT-JM-08 — Generate JMeter HTML Dashboard Report
# Converts a JMeter JTL results file into a self-contained HTML dashboard.
#
# Prerequisites: JMeter 5.6+ on PATH (or set JMETER_HOME)
# Usage:
#   ./generate-report.sh results/load-test.jtl
#   ./generate-report.sh results/soak-24h.jtl --open
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[report]${NC} $*"; }
warn()  { echo -e "${YELLOW}[report]${NC} $*"; }
error() { echo -e "${RED}[report]${NC} $*"; exit 1; }

JTL_FILE="${1:-}"
OPEN_FLAG="${2:-}"

[[ -z "$JTL_FILE" ]] && error "Usage: $0 <results.jtl> [--open]"
[[ ! -f "$JTL_FILE" ]] && error "JTL file not found: $JTL_FILE"

# Resolve JMeter binary
JMETER_BIN="${JMETER_HOME:-}/bin/jmeter"
if ! command -v jmeter &>/dev/null && [[ ! -x "$JMETER_BIN" ]]; then
  error "JMeter not found. Set JMETER_HOME or add jmeter to PATH."
fi
JMETER_CMD=$(command -v jmeter 2>/dev/null || echo "$JMETER_BIN")

# Derive output directory from JTL filename
BASENAME=$(basename "$JTL_FILE" .jtl)
REPORT_DIR="reports/${BASENAME}_html"

# Clean stale report dir (jmeter -g fails if it exists)
rm -rf "$REPORT_DIR"
mkdir -p reports

info "Generating HTML dashboard from $JTL_FILE ..."
"$JMETER_CMD" -g "$JTL_FILE" -o "$REPORT_DIR"

info "Report written to: $REPORT_DIR/index.html"

# Print quick summary from JTL
if command -v python3 &>/dev/null; then
  python3 - "$JTL_FILE" <<'PY'
import csv, sys
from collections import defaultdict

totals = defaultdict(lambda: {'count': 0, 'errors': 0, 'total_ms': 0, 'max_ms': 0})

with open(sys.argv[1], newline='') as f:
    reader = csv.DictReader(f)
    for row in reader:
        label   = row.get('label', 'unknown')
        elapsed = int(row.get('elapsed', 0))
        success = row.get('success', 'true').lower() == 'true'
        totals[label]['count']    += 1
        totals[label]['total_ms'] += elapsed
        totals[label]['max_ms']    = max(totals[label]['max_ms'], elapsed)
        if not success:
            totals[label]['errors'] += 1

print(f"\n{'Label':<40} {'Req':>6} {'Avg ms':>8} {'Max ms':>8} {'Err%':>7}")
print('-' * 75)
for label, d in sorted(totals.items()):
    avg  = d['total_ms'] // d['count'] if d['count'] else 0
    errp = 100 * d['errors'] / d['count'] if d['count'] else 0
    flag = ' ⚠' if errp > 1 or avg > 400 else ''
    print(f"{label:<40} {d['count']:>6} {avg:>8} {d['max_ms']:>8} {errp:>6.1f}%{flag}")
PY
fi

if [[ "$OPEN_FLAG" == "--open" ]]; then
  if command -v xdg-open &>/dev/null; then
    xdg-open "$REPORT_DIR/index.html"
  elif command -v open &>/dev/null; then
    open "$REPORT_DIR/index.html"
  fi
fi
