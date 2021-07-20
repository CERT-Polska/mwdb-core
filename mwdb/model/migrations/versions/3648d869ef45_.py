"""empty message

Revision ID: 3648d869ef45
Revises: 4f0405411201
Create Date: 2021-07-20 10:03:58.015298

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3648d869ef45"
down_revision = "4f0405411201"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("api_key", sa.Column("name", sa.String(length=100), nullable=False))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("api_key", "name")
    # ### end Alembic commands ###
