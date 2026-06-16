"""add delivery_available flag to vendors

Revision ID: 0010_vendor_delivery
Revises: 0009_recipe_links
Create Date: 2026-06-16

Powers the "Order nearby" path on a dish: whether a vendor offers delivery.
Tri-state and NULLABLE on purpose — NULL means "unknown" (we have not verified
it), distinct from an explicit false. We only advertise delivery when it is
known true; we never claim "no delivery" for a vendor we simply haven't checked.
Set by curated seed, vendor self-service, or an admin override.
"""

from alembic import op
import sqlalchemy as sa


revision = "0010_vendor_delivery"
down_revision = "0009_recipe_links"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Nullable, no default → existing vendors are "unknown", not "does not deliver".
    op.add_column(
        "vendors",
        sa.Column("delivery_available", sa.Boolean(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("vendors", "delivery_available")
