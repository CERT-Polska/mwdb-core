"""empty message

Revision ID: fea4bc808004
Revises: 99b9cc3981db
Create Date: 2018-12-19 18:48:27.297771

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fea4bc808004'
down_revision = '99b9cc3981db'
branch_labels = None
depends_on = None


def upgrade():
    print("Removing parent relationships with duplicates...")
    op.execute("""
delete from relation where parent_id in (
    select object_id from object_tag 
    inner join static_config on static_config.id = object_tag.object_id 
    where tag_id = (select id from tag where tag = 'duplicate')
);
    """)

    print("Removing child relationships with duplicates...")
    op.execute("""
delete from relation where child_id in (
    select object_id from object_tag 
    inner join static_config on static_config.id = object_tag.object_id 
    where tag_id = (select id from tag where tag = 'duplicate')
);
    """)

    print("Removing metakeys of duplicates...")
    op.execute("""
delete from metakey where object_id in (
    select object_id from object_tag
    inner join static_config on static_config.id = object_tag.object_id
    where tag_id = (select id from tag where tag = 'duplicate')
);
    """)

    print("Removing comments of duplicates...")
    op.execute("""
delete from comment where object_id in (
    select object_id from object_tag
    inner join static_config on static_config.id = object_tag.object_id
    where tag_id = (select id from tag where tag = 'duplicate')
);
    """)

    print("Removing permissions of duplicates...")
    op.execute("""
delete from permission where object_id in (
    select object_id from object_tag
    inner join static_config on static_config.id = object_tag.object_id
    where tag_id = (select id from tag where tag = 'duplicate')
);
    """)

    print("Removing static_config objects...")
    op.execute("""
delete from static_config where id in (
    select object_id from object_tag
    inner join static_config on static_config.id = object_tag.object_id
    where tag_id = (select id from tag where tag = 'duplicate')
);
    """)

    print("Removing inheritance...")
    op.execute("""
update object set type=null where id in (
    select object_id from object_tag
    inner join static_config on static_config.id = object_tag.object_id
    where tag_id = (select id from tag where tag = 'duplicate')
);
    """)

    print("Deleting duplicate tag...")
    op.execute("""
delete from object_tag
where tag_id = (select id from tag where tag = 'duplicate');
    """)
    op.execute("delete from tag where tag = 'duplicate';")

    print("Deleting objects...")
    op.execute("delete from object where type is null;")


def downgrade():
    pass
