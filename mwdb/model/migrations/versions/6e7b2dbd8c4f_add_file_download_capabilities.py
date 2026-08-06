"""add file download capabilities

Revision ID: 6e7b2dbd8c4f
Revises: 3b2552a8bcc9
Create Date: 2026-08-04 00:00:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "6e7b2dbd8c4f"
down_revision = "3b2552a8bcc9"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        UPDATE public.group
        SET capabilities = array_append(capabilities, 'downloading_files')
        WHERE name = 'public'
          AND array_position(capabilities, 'downloading_files') IS NULL;
        """
    )
    op.execute(
        """
        UPDATE public.group
        SET capabilities = array_append(capabilities, 'downloading_zipped_files')
        WHERE name = 'public'
          AND array_position(capabilities, 'downloading_zipped_files') IS NULL;
        """
    )


def downgrade():
    op.execute(
        """
        UPDATE public.group
        SET capabilities = array_remove(capabilities, 'downloading_files');
        """
    )
    op.execute(
        """
        UPDATE public.group
        SET capabilities = array_remove(capabilities, 'downloading_zipped_files');
        """
    )
