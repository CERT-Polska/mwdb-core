"""empty message

Revision ID: d26a0d5184c7
Revises: 426a27b8e97c
Create Date: 2020-03-17 10:09:53.420533

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd26a0d5184c7'
down_revision = '426a27b8e97c'
branch_labels = None
depends_on = None


def upgrade():
    op.execute('UPDATE "group" SET capabilities = array_remove(capabilities, \'reading_blobs\');')


def downgrade():
    pass
