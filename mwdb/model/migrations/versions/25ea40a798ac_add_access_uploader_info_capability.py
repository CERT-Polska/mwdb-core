"""Add access_uploader_info capability for public and users with manage_users capability

Revision ID: 25ea40a798ac
Revises: c7c72fd7fac5
Create Date: 2022-11-03 09:56:45.546628

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "25ea40a798ac"
down_revision = "c7c72fd7fac5"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
            UPDATE public.group
            SET capabilities = array_append(capabilities, 'access_uploader_info')
            WHERE name='public' OR array_position(capabilities, 'manage_users') IS NOT NULL;
        """
    )


def downgrade():
    op.execute(
        """
            UPDATE public.group
            SET capabilities = array_remove(capabilities, 'access_uploader_info');
        """
    )
