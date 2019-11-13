"""empty message

Revision ID: b77f641bc025
Revises: 4724a4e1417d
Create Date: 2019-03-11 16:14:44.863234

"""
from alembic import op
import sqlalchemy as sa
import sys


# revision identifiers, used by Alembic.
revision = 'b77f641bc025'
down_revision = '4724a4e1417d'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    # Deleting duplicate relations
    print("Deleting duplicated relations...", file=sys.stderr)

    connection.execute("""
        DELETE FROM relation T1
              USING relation T2
              WHERE T1.ctid < T2.ctid
              AND   T1.parent_id = T2.parent_id
              AND   T1.child_id  = T2.child_id;""")

    print("Deleting duplicated object_tag entries...", file=sys.stderr)

    connection.execute("""
        DELETE FROM object_tag T1
              USING object_tag T2
              WHERE T1.ctid < T2.ctid
              AND   T1.object_id = T2.object_id
              AND   T1.tag_id  = T2.tag_id;""")

    print("Applying incides...", file=sys.stderr)

    op.create_index(op.f('ix_permission_group_id'), 'permission', ['group_id'], unique=False)
    op.create_index(op.f('ix_permission_object_id'), 'permission', ['object_id'], unique=False)
    op.create_index(op.f('ix_permission_group_object'), 'permission', ['group_id', 'object_id'], unique=True)
    op.create_index(op.f('ix_relation_parent_id'), 'relation', ['parent_id'], unique=False)
    op.create_index(op.f('ix_relation_child_id'), 'relation', ['child_id'], unique=False)
    op.create_index(op.f('ix_relation_parent_child'), 'relation', ['parent_id', 'child_id'], unique=True)
    op.create_index(op.f('ix_object_tag_object_id'), 'object_tag', ['object_id'], unique=False)
    op.create_index(op.f('ix_object_tag_tag_id'), 'object_tag', ['tag_id'], unique=False)
    op.create_index(op.f('ix_object_tag_object_child'), 'object_tag', ['object_id', 'tag_id'], unique=True)


def downgrade():
    pass
