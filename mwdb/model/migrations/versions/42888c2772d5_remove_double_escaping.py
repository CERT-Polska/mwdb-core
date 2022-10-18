"""empty message

Revision ID: 42888c2772d5
Revises: e81d851aa91f
Create Date: 2022-10-17 13:50:23.665758

"""
from alembic import op
import sqlalchemy as sa
import json
from mwdb.core.util import config_decode, config_encode


# revision identifiers, used by Alembic.
revision = '42888c2772d5'
down_revision = 'e81d851aa91f'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    table = connection.execute("SELECT id, cfg FROM object").fetchall()

    meta = sa.MetaData(bind=connection)
    meta.reflect(only=("object",))
    sql_table = sa.Table("object", meta)

    for row in table:
        if row[1] is None:
            continue

        connection.execute(
            sql_table.update().where(sql_table.c.id == row[0]).values(
                cfg = config_decode(row[1])
            )
        )

def downgrade():
    connection = op.get_bind()
    table = connection.execute("SELECT id, cfg FROM object").fetchall()

    meta = sa.MetaData(bind=connection)
    meta.reflect(only=("object",))
    sql_table = sa.Table("object", meta)

    for row in table:
        if row[1] is None:
            continue
        
        connection.execute(
            sql_table.update().where(sql_table.c.id == row[0]).values(
                cfg = config_encode(row[1])
            )
        )
