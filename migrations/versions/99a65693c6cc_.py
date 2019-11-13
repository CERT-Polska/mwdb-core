"""empty message

Revision ID: 99a65693c6cc
Revises: 184243329483
Create Date: 2018-11-19 12:35:59.621101

"""
import hashlib
import json

from alembic import op
import sqlalchemy as sa


class NormalizedJSONEncoder(json.JSONEncoder):
    def encode(self, obj):
        def freeze(d):
            # Converts all dicts and lists to hashable objects
            if isinstance(d, dict):
                return frozenset((key, freeze(value)) for key, value in sorted(d.items()))
            elif isinstance(d, list):
                return tuple(freeze(value) for value in d)
            return d

        def sort_lists(item, ordered=False):
            if not ordered and isinstance(item, list):
                # If data inside list are not order-sensitive, freeze and sort elements by hash
                return sorted([sort_lists(i) for i in item], key=lambda d: hash(freeze(d)))
            elif isinstance(item, dict):
                # If key starts with "ordered_" - shouldn't be treated as multiset of elements
                return {k: sort_lists(v, k.startswith("ordered_")) for k, v in item.items()}
            else:
                return item
        return super(NormalizedJSONEncoder, self).encode(sort_lists(obj))


# revision identifiers, used by Alembic.
revision = '99a65693c6cc'
down_revision = '184243329483'
branch_labels = None
depends_on = None

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


def config_dhash(obj):
    return hashlib.sha256(json.dumps(obj, sort_keys=True, cls=NormalizedJSONEncoder)
                              .encode('utf-8')).hexdigest()


def old_config_dhash(obj):
    return hashlib.sha256(json.dumps(obj, sort_keys=True)
                              .encode('utf-8')).hexdigest()


def traverse(obj, fn):
    if isinstance(obj, list):
        return [traverse(o, fn) for o in obj]
    elif isinstance(obj, tuple):
        return tuple(traverse(o, fn) for o in obj)
    elif isinstance(obj, dict):
        return {k: traverse(o, fn) for k, o in obj.items()}
    else:
        return fn(obj)


def config_encode(obj):
    return traverse(obj, lambda o: o.encode("unicode_escape").decode("utf-8") if isinstance(o, str) else o)


def upgrade():
    hashes = set()
    connection = op.get_bind()
    for c in connection.execute(config_helper.select()):
        encoded_cfg = config_encode(c.cfg)
        hash = config_dhash(c.cfg)
        old_hash = old_config_dhash(c.cfg)

        connection.execute(
            config_helper.update(
                config_helper.c.id == c.id
            ).values(
                cfg=encoded_cfg
            )
        )

        if old_hash == hash:
            continue

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
