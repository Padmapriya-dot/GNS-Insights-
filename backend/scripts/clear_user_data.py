"""Clear all user-created operational data from the database.

Keeps system configuration, tenants, users, roles, and permissions intact.
Resets all operational counts to 0.
"""

import os
import sqlite3

SYSTEM_TABLES = {
    "access_logs",
    "app_feature_settings",
    "audit_logs",
    "company_licenses",
    "company_settings",
    "login_attempts",
    "login_history",
    "otp_audit_logs",
    "otp_challenges",
    "password_history",
    "permissions",
    "platform_super_admins",
    "role_permissions",
    "roles",
    "tenants",
    "user_roles",
    "users",
}


def clear_all_user_data(db_path: str = None) -> dict:
    if not db_path:
        db_path = "smrt.db" if os.path.exists("smrt.db") else "backend/smrt.db"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    all_tables = [row[0] for row in cursor.fetchall() if not row[0].startswith("sqlite_")]

    cleared_tables = {}
    total_deleted_rows = 0

    # Turn off foreign keys temporarily for bulk truncate
    cursor.execute("PRAGMA foreign_keys = OFF;")

    for table in all_tables:
        if table in SYSTEM_TABLES:
            continue

        try:
            cursor.execute(f"SELECT COUNT(*) FROM \"{table}\"")
            count = cursor.fetchone()[0]

            if count > 0 or True:
                cursor.execute(f"DELETE FROM \"{table}\"")
                cleared_tables[table] = count
                total_deleted_rows += count
        except Exception as e:
            print(f"Error clearing {table}: {e}")

    # Reset sqlite_sequence for cleared tables
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'")
        if cursor.fetchone():
            for table in cleared_tables:
                cursor.execute("DELETE FROM sqlite_sequence WHERE name=?", (table,))
    except Exception as e:
        print(f"Warning on sqlite_sequence reset: {e}")

    cursor.execute("PRAGMA foreign_keys = ON;")
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "cleared_tables_count": len(cleared_tables),
        "total_rows_removed": total_deleted_rows,
        "cleared_tables": cleared_tables,
    }


if __name__ == "__main__":
    result = clear_all_user_data()
    print("=== Clear User Created Data Result ===")
    print(f"Cleared {result['cleared_tables_count']} operational tables.")
    print(f"Total deleted rows: {result['total_rows_removed']}")
    print("All user created data successfully cleared and counts reset to 0.")
