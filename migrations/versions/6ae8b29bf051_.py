"""empty message

Revision ID: 6ae8b29bf051
Revises: 99a65693c6cc
Create Date: 2018-11-29 14:41:24.300835

"""
import hashlib

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6ae8b29bf051'
down_revision = '99a65693c6cc'
branch_labels = None
depends_on = None


def config_dhash(obj):
    if isinstance(obj, list):
        return config_dhash(
            str(sorted([config_dhash(o) for o in obj])))
    elif isinstance(obj, dict):
        return config_dhash([[o, config_dhash(obj[o])] for o in sorted(obj.keys())])
    elif isinstance(obj, bytes):
        return hashlib.sha256(obj).hexdigest()
    else:
        return hashlib.sha256(str(obj).encode('latin1')).hexdigest()


object_helper = sa.Table(
    'object',
    sa.MetaData(),
    sa.Column('id', sa.Integer()),
    sa.Column('dhash', sa.String(64))
)

config_helper = sa.Table(
    'static_config',
    sa.MetaData(),
    sa.Column('id', sa.Integer()),
    sa.Column("cfg", sa.JSON(), nullable=False)
)


def upgrade():
    hashes = set()
    connection = op.get_bind()
    for c in connection.execute(config_helper.select()):
        hash = config_dhash(c.cfg)
        if hash in hashes:
            # Avoid collisions for new hashes
            # These should be dropped and redirected to existing object, but it's too complicated :P
            print("WARNING: {} duplicated after migration - not rehashed!".format(hash))
            continue
        hashes.add(hash)
        if connection.execute(object_helper.select(sa.sql.expression.exists()
                                                                    .where(object_helper.c.dhash == hash))).scalar():
            print("WARNING: {} duplicated after migration - not rehashed!".format(hash))
            continue
        connection.execute(
            object_helper.update(
                object_helper.c.id == c.id
            ).values(
                dhash=hash
            )
        )


def downgrade():
    # Can't rollback this migration
    pass
