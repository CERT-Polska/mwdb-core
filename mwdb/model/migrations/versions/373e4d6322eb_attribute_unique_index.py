"""MD5-based attribute unique index

Revision ID: 373e4d6322eb
Revises: 4b0733973847
Create Date: 2021-11-08 19:04:29.357726

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "373e4d6322eb"
down_revision = "4b0733973847"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint("attribute_object_id_key_value_key", "attribute", type_="unique")
    op.execute(
        "CREATE UNIQUE INDEX ix_attribute_unique ON attribute (object_id, key, md5(value::text));"
    )
    op.drop_index("ix_attribute_value", table_name="attribute")
    op.create_index(
        "ix_attribute_value",
        "attribute",
        ["value"],
        unique=False,
        postgresql_using="gin",
    )


def downgrade():
    op.drop_index("ix_attribute_unique", table_name="attribute")
    op.create_unique_constraint(
        "attribute_object_id_key_value_key", "attribute", ["object_id", "key", "value"]
    )
    op.drop_index("ix_attribute_value", table_name="attribute")
    op.create_index("ix_attribute_value", "attribute", ["value"], unique=False)
    # ### end Alembic commands ###
