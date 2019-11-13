"""replace null File fields in database

Revision ID: 99b9cc3981db
Revises: 025b1d5b7bba
Create Date: 2018-12-18 12:15:04.741608

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '99b9cc3981db'
down_revision = '025b1d5b7bba'
branch_labels = None
depends_on = None


file_helper = sa.Table(
    'file',
    sa.MetaData(),
    sa.Column('id', sa.Integer()),
    sa.Column('file_name', sa.String()),
    sa.Column('file_type', sa.String()),
    sa.Column('sha256', sa.String())
)


def upgrade():
    op.execute("UPDATE file SET file_name = sha256 WHERE file_name IS NULL;")
    op.execute("UPDATE file SET file_type = 'data' WHERE file_type IS NULL;")
    op.alter_column('file', 'file_name', nullable=False)
    op.alter_column('file', 'file_type', nullable=False)


def downgrade():
    # Can't rollback this migration
    pass
