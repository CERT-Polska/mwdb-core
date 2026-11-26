"""Remove share_queried_objects from groups

Revision ID: 7e52753f0ec6
Revises: 6e7b2dbd8c4f
Create Date: 2026-11-26 17:53:52.598383

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7e52753f0ec6'
down_revision = '6e7b2dbd8c4f'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "UPDATE public.group SET capabilities = array_remove(capabilities, 'share_queried_objects');"
    )


def downgrade():
    pass
