"""empty message

Revision ID: c30396dd416a
Revises: 9ec11b7b5365
Create Date: 2019-03-22 17:01:29.154847

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

import enum
import re
from model import db


class Permission(enum.Enum):
    manage_users = 10
    share_queried_objects = 21
    access_all_objects = 22
    sharing_objects = 30
    adding_tags = 40
    removing_tags = 41
    adding_comments = 50
    removing_comments = 51
    adding_parents = 60
    reading_attributes = 70
    adding_attributes = 71
    managing_attributes = 72
    reading_blobs = 80
    adding_blobs = 81


# http://docs.sqlalchemy.org/en/latest/dialects/postgresql.html?highlight=using%20enum%20array#using-enum-with-array
class ArrayOfEnum(sa.ARRAY):
    def bind_expression(self, bindvalue):
        return db.cast(bindvalue, self)

    def result_processor(self, dialect, coltype):
        super_rp = super(ArrayOfEnum, self).result_processor(
            dialect, coltype)

        def handle_raw_string(value):
            inner = re.match(r"^{(.*)}$", value).group(1)
            return inner.split(",") if inner else []

        def process(value):
            if value is None:
                return None
            return super_rp(handle_raw_string(value))

        return process


# revision identifiers, used by Alembic.
revision = 'c30396dd416a'
down_revision = '9ec11b7b5365'
branch_labels = None
depends_on = None

group_helper = sa.Table(
    'group',
    sa.MetaData(),
    sa.Column('id', sa.Integer()),
    sa.Column('name', sa.String(32)),
    sa.Column('private', sa.Boolean()),
    sa.Column('capabilities', ArrayOfEnum(sa.Enum(Permission, name="group_capabilities")))
)


member_helper = sa.Table(
    'member',
    sa.MetaData(),
    sa.Column('user_id', sa.Integer()),
    sa.Column('group_id', sa.Integer())
)


permission_helper = sa.Table(
    'permission',
    sa.MetaData(),
    sa.Column('object_id', sa.Integer()),
    sa.Column('group_id', sa.Integer())
)


def upgrade():
    connection = op.get_bind()
    groups = {}
    for group_name in ["certpl", "certpl-admins", "certpl-soc", "certpl-systems"]:
        group = list(connection.execute(
            group_helper.select(
                group_helper.c.name == group_name
            )
        ))
        if not group:
            print("Required groups doesn't exist")
            return
        group = group[0]
        groups[group_name] = group.id

    # Drop access_all_objects on these subgroups
    for group_name in ["certpl-admins", "certpl-soc", "certpl-systems"]:
        print("Dropping access_all_objects permission on {}".format(group_name))
        connection.execute(
            group_helper.update(
                group_helper.c.name == group_name
            ).values(
                capabilities=func.array_remove(group_helper.c.capabilities, "access_all_objects")
            )
        )

    # Drop all object permissions for these subgroups:
    for group_name in ["certpl-admins", "certpl-soc", "certpl-systems"]:
        print("Removing object permission on {}".format(group_name))
        connection.execute(
            permission_helper.delete(
                permission_helper.c.group_id == groups[group_name]
            )
        )

    # Add all members of these groups to 'certpl'
    for group_name in ["certpl-admins", "certpl-soc", "certpl-systems"]:
        print("Adding members of {} to certpl".format(group_name))
        for member in connection.execute(member_helper.select(member_helper.c.group_id == groups[group_name])):
            connection.execute(member_helper.insert().values(
                user_id=member.user_id,
                group_id=groups["certpl"]
            ))


def downgrade():
    pass
