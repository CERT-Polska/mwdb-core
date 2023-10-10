"""Rolling back ObjectPermissions from access_all_objects

Revision ID: 6a7aefae72d3
Revises: f02c42a17695
Create Date: 2023-06-22 14:19:34.730831

"""
import logging

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql.array import ARRAY

# revision identifiers, used by Alembic.
revision = "6a7aefae72d3"
down_revision = "f02c42a17695"
branch_labels = None
depends_on = None

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

object_perm_helper = sa.Table(
    "permission",
    sa.MetaData(),
    sa.Column("object_id", sa.Integer()),
    sa.Column("group_id", sa.Integer()),
    sa.Column("reason_type", sa.String(32)),
)

logger = logging.getLogger("alembic")


def upgrade():
    connection = op.get_bind()
    access_all_objects_groups = connection.execute(
        group_helper.select().where(
            group_helper.c.capabilities.any("access_all_objects")
        )
    )
    for group in access_all_objects_groups:
        logger.info(f"Removing unnecessary rows access_all_objects group: {group.name}")
        rowcount = connection.execute(
            object_perm_helper.delete(
                sa.and_(
                    object_perm_helper.c.group_id == group.id,
                    object_perm_helper.c.reason_type == "shared",
                )
            )
        ).rowcount
        logger.info(f"{rowcount} rows removed")
    logger.info("Running analyze...")
    connection.execute("ANALYZE")


def downgrade():
    raise NotImplementedError("This migration is not downgradable")
