"""Set collation of fields that may be searched by prefix

Revision ID: 6fc42e070495
Revises: 1a46a79d9108
Create Date: 2024-07-12 09:35:20.591920

"""
import logging

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "6fc42e070495"
down_revision = "1a46a79d9108"
branch_labels = None
depends_on = None

current_change = 1
total_changes = 13

logger = logging.getLogger("alembic")


def alter_column(table, column, type_):
    global current_change
    logger.info(
        f"[{current_change}/{total_changes}] Setting collation of {table}.{column}"
    )
    op.alter_column(table, column, type_=type_)
    current_change += 1


def upgrade():
    logger.info("Changing column collation, this may take a while...")
    alter_column("object", "blob_name", type_=sa.String(collation="C"))
    alter_column("object", "blob_type", type_=sa.String(32, collation="C"))
    alter_column("object", "family", type_=sa.String(32, collation="C"))
    alter_column("object", "config_type", type_=sa.String(32, collation="C"))
    alter_column("object", "file_name", type_=sa.String(collation="C"))
    alter_column("object", "md5", type_=sa.String(32, collation="C"))
    alter_column("object", "crc32", type_=sa.String(8, collation="C"))
    alter_column("object", "sha1", type_=sa.String(40, collation="C"))
    alter_column("object", "sha256", type_=sa.String(64, collation="C"))
    alter_column("object", "sha512", type_=sa.String(128, collation="C"))
    alter_column("object", "ssdeep", type_=sa.String(255, collation="C"))
    alter_column(
        "object", "alt_names", type_=postgresql.ARRAY(sa.String(collation="C"))
    )
    alter_column("tag", "tag", type_=sa.String(collation="C"))
    op.execute("ANALYZE")


def downgrade():
    logger.info("Changing column collation, this may take a while...")
    alter_column("object", "blob_name", type_=sa.String())
    alter_column("object", "blob_type", type_=sa.String(32))
    alter_column("object", "family", type_=sa.String(32))
    alter_column("object", "config_type", type_=sa.String(32))
    alter_column("object", "file_name", type_=sa.String())
    alter_column("object", "md5", type_=sa.String(32))
    alter_column("object", "crc32", type_=sa.String(8))
    alter_column("object", "sha1", type_=sa.String(40))
    alter_column("object", "sha256", type_=sa.String(64))
    alter_column("object", "sha512", type_=sa.String(128))
    alter_column("object", "ssdeep", type_=sa.String(255))
    alter_column("object", "alt_names", type_=postgresql.ARRAY(sa.String()))
    alter_column("tag", "tag", type_=sa.String())
    op.execute("ANALYZE")
