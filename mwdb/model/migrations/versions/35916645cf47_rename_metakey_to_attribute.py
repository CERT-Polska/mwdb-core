"""Rename metakey to attribute

Revision ID: 35916645cf47
Revises: 7054c09d10ac
Create Date: 2021-08-30 15:32:57.160753

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "35916645cf47"
down_revision = "7054c09d10ac"
branch_labels = None
depends_on = None


def upgrade():
    op.rename_table("metakey", "attribute")
    op.execute("ALTER INDEX metakey_pkey RENAME TO attribute_pkey")
    op.execute("ALTER INDEX ix_metakey_key RENAME TO ix_attribute_key")
    op.execute("ALTER INDEX ix_metakey_value RENAME TO ix_attribute_value")
    op.execute(
        "ALTER INDEX metakey_object_id_key_value_key RENAME TO attribute_object_id_key_value_key"
    )
    op.execute("ALTER SEQUENCE metakey_id_seq RENAME TO attribute_id_seq")
    op.execute(
        'ALTER TABLE "attribute" RENAME CONSTRAINT metakey_key_fkey TO attribute_key_fkey'
    )
    op.execute(
        'ALTER TABLE "attribute" RENAME CONSTRAINT metakey_object_id_fkey TO attribute_object_id_fkey'
    )

    op.rename_table("metakey_definition", "attribute_definition")
    op.execute(
        "ALTER INDEX metakey_definition_pkey RENAME TO attribute_definition_pkey"
    )

    op.rename_table("metakey_permission", "attribute_permission")
    op.execute(
        "ALTER INDEX metakey_permission_pkey RENAME TO attribute_permission_pkey"
    )
    op.execute(
        "ALTER INDEX ix_metakey_permission_group_id RENAME TO ix_attribute_permission_group_id"
    )
    op.execute(
        "ALTER INDEX ix_metakey_permission_key RENAME TO ix_attribute_permission_key"
    )
    op.execute(
        "ALTER INDEX ix_metakey_permission_metakey_group RENAME TO ix_attribute_permission_attribute_group"
    )
    op.execute(
        "ALTER TABLE attribute_permission RENAME CONSTRAINT metakey_permission_group_id_fkey "
        "TO attribute_permission_group_id_fkey"
    )
    op.execute(
        "ALTER TABLE attribute_permission RENAME CONSTRAINT metakey_permission_key_fkey "
        "TO attribute_permission_key_fkey"
    )


def downgrade():
    pass
