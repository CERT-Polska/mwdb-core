"""empty message

Revision ID: 5adeaea4045d
Revises: 2fdb9b803b80
Create Date: 2018-09-18 15:04:09.297578

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5adeaea4045d'
down_revision = '2fdb9b803b80'
branch_labels = None
depends_on = None


def upgrade():
    # removed obsolete migration
    pass


def downgrade():
    pass
