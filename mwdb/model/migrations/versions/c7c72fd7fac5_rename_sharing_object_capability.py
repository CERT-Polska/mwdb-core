"""rename sharing object capability

Revision ID: c7c72fd7fac5
Revises: e81d851aa91f
Create Date: 2022-10-19 13:36:25.254592

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c7c72fd7fac5"
down_revision = "e81d851aa91f"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        UPDATE public.group SET capabilities = array_replace(capabilities, 'sharing_objects', 'sharing_with_all');
        """
    )


def downgrade():
    op.execute(
        """
        UPDATE public.group SET capabilities = array_replace(capabilities, 'sharing_with_all', 'sharing_objects');
        """
    )
