"""JSONB attribute value type

Revision ID: 7054c09d10ac
Revises: 3648d869ef45
Create Date: 2021-07-20 16:19:43.171111

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "7054c09d10ac"
down_revision = "3648d869ef45"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "metakey",
        "value",
        existing_type=sa.TEXT(),
        type_=postgresql.JSONB(astext_type=sa.Text()),
        existing_nullable=False,
        postgresql_using="to_jsonb(value)",
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "metakey",
        "value",
        existing_type=postgresql.JSONB(astext_type=sa.Text()),
        type_=sa.TEXT(),
        existing_nullable=False,
    )
    # ### end Alembic commands ###
