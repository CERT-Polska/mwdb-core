"""Add Group.default and Group.workspace fields

Revision ID: e304b81836b0
Revises: c8ba40a69421
Create Date: 2021-03-30 16:51:19.733285

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e304b81836b0"
down_revision = "c8ba40a69421"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("group", sa.Column("default", sa.Boolean(), nullable=True))
    op.execute('UPDATE "group" SET "default"=TRUE WHERE name=\'public\'')
    op.execute('UPDATE "group" SET "default"=FALSE WHERE name<>\'public\'')
    op.alter_column("group", "default", existing_type=sa.Boolean(), nullable=False)

    op.add_column("group", sa.Column("workspace", sa.Boolean(), nullable=True))
    op.execute('UPDATE "group" SET "workspace"=FALSE WHERE name=\'public\'')
    op.execute('UPDATE "group" SET "workspace"=TRUE WHERE name<>\'public\'')
    op.alter_column("group", "workspace", existing_type=sa.Boolean(), nullable=False)


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("group", "workspace")
    op.drop_column("group", "default")
    # ### end Alembic commands ###
