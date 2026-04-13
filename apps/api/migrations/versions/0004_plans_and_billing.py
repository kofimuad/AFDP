"""add vendor plan tier, billing columns, and promote seed admin

Revision ID: 0004_plans_and_billing
Revises: 0003_add_profile_image
Create Date: 2026-04-13
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_plans_and_billing"
down_revision = "0003_add_profile_image"
branch_labels = None
depends_on = None


SEED_ADMIN_EMAIL = "kofi.hydra@gmail.com"


def upgrade() -> None:
    op.execute("CREATE TYPE vendor_plan AS ENUM ('basic', 'featured', 'premium');")

    op.add_column(
        "vendors",
        sa.Column(
            "plan",
            sa.Enum("basic", "featured", "premium", name="vendor_plan", create_type=False),
            nullable=False,
            server_default="basic",
        ),
    )
    op.add_column("vendors", sa.Column("plan_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("vendors", sa.Column("stripe_customer_id", sa.Text(), nullable=True))
    op.add_column("vendors", sa.Column("stripe_subscription_id", sa.Text(), nullable=True))

    op.execute(
        f"UPDATE users SET role = 'admin' WHERE lower(email) = lower('{SEED_ADMIN_EMAIL}');"
    )


def downgrade() -> None:
    op.drop_column("vendors", "stripe_subscription_id")
    op.drop_column("vendors", "stripe_customer_id")
    op.drop_column("vendors", "plan_expires_at")
    op.drop_column("vendors", "plan")
    op.execute("DROP TYPE vendor_plan;")
