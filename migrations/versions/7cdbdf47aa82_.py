"""empty message

Revision ID: 7cdbdf47aa82
Revises: 7db45e25759b
Create Date: 2019-05-22 16:27:46.463202

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7cdbdf47aa82'
down_revision = '7db45e25759b'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute('ALTER TABLE "group" ALTER capabilities TYPE text[];')
    connection.execute('ALTER TABLE "group" ALTER capabilities set default \'{}\';')
    connection.execute('UPDATE "group" SET capabilities=\'{}\' WHERE capabilities IS NULL;')
    connection.execute('ALTER TABLE "group" ALTER capabilities SET NOT NULL;')
    connection.execute('DROP TYPE group_capabilities;')


def downgrade():
    pass
