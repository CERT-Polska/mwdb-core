"""Missing metakey 'not null' constraints

Revision ID: 3e2203dea478
Revises: 2b4da440d3ad
Create Date: 2020-07-22 17:44:53.185869

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3e2203dea478"
down_revision = "2b4da440d3ad"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.execute(
        "UPDATE \"metakey_definition\" SET description='' WHERE description IS NULL"
    )
    op.execute("UPDATE \"metakey_definition\" SET label='' WHERE label IS NULL")
    op.execute(
        "UPDATE \"metakey_definition\" SET url_template='' WHERE url_template IS NULL"
    )
    op.alter_column(
        "metakey", "key", existing_type=sa.VARCHAR(length=64), nullable=False
    )
    op.alter_column("metakey", "object_id", existing_type=sa.INTEGER(), nullable=False)
    op.alter_column("metakey", "value", existing_type=sa.TEXT(), nullable=False)
    op.alter_column(
        "metakey_definition", "description", existing_type=sa.TEXT(), nullable=False
    )
    op.alter_column(
        "metakey_definition",
        "label",
        existing_type=sa.VARCHAR(length=64),
        nullable=False,
    )
    op.alter_column(
        "metakey_definition", "url_template", existing_type=sa.TEXT(), nullable=False
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "metakey_definition", "url_template", existing_type=sa.TEXT(), nullable=True
    )
    op.alter_column(
        "metakey_definition",
        "label",
        existing_type=sa.VARCHAR(length=64),
        nullable=True,
    )
    op.alter_column(
        "metakey_definition", "description", existing_type=sa.TEXT(), nullable=True
    )
    op.alter_column("metakey", "value", existing_type=sa.TEXT(), nullable=True)
    op.alter_column("metakey", "object_id", existing_type=sa.INTEGER(), nullable=True)
    op.alter_column(
        "metakey", "key", existing_type=sa.VARCHAR(length=64), nullable=True
    )
    # ### end Alembic commands ###
