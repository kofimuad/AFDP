"""add search_events and view_events tables for demand intelligence

Revision ID: 0005_analytics_events
Revises: 0004_plans_and_billing
Create Date: 2026-04-13
"""

from alembic import op


revision = "0005_analytics_events"
down_revision = "0004_plans_and_billing"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE search_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            query TEXT NOT NULL,
            normalized_query TEXT NOT NULL,
            lat DOUBLE PRECISION,
            lng DOUBLE PRECISION,
            radius_km DOUBLE PRECISION,
            result_count INT NOT NULL DEFAULT 0,
            zero_result BOOLEAN NOT NULL DEFAULT false,
            food_match_id UUID REFERENCES foods(id) ON DELETE SET NULL,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """
    )
    op.execute("CREATE INDEX idx_search_events_normalized ON search_events (normalized_query);")
    op.execute("CREATE INDEX idx_search_events_zero ON search_events (zero_result) WHERE zero_result = true;")
    op.execute("CREATE INDEX idx_search_events_created ON search_events (created_at DESC);")
    op.execute("CREATE INDEX idx_search_events_food_match ON search_events (food_match_id) WHERE food_match_id IS NOT NULL;")

    op.execute(
        """
        CREATE TABLE view_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_type TEXT NOT NULL CHECK (entity_type IN ('vendor', 'food', 'ingredient')),
            entity_id UUID NOT NULL,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """
    )
    op.execute("CREATE INDEX idx_view_events_entity ON view_events (entity_type, entity_id);")
    op.execute("CREATE INDEX idx_view_events_created ON view_events (created_at DESC);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS view_events;")
    op.execute("DROP TABLE IF EXISTS search_events;")
