#!/usr/bin/env python3
"""
CoalGuard AI - Production Database Initializer & Seeder for Render PostgreSQL.
Can be executed during Render build step, release command, or manually.
"""

import os
import sys
import argparse

# Ensure proper path resolution
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
for p in [ROOT_DIR, CURRENT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.database.session import engine, Base, SessionLocal, DATABASE_URL, get_safe_url
from backend.app.models.models import (
    Mine, ComplianceRecord, Violation, Inspection,
    SensorReading, CorrectiveAction, Alert, Role, User
)
from backend.app.services.seed_service import seed_database_if_empty

def initialize_database(reset: bool = False):
    print("=" * 60)
    print("CoalGuard AI - Render Database Initialization")
    print("=" * 60)
    print(f"Target Database: {get_safe_url(DATABASE_URL)}")

    if reset:
        print("Reset flag detected. Dropping existing tables...")
        Base.metadata.drop_all(bind=engine)
        print("All existing tables dropped.")

    print("Creating all database tables via SQLAlchemy metadata...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")

    db = SessionLocal()
    try:
        print("Synchronizing seed dataset...")
        seed_database_if_empty(db)

        # Audit verification of seeded records
        mines_count = db.query(Mine).count()
        comp_count = db.query(ComplianceRecord).count()
        viol_count = db.query(Violation).count()
        insp_count = db.query(Inspection).count()
        sensors_count = db.query(SensorReading).count()
        actions_count = db.query(CorrectiveAction).count()
        alerts_count = db.query(Alert).count()
        users_count = db.query(User).count()

        print("-" * 60)
        print("PRODUCTION SEED VERIFICATION SUMMARY:")
        print(f"  • Demo Monitored Mines   : {mines_count} (Requirement: >= 10)")
        print(f"  • Compliance Records     : {comp_count} (Requirement: >= 50)")
        print(f"  • Statutory Violations   : {viol_count} (Requirement: >= 30)")
        print(f"  • Safety Inspections     : {insp_count} (Requirement: >= 25)")
        print(f"  • Sensor Readings        : {sensors_count} (Requirement: >= 1000, Data Source: DEMO IoT STREAM)")
        print(f"  • Corrective Actions     : {actions_count} (Requirement: >= 30)")
        print(f"  • System Alerts          : {alerts_count} (Requirement: >= 50)")
        print(f"  • Pre-configured Users   : {users_count} (4 Statutory Roles)")
        print("-" * 60)

        assert mines_count >= 10, "Failed: Less than 10 mines seeded"
        assert comp_count >= 50, "Failed: Less than 50 compliance records seeded"
        assert viol_count >= 30, "Failed: Less than 30 violations seeded"
        assert insp_count >= 25, "Failed: Less than 25 inspections seeded"
        assert sensors_count >= 1000, "Failed: Less than 1000 sensor readings seeded"
        assert actions_count >= 30, "Failed: Less than 30 corrective actions seeded"
        assert alerts_count >= 50, "Failed: Less than 50 alerts seeded"

        print(">>> DATABASE INITIALIZATION COMPLETED SUCCESSFULLY! <<<")
        print("=" * 60)
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize CoalGuard AI Database on Render")
    parser.add_argument("--reset", action="store_true", help="Drop all tables and re-seed from scratch")
    args = parser.parse_args()
    initialize_database(reset=args.reset)
