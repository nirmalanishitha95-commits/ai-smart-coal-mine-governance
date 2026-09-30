#!/usr/bin/env python3
"""Root wrapper for database initialization script."""
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, "backend")
for p in [CURRENT_DIR, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.init_db import initialize_database

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Initialize AI-Powered Underground Mine Safety Monitoring and Rescue System Database")
    parser.add_argument("--reset", action="store_true", help="Drop all tables and re-seed from scratch")
    args = parser.parse_args()
    initialize_database(reset=args.reset)
