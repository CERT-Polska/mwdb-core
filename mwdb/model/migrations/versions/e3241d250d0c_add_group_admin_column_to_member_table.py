"""Add group_admin column to member table

Revision ID: e3241d250d0c
Revises: e2d99ffcb8ce
Create Date: 2020-09-17 15:24:00.140409

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e3241d250d0c'
down_revision = 'f5602d538e9c'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('member', sa.Column('group_admin', sa.Boolean(), nullable=True))
    op.execute("UPDATE \"member\" SET group_admin=FALSE WHERE group_admin IS NULL")
    op.alter_column('member', 'group_admin', nullable=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('member', 'group_admin')
    # ### end Alembic commands ###
