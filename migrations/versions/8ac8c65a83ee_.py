"""empty message

Revision ID: 8ac8c65a83ee
Revises: 2fb99211466f
Create Date: 2019-10-05 08:18:02.884803

"""
import re

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8ac8c65a83ee'
down_revision = '2fb99211466f'
branch_labels = None
depends_on = None


access_helper = sa.Table(
    'permission',
    sa.MetaData(),
    sa.Column('object_id', sa.Integer()),
    sa.Column('group_id', sa.Integer()),
    sa.Column('access_reason', sa.String(32))
)


def upgrade():
    # TODO Failed to convert permission ID: (52, 40), unmatched contents: Queried file:c8c51a5ae1681d325699194acd8b3c04047995aec327ee3b1e3be1e0316a20dd by user:<User 28>

    op.add_column('permission', sa.Column('reason_type', sa.String(length=32)))
    op.add_column('permission', sa.Column('related_object_id', sa.Integer()))
    op.add_column('permission', sa.Column('related_user_id', sa.Integer()))
    op.create_foreign_key(None, 'permission', 'user', ['related_user_id'], ['id'])
    op.create_foreign_key(None, 'permission', 'object', ['related_object_id'], ['id'])

    connection = op.get_bind()

    for idx, permission in enumerate(connection.execute(access_helper.select())):
        m = re.match('^Migrated from mwdbv1', permission.access_reason)

        if m:
            reason_type = "migrated"

            print('fix permission {} => set reason_type to \'migrated\' (old mwdbv1 permission)'
                  .format((permission.object_id, permission.group_id), reason_type))

            connection.execute("UPDATE permission SET reason_type = '{}', "
                               "related_object_id = object_id, "
                               "related_user_id = (SELECT id FROM \"user\" WHERE login = 'admin') "
                               "WHERE object_id = {} AND group_id = {}"
                               .format(reason_type, int(permission.object_id), int(permission.group_id)))
            continue

        m = re.match('^([^ ]+) ([^:]+):([^ ]+) by ([^:]+):([^ ]+|<User ([0-9]+)>)$', permission.access_reason)

        if not m:
            m = re.match('^(Added) xref ([^:]+):([^ ]+) to [^:]+:[^ ]+ by ([^:]+):([^ ]+|<User ([0-9]+)>)$', permission.access_reason)

            if not m:
                print('Failed to convert permission ID: {}, unmatched contents: {}'
                      .format((permission.object_id, permission.group_id), permission.access_reason))
                raise RuntimeError('migration failed')

        reason_type = m.group(1).lower()

        if reason_type not in ["shared", "queried", "added"]:
            print("Invalid reason type in permission ID {}: {}"
                  .format((permission.object_id, permission.group_id), reason_type))
            raise RuntimeError('migration failed')

        if m.group(2) not in ["object", "file", "static_config", "text_blob"]:
            print("Invalid reference type in permission ID {}: {}"
                  .format((permission.object_id, permission.group_id), m.group(2)))
            raise RuntimeError('migration failed')

        object_dhash = m.group(3)

        if not re.match('^([A-Za-z0-9]+)$', object_dhash):
            print('Malformed object dhash in permission ID {}: {}'
                  .format((permission.object_id, permission.group_id), object_dhash))
            raise RuntimeError('migration failed')

        if m.group(4) != "user":
            print("Expected user reference in permission ID {}, got {}"
                  .format((permission.object_id, permission.group_id), m.group(4)))
            raise RuntimeError('migration failed')

        if m.group(6):
            user_id = int(m.group(6))
            user_id_subquery = '{}'.format(user_id)
        else:
            user_login = m.group(5)

            if not re.match('^([A-Za-z0-9_-]+)$', user_login):
                print('Malformed user login in permission ID {}: {}'
                      .format((permission.object_id, permission.group_id), user_login))
                raise RuntimeError('migration failed')

            user_id_subquery = '(SELECT id FROM "user" WHERE login = \'{}\')'.format(user_login)

        print('fix permission {} => reason: {}, object: {}, user: {}'
              .format((permission.object_id, permission.group_id), reason_type, object_dhash, m.group(5)))

        connection.execute("UPDATE permission SET reason_type = '{}', "
                           "related_object_id = (SELECT id FROM object WHERE dhash = '{}'), "
                           "related_user_id = {} "
                           "WHERE object_id = {} AND group_id = {}"
                           .format(reason_type, object_dhash, user_id_subquery,
                                   int(permission.object_id), int(permission.group_id)))

    op.drop_column('permission', 'access_reason')
    op.drop_index('trgm_idx_text_blob_content', table_name='text_blob')


def downgrade():
    raise RuntimeError('I\'m afraid there is no way back, downgrade() unimplemented.')
