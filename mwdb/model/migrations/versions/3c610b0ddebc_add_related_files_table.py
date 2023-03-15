"""add related_files table

Revision ID: 3c610b0ddebc
Revises: 717b5da712b8
Create Date: 2022-12-12 09:02:40.406370

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3c610b0ddebc"
down_revision = "717b5da712b8"
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
