"""Add IOC tables

Revision ID: a1b2c3d4e5f6
Revises: 6745a530097e
Create Date: 2026-03-28 12:00:00.000000

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "6745a530097e"
branch_labels = None
depends_on = None


def upgrade():
    # Create the ioc table
    op.create_table(
        "ioc",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("value", sa.String(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("severity", sa.String(length=20), nullable=True),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String()),
            server_default="{}",
            nullable=True,
        ),
        sa.Column("creation_time", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ioc_type", "ioc", ["type"], unique=False)
    op.create_index("ix_ioc_value", "ioc", ["value"], unique=False)
    op.create_index("ix_ioc_type_value", "ioc", ["type", "value"], unique=True)

    # Create the object_ioc association table
    op.create_table(
        "object_ioc",
        sa.Column("object_id", sa.Integer(), nullable=False),
        sa.Column("ioc_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["object_id"], ["object.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["ioc_id"], ["ioc.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_object_ioc_object_id", "object_ioc", ["object_id"], unique=False
    )
    op.create_index(
        "ix_object_ioc_ioc_id", "object_ioc", ["ioc_id"], unique=False
    )
    op.create_index(
        "ix_object_ioc_object_ioc",
        "object_ioc",
        ["object_id", "ioc_id"],
        unique=True,
    )

    # Add IOC capabilities to groups that have manage_users
    op.execute(
        """
        UPDATE public.group
        SET capabilities = capabilities || '{adding_iocs,removing_iocs}'
        WHERE array_position(capabilities, 'manage_users') IS NOT NULL
          AND array_position(capabilities, 'adding_iocs') IS NULL;
        """
    )


def downgrade():
    op.drop_table("object_ioc")
    op.drop_table("ioc")

    op.execute(
        """
        UPDATE public.group
        SET capabilities = array_remove(
            array_remove(capabilities, 'adding_iocs'),
            'removing_iocs'
        );
        """
    )
