"""assign new capabilities for related files

Revision ID: 02f584212ea5
Revises: 3c610b0ddebc
Create Date: 2022-12-14 12:03:22.613573

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "02f584212ea5"
down_revision = "3c610b0ddebc"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
            UPDATE public.group
            SET capabilities = array_append(capabilities, 'access_related_files')
            WHERE name='public' OR array_position(capabilities, 'manage_users') IS NOT NULL;
        """
    )
    op.execute(
        """
            UPDATE public.group
            SET capabilities = array_append(capabilities, 'adding_related_files')
            WHERE name='registered' OR array_position(capabilities, 'manage_users') IS NOT NULL;
        """
    )
    op.execute(
        """
            UPDATE public.group
            SET capabilities = array_append(capabilities, 'removing_related_files')
            WHERE array_position(capabilities, 'manage_users') IS NOT NULL;
        """
    )


def downgrade():
    op.execute(
        """
            UPDATE public.group
            SET capabilities = array_remove(capabilities, 'access_related_files');
        """
    )
    op.execute(
        """
            UPDATE public.group
            SET capabilities = array_remove(capabilities, 'adding_related_files');
        """
    )
    op.execute(
        """
            UPDATE public.group
            SET capabilities = array_remove(capabilities, 'removing_related_files');
        """
    )
