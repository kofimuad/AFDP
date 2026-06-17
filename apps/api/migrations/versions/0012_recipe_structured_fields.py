"""add servings to foods and structured quantity/unit to food_ingredients

Revision ID: 0012_recipe_structured_fields
Revises: 0011_shopping_list
Create Date: 2026-06-17

Enriches the recipe data model:
  - foods.servings — how many the recipe yields.
  - food_ingredients.quantity / unit — structured amount alongside the existing
    free-text quantity_note (African quantities are often non-numeric — "to
    taste", "a handful" — so structured fields are nullable and the note stays).
All nullable: NULL means "not curated yet", never a fabricated value.
"""

from alembic import op
import sqlalchemy as sa


revision = "0012_recipe_structured_fields"
down_revision = "0011_shopping_list"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("foods", sa.Column("servings", sa.Integer(), nullable=True))
    op.add_column("food_ingredients", sa.Column("quantity", sa.Numeric(10, 2), nullable=True))
    op.add_column("food_ingredients", sa.Column("unit", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("food_ingredients", "unit")
    op.drop_column("food_ingredients", "quantity")
    op.drop_column("foods", "servings")
