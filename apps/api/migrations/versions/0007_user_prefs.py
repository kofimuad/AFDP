"""add user preference columns (default location)

Revision ID: 0007_user_prefs
Revises: 0006_saved_items
Create Date: 2026-06-05
"""

from alembic import op


revision = "0007_user_prefs"
down_revision = "0006_saved_items"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN pref_lat DOUBLE PRECISION;")
    op.execute("ALTER TABLE users ADD COLUMN pref_lng DOUBLE PRECISION;")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS pref_lng;")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS pref_lat;")
