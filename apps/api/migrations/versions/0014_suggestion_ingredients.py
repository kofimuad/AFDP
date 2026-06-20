"""add ingredients to food_suggestions

Revision ID: 0014_suggestion_ingredients
Revises: 0013_food_suggestions
Create Date: 2026-06-20

Users can list the ingredients of a dish they recommend; admins can edit that
list in the moderation queue. Stored as JSONB (a list of {name, quantity_note})
because these are free-text submissions not yet linked to the catalog's
ingredient rows — they become real food_ingredients only when accepted.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0014_suggestion_ingredients"
down_revision = "0013_food_suggestions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "food_suggestions",
        sa.Column(
            "ingredients",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )


def downgrade() -> None:
    op.drop_column("food_suggestions", "ingredients")
