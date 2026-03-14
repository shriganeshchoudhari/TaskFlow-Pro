#!/usr/bin/env python3
"""
PT-JM-10 — Generate JMeter test users CSV
Creates users.csv with 500 unique test accounts for JMeter CSV Data Set Config.

Usage:
    python data/generate-test-users.py --count 500 --output data/users.csv
    python data/generate-test-users.py --register --base-url http://localhost:8080
"""
import argparse
import csv
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

DEFAULT_PASSWORD = "JMeterPass123!"
DEFAULT_COUNT    = 500


def generate_users(count: int, password: str) -> list[dict]:
    return [
        {"fullName": f"JMeter User {i:04d}", "email": f"jmeter_{i:04d}@perf.test", "password": password}
        for i in range(1, count + 1)
    ]


def write_csv(users: list[dict], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["fullName", "email", "password"])
        writer.writeheader()
        writer.writerows(users)
    print(f"[generate-test-users] Written {len(users)} users to {output_path}")


def register_users(users: list[dict], base_url: str) -> None:
    endpoint = f"{base_url}/api/v1/auth/register"
    ok = 0
    skip = 0
    fail = 0
    for u in users:
        payload = json.dumps(u).encode("utf-8")
        req = urllib.request.Request(
            endpoint, data=payload,
            headers={"Content-Type": "application/json"}, method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 201:
                    ok += 1
        except urllib.error.HTTPError as e:
            if e.code == 409:
                skip += 1  # already exists — idempotent
            else:
                fail += 1
                print(f"  WARN: {u['email']} → HTTP {e.code}", file=sys.stderr)
        except Exception as e:
            fail += 1
            print(f"  WARN: {u['email']} → {e}", file=sys.stderr)

        if (ok + skip + fail) % 50 == 0:
            print(f"  ... {ok + skip + fail}/{len(users)} processed", end="\r")

    print(f"\n[generate-test-users] Registered: {ok} new | {skip} existing | {fail} failed")


def main() -> None:
    p = argparse.ArgumentParser(description="Generate JMeter test users")
    p.add_argument("--count",      type=int,  default=DEFAULT_COUNT, help="Number of users (default: 500)")
    p.add_argument("--password",   default=DEFAULT_PASSWORD)
    p.add_argument("--output",     default="data/users.csv", help="CSV output path")
    p.add_argument("--register",   action="store_true", help="Also POST users to the API")
    p.add_argument("--base-url",   default="http://localhost:8080")
    args = p.parse_args()

    users = generate_users(args.count, args.password)
    write_csv(users, Path(args.output))

    if args.register:
        print(f"[generate-test-users] Registering {len(users)} users at {args.base_url} ...")
        register_users(users, args.base_url)


if __name__ == "__main__":
    main()
