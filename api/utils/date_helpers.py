"""
Date utility functions (mirrors TypeScript version from macro-tracker).
"""

from datetime import datetime, timedelta


def get_today_utc() -> str:
    """Get today's date in YYYY-MM-DD format (UTC)."""
    return datetime.utcnow().date().isoformat()


def get_last_n_days(n: int) -> list[str]:
    """Get list of last N dates in YYYY-MM-DD format."""
    today = datetime.utcnow().date()
    return [(today - timedelta(days=i)).isoformat()
            for i in range(n-1, -1, -1)]


def get_date_n_days_ago(n: int) -> str:
    """Get date N days ago in YYYY-MM-DD format."""
    return (datetime.utcnow().date() - timedelta(days=n)).isoformat()