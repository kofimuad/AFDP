"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-04-12
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None

vendor_type = sa.Enum("restaurant", "grocery_store", name="vendor_type")


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

    # ── Create enum BEFORE vendors table ─────────────────────────────────────
    vendor_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "regions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "foods",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("slug", sa.Text(), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "food_regions",
        sa.Column("food_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("foods.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("region_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("regions.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "ingredients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("slug", sa.Text(), nullable=False, unique=True),
        sa.Column("image_url", sa.Text(), nullable=True),
    )

    op.create_table(
        "food_ingredients",
        sa.Column("food_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("foods.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("ingredient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("quantity_note", sa.Text(), nullable=True),
    )

    op.execute(
        """
        CREATE TABLE vendors (
            id UUID PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            type vendor_type NOT NULL,
            address TEXT NOT NULL,
            location GEOMETRY(Point, 4326) NOT NULL,
            phone TEXT,
            website TEXT,
            image_url TEXT,
            is_verified BOOLEAN NOT NULL DEFAULT false,
            is_featured BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """
    )

    op.create_index("ix_vendors_location_gist", "vendors", ["location"], postgresql_using="gist")

    op.create_table(
        "vendor_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("vendor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False),
        sa.Column("food_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("foods.id", ondelete="CASCADE"), nullable=True),
        sa.Column("ingredient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=True),
        sa.Column("available", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.CheckConstraint(
            "((food_id IS NOT NULL AND ingredient_id IS NULL) OR (food_id IS NULL AND ingredient_id IS NOT NULL))",
            name="ck_vendor_items_food_or_ingredient",
        ),
    )


def downgrade() -> None:
    op.drop_table("vendor_items")
    op.drop_index("ix_vendors_location_gist", table_name="vendors")
    op.drop_table("vendors")
    op.drop_table("food_ingredients")
    op.drop_table("ingredients")
    op.drop_table("food_regions")
    op.drop_table("foods")
    op.drop_table("regions")
    vendor_type.drop(op.get_bind(), checkfirst=True)