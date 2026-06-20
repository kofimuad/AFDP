"""add food_suggestions table (user-recommended foods + admin moderation)

Revision ID: 0013_food_suggestions
Revises: 0012_recipe_structured_fields
Create Date: 2026-06-20

A user recommends a food; an admin accepts (which creates a catalog food) or
declines (archived). Mirrors the vendor verify/approve moderation pattern.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0013_food_suggestions"
down_revision = "0012_recipe_structured_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "food_suggestions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("region", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("recipe_link", sa.Text(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("suggested_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_food_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("foods.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("status IN ('pending', 'accepted', 'declined')", name="food_suggestions_status_check"),
    )
    op.create_index("ix_food_suggestions_status", "food_suggestions", ["status", "created_at"])
    op.create_index("ix_food_suggestions_user", "food_suggestions", ["suggested_by"])


def downgrade() -> None:
    op.drop_index("ix_food_suggestions_user", table_name="food_suggestions")
    op.drop_index("ix_food_suggestions_status", table_name="food_suggestions")
    op.drop_table("food_suggestions")
