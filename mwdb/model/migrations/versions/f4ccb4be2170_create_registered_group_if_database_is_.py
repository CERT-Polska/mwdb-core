"""Create 'registered' group if database is empty

Revision ID: f4ccb4be2170
Revises: e304b81836b0
Create Date: 2021-03-30 16:52:07.740584

"""
import logging

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql.array import ARRAY

# revision identifiers, used by Alembic.
revision = "f4ccb4be2170"
down_revision = "e304b81836b0"
branch_labels = None
depends_on = None

logger = logging.getLogger("alembic")

group_helper = sa.Table(
    "group",
    sa.MetaData(),
    sa.Column("id", sa.Integer()),
    sa.Column("name", sa.String(32)),
    sa.Column("capabilities", ARRAY(sa.Text())),
    sa.Column("private", sa.Boolean()),
    sa.Column("default", sa.Boolean()),
    sa.Column("workspace", sa.Boolean()),
)

user_helper = sa.Table(
    "user",
    sa.MetaData(),
    sa.Column("id", sa.Integer()),
)

member_helper = sa.Table(
    "member",
    sa.MetaData(),
    sa.Column("user_id", sa.Integer()),
    sa.Column("group_id", sa.Integer()),
    sa.Column("group_admin", sa.Boolean()),
)


def upgrade():
    # If 'public' doesn't exist: assume that there are no builtin objects at all
    # They will be created by 'mwdb-core configure' initializer
    connection = op.get_bind()
    public_group = connection.execute(
        group_helper.select().where(group_helper.c.name == "public")
    ).fetchone()
    if not public_group:
        logger.warning(
            "'public' group doesn't exist: assuming there are no objects to migrate"
        )
        return

    # Create 'registered' group with 'public' capabilities and some extra ones
    logger.info("Creating 'registered' group")
    registered_group_id = next(
        connection.execute(
            group_helper.insert().returning(group_helper.c.id),
            name="registered",
            capabilities=(
                public_group.capabilities
                + ["adding_files", "manage_profile", "personalize"]
            ),
            private=False,
            default=True,
            workspace=False,
        )
    ).id

    # 'public' capabilities will be moved to 'registered' group
    logger.info("Wiping 'public' group capabilities")
    connection.execute(
        group_helper.update()
        .where(group_helper.c.name == "public")
        .values(capabilities=[])
    )

    # Add all users to 'registered' group
    logger.info("Adding all existing users to 'registered' group")
    for user in connection.execute(user_helper.select()):
        connection.execute(
            member_helper.insert(),
            user_id=user.id,
            group_id=registered_group_id,
            group_admin=False,
        )


def downgrade():
    raise NotImplementedError("This migration is not downgradable")
