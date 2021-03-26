"""Add trusted group

Revision ID: 5685e9941289
Revises: f004f4874bd6
Create Date: 2021-03-26 18:15:30.454439

"""
import logging

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql.array import ARRAY

# revision identifiers, used by Alembic.
revision = "5685e9941289"
down_revision = "f004f4874bd6"
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
    sa.Column("builtin", sa.Boolean()),
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
    # If 'public' doesn't exist: assume there are no builtin objects at all
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

    # Move 'public' capabilities to 'trusted' with some extra ones
    logger.info("Moving 'public' capabilities to 'trusted' group")
    trusted_id = next(
        connection.execute(
            group_helper.insert().returning(group_helper.c.id),
            name="trusted",
            capabilities=(
                public_group.capabilities
                + ["adding_files", "manage_profile", "personalize"]
            ),
            private=False,
            builtin=True,
        )
    ).id

    connection.execute(
        group_helper.update()
        .where(group_helper.c.name == "public")
        .values(capabilities=[])
    )

    # Add all users to 'trusted' group
    logger.info("Adding all existing users to 'trusted' group")
    for user in connection.execute(user_helper.select()):
        connection.execute(
            member_helper.insert(),
            user_id=user.id,
            group_id=trusted_id,
            group_admin=False,
        )


def downgrade():
    raise NotImplementedError("This migration is not downgradable")
