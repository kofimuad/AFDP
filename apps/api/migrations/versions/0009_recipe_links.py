"""add recipe_links table (external YouTube/article recipes per food)

Revision ID: 0009_recipe_links
Revises: 0008_food_cuisine_and_times
Create Date: 2026-06-15

Recipes are external content (YouTube videos, articles) curated per dish — we do
not author step-by-step text. Each food can have one or more recipe links, with
at most one flagged as the primary (embedded) recipe.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0009_recipe_links"
down_revision = "0008_food_cuisine_and_times"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "recipe_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("food_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("foods.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("source_type", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("thumbnail_url", sa.Text(), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("last_checked", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("source_type IN ('youtube', 'article')", name="recipe_links_source_type_check"),
        # One row per (food, url) so re-seeding on each deploy can upsert by url.
        sa.UniqueConstraint("food_id", "url", name="uq_recipe_links_food_url"),
    )
    op.create_index("ix_recipe_links_food_id", "recipe_links", ["food_id"])
    # At most one primary recipe per food.
    op.create_index(
        "uq_recipe_links_one_primary_per_food",
        "recipe_links",
        ["food_id"],
        unique=True,
        postgresql_where=sa.text("is_primary"),
    )


def downgrade() -> None:
    op.drop_index("uq_recipe_links_one_primary_per_food", table_name="recipe_links")
    op.drop_index("ix_recipe_links_food_id", table_name="recipe_links")
    op.drop_table("recipe_links")
