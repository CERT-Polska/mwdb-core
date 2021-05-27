"""Migrate Karton attribute

Revision ID: 4f0405411201
Revises: 69cc1cf2b929
Create Date: 2021-05-20 11:08:03.452598

"""
import datetime
import logging
import uuid

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

logger = logging.getLogger("alembic")

# revision identifiers, used by Alembic.
revision = "4f0405411201"
down_revision = "69cc1cf2b929"
branch_labels = None
depends_on = None


metakey_definition = sa.Table(
    "metakey_definition",
    sa.MetaData(),
    sa.Column("key", sa.String(64)),
)

metakey = sa.Table(
    "metakey",
    sa.MetaData(),
    sa.Column("key", sa.String(64)),
    sa.Column("value", sa.Text()),
    sa.Column("object_id", sa.Integer()),
)

karton_analysis = sa.Table(
    "karton_analysis",
    sa.MetaData(),
    sa.Column("id", UUID(as_uuid=True)),
    sa.Column("creation_time", sa.DateTime()),
    sa.Column("arguments", JSONB()),
)

karton_object = sa.Table(
    "karton_object",
    sa.MetaData(),
    sa.Column("analysis_id", UUID(as_uuid=True)),
    sa.Column("object_id", sa.Integer()),
)


def upgrade():
    # If there is no 'karton' attribute, probably user just doesn't use the plugin
    # In that case: migration is no-op
    connection = op.get_bind()
    karton_attribute = connection.execute(
        metakey_definition.select().where(metakey_definition.c.key == "karton")
    ).fetchone()
    if not karton_attribute:
        logger.warning(
            "'karton' attribute doesn't exist: assuming there are no objects to migrate"
        )
        return

    analyses = set()
    batch = []
    batch_size = 10000

    def store_batch():
        nonlocal batch
        connection.execute(
            karton_analysis.insert(),
            [entry for name, entry in batch if name == "karton_analysis"],
        )
        connection.execute(
            karton_object.insert(),
            [entry for name, entry in batch if name == "karton_object"],
        )
        batch = []

    logger.info(
        "Migrating 'karton' attributes to KartonAnalysis objects. This may take few minutes..."
    )
    for idx, attribute in enumerate(
        connection.execute(metakey.select().where(metakey.c.key == "karton"))
    ):
        try:
            analysis_uuid = uuid.UUID(attribute.value)
        except ValueError:
            logger.warning(
                "Found non-UUID karton attribute '%s'. Ignoring.", attribute.value
            )
            continue

        if analysis_uuid not in analyses:
            batch.append(
                (
                    "karton_analysis",
                    dict(
                        id=analysis_uuid,
                        creation_time=datetime.datetime.utcnow(),
                        arguments={},
                    ),
                )
            )
            analyses.add(analysis_uuid)

        batch.append(
            (
                "karton_object",
                dict(analysis_id=analysis_uuid, object_id=attribute.object_id),
            )
        )

        if len(batch) > batch_size:
            store_batch()

        if idx and idx % 10000 == 0:
            logger.info("   %d entries migrated ...", idx)

    store_batch()
    logger.info("Migrated %d analyses.", len(analyses))

    logger.info("Removing 'karton' attribute...")
    op.execute("DELETE FROM \"metakey_permission\" WHERE key = 'karton';")
    op.execute("DELETE FROM \"metakey\" WHERE key = 'karton';")
    op.execute("DELETE FROM \"metakey_definition\" WHERE key = 'karton';")


def downgrade():
    raise NotImplementedError("This migration is not downgradable")
