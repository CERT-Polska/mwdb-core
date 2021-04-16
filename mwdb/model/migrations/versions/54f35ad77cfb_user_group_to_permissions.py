"""user group to permissions

Revision ID: 54f35ad77cfb
Revises: f4ccb4be2170
Create Date: 2021-04-16 15:25:33.866860

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "54f35ad77cfb"
down_revision = "f4ccb4be2170"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(
        "metakey_permission_group_id_fkey", "metakey_permission", type_="foreignkey"
    )
    op.create_foreign_key(
        None, "metakey_permission", "group", ["group_id"], ["id"], ondelete="CASCADE"
    )
    op.drop_constraint("permission_group_id_fkey", "permission", type_="foreignkey")
    op.drop_constraint("permission_object_id_fkey", "permission", type_="foreignkey")
    op.drop_constraint(
        "permission_related_user_id_fkey", "permission", type_="foreignkey"
    )
    op.create_foreign_key(
        None, "permission", "user", ["related_user_id"], ["id"], ondelete="SET NULL"
    )
    op.create_foreign_key(
        None, "permission", "object", ["object_id"], ["id"], ondelete="CASCADE"
    )
    op.create_foreign_key(
        None, "permission", "group", ["group_id"], ["id"], ondelete="CASCADE"
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, "permission", type_="foreignkey")
    op.drop_constraint(None, "permission", type_="foreignkey")
    op.drop_constraint(None, "permission", type_="foreignkey")
    op.create_foreign_key(
        "permission_related_user_id_fkey",
        "permission",
        "user",
        ["related_user_id"],
        ["id"],
    )
    op.create_foreign_key(
        "permission_object_id_fkey", "permission", "object", ["object_id"], ["id"]
    )
    op.create_foreign_key(
        "permission_group_id_fkey", "permission", "group", ["group_id"], ["id"]
    )
    op.drop_constraint(None, "metakey_permission", type_="foreignkey")
    op.create_foreign_key(
        "metakey_permission_group_id_fkey",
        "metakey_permission",
        "group",
        ["group_id"],
        ["id"],
    )
    # ### end Alembic commands ###
