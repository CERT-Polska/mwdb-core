"""empty message

Revision ID: 2fb99211466f
Revises: 8ba9c7aa6c68
Create Date: 2019-09-30 14:43:26.599509

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2fb99211466f'
down_revision = '8ba9c7aa6c68'
branch_labels = None
depends_on = None


def upgrade():
    op.execute('UPDATE "user" SET pending=false WHERE pending IS NULL')
    op.execute('UPDATE "user" SET disabled=false WHERE disabled IS NULL')
    op.alter_column('user', 'pending', nullable=False)
    op.alter_column('user', 'disabled', nullable=False)


def downgrade():
    pass
