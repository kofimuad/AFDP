"""add cuisines + food_cuisines tables and prep/cook time columns to foods

Revision ID: 0008_food_cuisine_and_times
Revises: 0007_user_prefs
Create Date: 2026-06-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0008_food_cuisine_and_times"
down_revision = "0007_user_prefs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Prep/cook time on foods (nullable so existing rows and seed_dmv stay valid)
    op.add_column("foods", sa.Column("prep_minutes", sa.Integer(), nullable=True))
    op.add_column("foods", sa.Column("cook_minutes", sa.Integer(), nullable=True))

    # Cuisines (country-level), mirroring the regions table
    op.create_table(
        "cuisines",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False, unique=True),
        sa.Column("slug", sa.Text(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # Food <-> cuisine join, mirroring food_regions
    op.create_table(
        "food_cuisines",
        sa.Column("food_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("foods.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("cuisine_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cuisines.id", ondelete="CASCADE"), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table("food_cuisines")
    op.drop_table("cuisines")
    op.drop_column("foods", "cook_minutes")
    op.drop_column("foods", "prep_minutes")
