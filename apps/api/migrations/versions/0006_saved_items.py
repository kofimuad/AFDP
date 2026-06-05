"""add saved_items table for per-user saved collections (M6 SCRUM-37)

Revision ID: 0006_saved_items
Revises: 0005_analytics_events
Create Date: 2026-06-05
"""

from alembic import op


revision = "0006_saved_items"
down_revision = "0005_analytics_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE saved_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            item_type TEXT NOT NULL CHECK (item_type IN ('food', 'vendor')),
            food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
            vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_saved_items_polymorphic CHECK (
                (item_type = 'food'   AND food_id IS NOT NULL AND vendor_id IS NULL) OR
                (item_type = 'vendor' AND vendor_id IS NOT NULL AND food_id IS NULL)
            )
        );
        """
    )
    # Prevent duplicate saves per user; partial indexes also drive ON CONFLICT.
    op.execute(
        "CREATE UNIQUE INDEX uq_saved_items_user_food ON saved_items (user_id, food_id) WHERE food_id IS NOT NULL;"
    )
    op.execute(
        "CREATE UNIQUE INDEX uq_saved_items_user_vendor ON saved_items (user_id, vendor_id) WHERE vendor_id IS NOT NULL;"
    )
    op.execute(
        "CREATE INDEX idx_saved_items_user_created ON saved_items (user_id, created_at DESC);"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS saved_items;")
