"""add 3rd party sharing feature

Revision ID: f02c42a17695
Revises: bd93d1497694
Create Date: 2023-04-20 09:23:09.429028

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "f02c42a17695"
down_revision = "bd93d1497694"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
            ALTER TABLE public.object ADD share_3rd_party boolean NOT NULL DEFAULT true;
        """
    )
    op.execute(
        """
            UPDATE public.group
            SET capabilities = array_append(capabilities, 'modify_3rd_party_sharing')
            WHERE array_position(capabilities, 'manage_users') IS NOT NULL;
        """
    )


def downgrade():
    op.execute(
        """
            ALTER TABLE public.object
            DROP COLUMN share_3rd_party;
        """
    )
    op.execute(
        """
            UPDATE public.group
            SET capabilities = array_remove(capabilities, 'modify_3rd_party_sharing');
        """
    )
