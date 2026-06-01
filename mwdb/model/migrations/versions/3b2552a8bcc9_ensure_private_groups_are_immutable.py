"""Ensure private groups are immutable

Revision ID: 3b2552a8bcc9
Revises: 7nsxysyisgrc
Create Date: 2026-06-01 10:37:29.232295

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3b2552a8bcc9'
down_revision = '7nsxysyisgrc'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "UPDATE \"group\" SET immutable = TRUE WHERE private = TRUE"
    )
    pass


def downgrade():
    pass
