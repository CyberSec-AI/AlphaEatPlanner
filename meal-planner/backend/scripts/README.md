# Backend Utility Scripts

This directory contains maintenance and utility scripts for the Meal Planner backend.

## Usage
Run these scripts from the `backend/` root directory to ensure correct path resolution.

Example:
```bash
python scripts/check_and_fix.py
```

## Scripts

### Database & Maintenance
*   `check_and_fix.py`: **Critical**. Runs on startup. Checks DB readiness and applies missing Schema repairs (e.g. adding columns).
*   `create_admin.py`: Creates a default admin user.
*   `reset_admin.py`: Resets the admin password.
*   `force_db_sync.py`: Forces a table creation sync via SQLAlchemy.
*   `force_migration.py`: Applies Alembic migrations (if used).
*   `migrate_steps.py`: Applied the V13.5 'Recipe Steps' table.

### Debugging
*   `verify_login.py`: Tests password hashing and verification.
