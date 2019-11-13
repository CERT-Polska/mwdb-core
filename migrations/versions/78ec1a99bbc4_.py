"""empty message

Revision ID: 78ec1a99bbc4
Revises: 14d21382f7e1
Create Date: 2019-03-12 18:17:27.677170

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '78ec1a99bbc4'
down_revision = '14d21382f7e1'
branch_labels = None
depends_on = None


user_helper = sa.Table(
    'user',
    sa.MetaData(),
    sa.Column('id', sa.Integer()),
    sa.Column('login', sa.String(32)),
    sa.Column('group_id', sa.Integer()),
    sa.Column('disabled', sa.Boolean())
)

group_helper = sa.Table(
    'group',
    sa.MetaData(),
    sa.Column('id', sa.Integer()),
    sa.Column('name', sa.String(32)),
    sa.Column('private', sa.Boolean())
)


member_helper = sa.Table(
    'member',
    sa.MetaData(),
    sa.Column('user_id', sa.Integer()),
    sa.Column('group_id', sa.Integer())
)


def upgrade():
    connection = op.get_bind()
    connection.execute(
        group_helper.insert().values(name="public")
    )
    public_group = connection.execute(group_helper.select().where(group_helper.c.name == 'public')).first()

    for usr in connection.execute(user_helper.select()):
        connection.execute(
            user_helper.update(
                user_helper.c.id == usr.id
            ).values(
                disabled=False
            )
        )
        private_group = connection.execute(group_helper.select().where(group_helper.c.name == usr.login)).first()
        if not private_group:
            """
            If user is not a member of its own group with the same nickname - create private group
            """
            print("Creating private group for {}".format(usr.login))
            connection.execute(
                group_helper.insert().values(name=usr.login, private=True)
            )
            private_group = connection.execute(group_helper.select().where(group_helper.c.name == usr.login)).first()
        elif connection.execute(user_helper.select().where(
                sa.and_(
                    user_helper.c.group_id == private_group.id,
                    user_helper.c.login != private_group.name))).first() is not None:
            """
            If user's private group has another members, rename it to {name}_common, and create private group
            """
            new_group_name = private_group.name+"_common"
            print("Renaming group from {} to {}".format(private_group.name, new_group_name))
            connection.execute(
                group_helper.update(
                    group_helper.c.id == private_group.id
                ).values(
                    name=new_group_name
                )
            )
            print("Creating private group for {}".format(usr.login))
            connection.execute(
                group_helper.insert().values(name=usr.login, private=True)
            )
            private_group = connection.execute(
                group_helper.select().where(group_helper.c.name == usr.login)).first()
        else:
            """
            Private group already exists - setting private attribute
            """
            connection.execute(group_helper.update(
                    group_helper.c.name == usr.login
                ).values(
                    private=True
                ))
        connection.execute(
            member_helper.insert().values(user_id=usr.id, group_id=public_group.id)
        )
        connection.execute(
            member_helper.insert().values(user_id=usr.id, group_id=private_group.id)
        )
        if usr.group_id != private_group.id:
            connection.execute(
                member_helper.insert().values(user_id=usr.id, group_id=usr.group_id)
            )

    op.drop_constraint('user_group_id_fkey', 'user', type_='foreignkey')
    op.drop_column('user', 'group_id')


def downgrade():
    op.add_column('user', sa.Column('group_id', sa.INTEGER(), autoincrement=False, nullable=True))
    op.create_foreign_key('user_group_id_fkey', 'user', 'group', ['group_id'], ['id'])
