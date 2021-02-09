"""Use JSONB for configurations

Revision ID: f5602d538e9c
Revises: e2d99ffcb8ce
Create Date: 2020-10-30 10:41:45.027855

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "f5602d538e9c"
down_revision = "e2d99ffcb8ce"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "static_config",
        "cfg",
        type_=postgresql.JSONB(astext_type=sa.Text()),
        existing_type=postgresql.JSON(astext_type=sa.Text()),
    )


def downgrade():
    op.alter_column(
        "static_config",
        "cfg",
        type_=postgresql.JSON(astext_type=sa.Text()),
        existing_type=postgresql.JSONB(astext_type=sa.Text()),
    )
