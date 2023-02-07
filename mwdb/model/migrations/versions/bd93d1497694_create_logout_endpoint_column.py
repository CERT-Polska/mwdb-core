"""create_logout_endpoint_column

Revision ID: bd93d1497694
Revises: 717b5da712b8
Create Date: 2023-01-04 17:14:22.271856

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "bd93d1497694"
down_revision = "717b5da712b8"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
            ALTER TABLE public.openid_provider
            ADD logout_endpoint text;
        """
    )


def downgrade():
    op.execute(
        """
            ALTER TABLE public.openid_provider
            DROP COLUMN logout_endpoint;
        """
    )
