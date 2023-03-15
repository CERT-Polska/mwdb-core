"""add related_files table

Revision ID: 3c610b0ddebc
Revises: bd93d1497694
Create Date: 2022-12-12 09:02:40.406370

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3c610b0ddebc"
down_revision = "bd93d1497694"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "related_file",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("object_id", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(
            ["object_id"],
            ["object.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("related_file")
