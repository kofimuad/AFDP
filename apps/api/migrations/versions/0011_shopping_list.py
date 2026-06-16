"""add shopping_list_items table (per-user shopping list from recipes)

Revision ID: 0011_shopping_list
Revises: 0010_vendor_delivery
Create Date: 2026-06-16

A per-user shopping list aggregated from recipe ingredients. Unique on
(user_id, ingredient_id) so adding multiple recipes combines/dedupes the same
ingredient into one checkable line. ``checked`` persists per user.
"""

from alembic import op


revision = "0011_shopping_list"
down_revision = "0010_vendor_delivery"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE shopping_list_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
            quantity_note TEXT,
            -- The recipe an item first came from (for display/grouping). Kept even
            -- if the same ingredient is shared by other added recipes.
            source_food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
            checked BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """
    )
    op.execute(
        "CREATE UNIQUE INDEX uq_shopping_list_user_ingredient "
        "ON shopping_list_items (user_id, ingredient_id);"
    )
    op.execute(
        "CREATE INDEX idx_shopping_list_user_created "
        "ON shopping_list_items (user_id, created_at);"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS shopping_list_items;")
