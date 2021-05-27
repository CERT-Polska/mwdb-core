"""remove_managing_attributes

Revision ID: 69cc1cf2b929
Revises: 7e52d19ee7c4
Create Date: 2021-05-18 09:38:56.877739

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "69cc1cf2b929"
down_revision = "7e52d19ee7c4"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "UPDATE \"group\" SET capabilities = array_remove(capabilities, 'managing_attributes');"
    )
    pass


def downgrade():
    pass
