"""empty message

Revision ID: 7698f0bebad7
Revises: d26a0d5184c7
Create Date: 2020-03-17 13:23:25.084499

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7698f0bebad7'
down_revision = 'd26a0d5184c7'
branch_labels = None
depends_on = None


def upgrade():
    op.execute('UPDATE "group" SET capabilities = array_replace(capabilities, \'reading_attributes\', \'reading_all_attributes\');')
    op.execute('UPDATE "group" SET capabilities = array_replace(capabilities, \'adding_attributes\', \'adding_all_attributes\');')


def downgrade():
    op.execute('UPDATE "group" SET capabilities = array_replace(capabilities, \'reading_all_attributes\', \'reading_attributes\');')
    op.execute('UPDATE "group" SET capabilities = array_replace(capabilities, \'adding_all_attributes\', \'adding_attributes\');')
