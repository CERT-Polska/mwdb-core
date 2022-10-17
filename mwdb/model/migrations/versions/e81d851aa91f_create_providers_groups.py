"""create_providers_groups

Revision ID: e81d851aa91f
Revises: cdae4e840ceb
Create Date: 2022-09-22 09:53:20.197184

"""
import logging

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e81d851aa91f"
down_revision = "cdae4e840ceb"
branch_labels = None
depends_on = None

logger = logging.getLogger("alembic")

group_helper = sa.Table(
    "group",
    sa.MetaData(),
    sa.Column("id", sa.Integer()),
    sa.Column("name", sa.String(32)),
    sa.Column("private", sa.Boolean()),
    sa.Column("default", sa.Boolean()),
    sa.Column("workspace", sa.Boolean()),
    sa.Column("immutable", sa.Boolean()),
)

member_helper = sa.Table(
    "member",
    sa.MetaData(),
    sa.Column("user_id", sa.Integer()),
    sa.Column("group_id", sa.Integer()),
    sa.Column("group_admin", sa.Boolean()),
)

oauth_helper = sa.Table(
    "openid_provider",
    sa.MetaData(),
    sa.Column("id", sa.Integer()),
    sa.Column("name", sa.String()),
)

identity_helper = sa.Table(
    "openid_identity",
    sa.MetaData(),
    sa.Column("provider_id", sa.Integer()),
    sa.Column("user_id", sa.Integer()),
)


def upgrade():
    connection = op.get_bind()

    providers = connection.execute(oauth_helper.select())

    for provider in providers:
        # Create group for each registered provider
        logger.info(f"Creating {provider.name} group")
        provider_group_name = ("OpenID_" + provider.name)[:32]

        if connection.execute(
            group_helper.select().where(group_helper.c.name == provider_group_name)
        ).fetchone():
            logger.warning(
                f"Group for {provider.name} already exists, skipping creating new group"
            )
            continue

        provider_group_id = next(
            connection.execute(
                group_helper.insert().returning(group_helper.c.id),
                name=provider_group_name,
                private=False,
                default=False,
                workspace=True,
                immutable=True,
            )
        ).id
        # Add all identities to that group
        identities = connection.execute(
            identity_helper.select().where(identity_helper.c.provider_id == provider.id)
        )
        for identity in identities:
            connection.execute(
                member_helper.insert(),
                user_id=identity.user_id,
                group_id=provider_group_id,
                group_admin=False,
            )


def downgrade():
    raise NotImplementedError("This migration is not downgradable")
