"""OIDC group referenced by id instead of name + convert to non-workspace

Revision ID: 72a94f88d2b6
Revises: 6fc42e070495
Create Date: 2024-08-20 13:29:36.839985

"""
import logging

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "72a94f88d2b6"
down_revision = "6fc42e070495"
branch_labels = None
depends_on = None

group_helper = sa.Table(
    "group",
    sa.MetaData(),
    sa.Column("id", sa.Integer()),
    sa.Column("name", sa.String(32)),
    sa.Column("private", sa.Boolean()),
    sa.Column("default", sa.Boolean()),
    sa.Column("workspace", sa.Boolean()),
)

provider_helper = sa.Table(
    "openid_provider",
    sa.MetaData(),
    sa.Column("id", sa.Integer()),
    sa.Column("name", sa.String(64)),
    sa.Column("group_id", sa.Integer()),
)

logger = logging.getLogger("alembic")


def group_name_from_provider_name(provider_name):
    return ("OpenID_" + provider_name)[:32]


def upgrade():
    connection = op.get_bind()
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("openid_provider", sa.Column("group_id", sa.Integer(), nullable=True))
    op.create_foreign_key(None, "openid_provider", "group", ["group_id"], ["id"])

    # Migrate existing providers
    for provider in connection.execute(provider_helper.select()):
        group_name = group_name_from_provider_name(provider.name)
        group = connection.execute(
            group_helper.select().where(group_helper.c.name == group_name)
        ).first()
        connection.execute(
            group_helper.update()
            .where(group_helper.c.name == group_name)
            .values(workspace=False)
        )
        connection.execute(
            provider_helper.update()
            .where(provider_helper.c.id == provider.id)
            .values(group_id=group.id)
        )

    # Set group_id as non-nullable
    op.alter_column(
        "openid_provider", "group_id", existing_type=sa.INTEGER(), nullable=False
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, "openid_provider", type_="foreignkey")
    op.drop_column("openid_provider", "group_id")
    # ### end Alembic commands ###