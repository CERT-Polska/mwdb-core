"""Single object table

Revision ID: 6db157d09a30
Revises: d7725a4e500c
Create Date: 2022-09-02 11:53:17.633333

"""
import logging

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "6db157d09a30"
down_revision = "d7725a4e500c"
branch_labels = None
depends_on = None


logger = logging.getLogger("alembic")


def upgrade():
    # Migrate data from specialized tables to object columns
    logger.info("Migrating blob data into object table...")
    op.add_column("object", sa.Column("blob_name", sa.String(), nullable=True))
    op.add_column("object", sa.Column("blob_size", sa.Integer(), nullable=True))
    op.add_column("object", sa.Column("blob_type", sa.String(length=32), nullable=True))
    op.add_column("object", sa.Column("content", sa.String(), nullable=True))
    op.add_column("object", sa.Column("last_seen", sa.DateTime(), nullable=True))
    op.execute(
        """
        UPDATE object 
        SET blob_name=blob.blob_name,
            blob_size=blob.blob_size,
            blob_type=blob.blob_type,
            content=blob.content,
            last_seen=blob.last_seen 
        FROM (
            SELECT * FROM text_blob
        ) AS blob
        WHERE object.id = blob.id;
        """
    )

    logger.info("Migrating config data into object table...")
    op.add_column("object", sa.Column("family", sa.String(length=32), nullable=True))
    op.add_column(
        "object",
        sa.Column("cfg", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "object", sa.Column("config_type", sa.String(length=32), nullable=True)
    )
    op.execute(
        """
        UPDATE object 
        SET family=config.family,
            cfg=config.cfg,
            config_type=config.config_type
        FROM (
            SELECT * FROM static_config
        ) AS config
        WHERE object.id = config.id;
        """
    )

    logger.info("Migrating file data into object table...")
    op.add_column(
        "object",
        sa.Column(
            "alt_names",
            postgresql.ARRAY(sa.String()),
            server_default="{}",
            nullable=False,
        ),
    )
    op.add_column("object", sa.Column("crc32", sa.String(length=8), nullable=True))
    op.add_column("object", sa.Column("file_name", sa.String(), nullable=True))
    op.add_column("object", sa.Column("file_size", sa.Integer(), nullable=True))
    op.add_column("object", sa.Column("file_type", sa.Text(), nullable=True))
    op.add_column("object", sa.Column("md5", sa.String(length=32), nullable=True))
    op.add_column("object", sa.Column("sha1", sa.String(length=40), nullable=True))
    op.add_column("object", sa.Column("sha256", sa.String(length=64), nullable=True))
    op.add_column("object", sa.Column("sha512", sa.String(length=128), nullable=True))
    op.add_column("object", sa.Column("ssdeep", sa.String(length=255), nullable=True))
    op.execute(
        """
        UPDATE object 
        SET alt_names = f.alt_names,
            crc32 = f.crc32,
            file_name = f.file_name,
            file_size = f.file_size,
            file_type = f.file_type,
            md5 = f.md5,
            sha1 = f.sha1,
            sha256 = f.sha256,
            sha512 = f.sha512,
            ssdeep = f.ssdeep
        FROM (
            SELECT * FROM file
        ) AS f
        WHERE object.id = f.id;
        """
    )
    # Drop old indexes
    logger.info("Dropping old indexes...")
    op.drop_index("ix_static_config_config_type", table_name="static_config")
    op.drop_index("ix_static_config_family", table_name="static_config")
    op.drop_index("ix_file_crc32", table_name="file")
    op.drop_index("ix_file_file_name", table_name="file")
    op.drop_index("ix_file_file_size", table_name="file")
    op.drop_index("ix_file_file_type", table_name="file")
    op.drop_index("ix_file_md5", table_name="file")
    op.drop_index("ix_file_sha1", table_name="file")
    op.drop_index("ix_file_sha256", table_name="file")
    op.drop_index("ix_file_sha512", table_name="file")
    op.drop_index("ix_file_ssdeep", table_name="file")
    op.drop_index("ix_text_blob_blob_name", table_name="text_blob")
    op.drop_index("ix_text_blob_blob_size", table_name="text_blob")
    op.drop_index("ix_text_blob_blob_type", table_name="text_blob")
    op.drop_index("ix_text_blob_last_seen", table_name="text_blob")
    # Create indexes
    logger.info("Indexing new data...")
    op.create_index(op.f("ix_object_type"), "object", ["type"], unique=False)
    op.create_index(op.f("ix_object_blob_name"), "object", ["blob_name"], unique=False)
    op.create_index(op.f("ix_object_blob_size"), "object", ["blob_size"], unique=False)
    op.create_index(op.f("ix_object_blob_type"), "object", ["blob_type"], unique=False)
    op.create_index(
        op.f("ix_object_config_type"), "object", ["config_type"], unique=False
    )
    op.create_index(op.f("ix_object_crc32"), "object", ["crc32"], unique=False)
    op.create_index(op.f("ix_object_family"), "object", ["family"], unique=False)
    op.create_index(op.f("ix_object_file_name"), "object", ["file_name"], unique=False)
    op.create_index(op.f("ix_object_file_size"), "object", ["file_size"], unique=False)
    op.create_index(op.f("ix_object_file_type"), "object", ["file_type"], unique=False)
    op.create_index(op.f("ix_object_last_seen"), "object", ["last_seen"], unique=False)
    op.create_index(op.f("ix_object_md5"), "object", ["md5"], unique=False)
    op.create_index(op.f("ix_object_sha1"), "object", ["sha1"], unique=False)
    op.create_index(op.f("ix_object_sha256"), "object", ["sha256"], unique=True)
    op.create_index(op.f("ix_object_sha512"), "object", ["sha512"], unique=False)
    op.create_index(op.f("ix_object_ssdeep"), "object", ["ssdeep"], unique=False)
    # Drop old tables
    logger.info("Dropping old tables...")
    op.drop_table("static_config")
    op.drop_table("file")
    op.drop_table("text_blob")
    logger.info("Running analyze...")
    op.execute("ANALYZE")
    # ### end Alembic commands ###


def downgrade():
    raise NotImplementedError("These no downgrade defined for this migration")
    op.drop_index(op.f("ix_object_ssdeep"), table_name="object")
    op.drop_index(op.f("ix_object_sha512"), table_name="object")
    op.drop_index(op.f("ix_object_sha256"), table_name="object")
    op.drop_index(op.f("ix_object_sha1"), table_name="object")
    op.drop_index(op.f("ix_object_md5"), table_name="object")
    op.drop_index(op.f("ix_object_last_seen"), table_name="object")
    op.drop_index(op.f("ix_object_file_type"), table_name="object")
    op.drop_index(op.f("ix_object_file_size"), table_name="object")
    op.drop_index(op.f("ix_object_file_name"), table_name="object")
    op.drop_index(op.f("ix_object_family"), table_name="object")
    op.drop_index(op.f("ix_object_crc32"), table_name="object")
    op.drop_index(op.f("ix_object_config_type"), table_name="object")
    op.drop_index(op.f("ix_object_blob_type"), table_name="object")
    op.drop_index(op.f("ix_object_blob_size"), table_name="object")
    op.drop_index(op.f("ix_object_blob_name"), table_name="object")
    op.drop_column("object", "ssdeep")
    op.drop_column("object", "sha512")
    op.drop_column("object", "sha256")
    op.drop_column("object", "sha1")
    op.drop_column("object", "md5")
    op.drop_column("object", "last_seen")
    op.drop_column("object", "file_type")
    op.drop_column("object", "file_size")
    op.drop_column("object", "file_name")
    op.drop_column("object", "family")
    op.drop_column("object", "crc32")
    op.drop_column("object", "content")
    op.drop_column("object", "config_type")
    op.drop_column("object", "cfg")
    op.drop_column("object", "blob_type")
    op.drop_column("object", "blob_size")
    op.drop_column("object", "blob_name")
    op.drop_column("object", "alt_names")
    op.create_table(
        "text_blob",
        sa.Column("id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("blob_name", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.Column("blob_size", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column(
            "blob_type", sa.VARCHAR(length=32), autoincrement=False, nullable=False
        ),
        sa.Column("content", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.Column(
            "last_seen", postgresql.TIMESTAMP(), autoincrement=False, nullable=False
        ),
        sa.ForeignKeyConstraint(["id"], ["object.id"], name="text_blob_id_fkey"),
        sa.PrimaryKeyConstraint("id", name="text_blob_pkey"),
    )
    op.create_index("ix_text_blob_last_seen", "text_blob", ["last_seen"], unique=False)
    op.create_index("ix_text_blob_blob_type", "text_blob", ["blob_type"], unique=False)
    op.create_index("ix_text_blob_blob_size", "text_blob", ["blob_size"], unique=False)
    op.create_index("ix_text_blob_blob_name", "text_blob", ["blob_name"], unique=False)
    op.create_table(
        "file",
        sa.Column("id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("file_name", sa.VARCHAR(), autoincrement=False, nullable=False),
        sa.Column("file_size", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("file_type", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column("md5", sa.VARCHAR(length=32), autoincrement=False, nullable=False),
        sa.Column("crc32", sa.VARCHAR(length=8), autoincrement=False, nullable=False),
        sa.Column("sha1", sa.VARCHAR(length=40), autoincrement=False, nullable=False),
        sa.Column("sha256", sa.VARCHAR(length=64), autoincrement=False, nullable=False),
        sa.Column(
            "sha512", sa.VARCHAR(length=128), autoincrement=False, nullable=False
        ),
        sa.Column("ssdeep", sa.VARCHAR(length=255), autoincrement=False, nullable=True),
        sa.Column(
            "alt_names",
            postgresql.ARRAY(sa.VARCHAR()),
            server_default=sa.text("'{}'::character varying[]"),
            autoincrement=False,
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["id"], ["object.id"], name="file_id_fkey"),
        sa.PrimaryKeyConstraint("id", name="file_pkey"),
    )
    op.create_index("ix_file_ssdeep", "file", ["ssdeep"], unique=False)
    op.create_index("ix_file_sha512", "file", ["sha512"], unique=False)
    op.create_index("ix_file_sha256", "file", ["sha256"], unique=True)
    op.create_index("ix_file_sha1", "file", ["sha1"], unique=False)
    op.create_index("ix_file_md5", "file", ["md5"], unique=False)
    op.create_index("ix_file_file_type", "file", ["file_type"], unique=False)
    op.create_index("ix_file_file_size", "file", ["file_size"], unique=False)
    op.create_index("ix_file_file_name", "file", ["file_name"], unique=False)
    op.create_index("ix_file_crc32", "file", ["crc32"], unique=False)
    op.create_table(
        "static_config",
        sa.Column("id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("family", sa.VARCHAR(length=32), autoincrement=False, nullable=False),
        sa.Column(
            "config_type",
            sa.VARCHAR(length=32),
            server_default=sa.text("'static'::character varying"),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column(
            "cfg",
            postgresql.JSONB(astext_type=sa.Text()),
            autoincrement=False,
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["id"], ["object.id"], name="static_config_id_fkey"),
        sa.PrimaryKeyConstraint("id", name="static_config_pkey"),
    )
    op.create_index(
        "ix_static_config_family", "static_config", ["family"], unique=False
    )
    op.create_index(
        "ix_static_config_config_type", "static_config", ["config_type"], unique=False
    )
    # ### end Alembic commands ###
