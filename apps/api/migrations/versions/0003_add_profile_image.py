"""add profile_image_url to users

Revision ID: 0003_add_profile_image
Revises: 0002_add_users
Create Date: 2026-04-13
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_add_profile_image"
down_revision = "0002_add_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("profile_image_url", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "profile_image_url")
