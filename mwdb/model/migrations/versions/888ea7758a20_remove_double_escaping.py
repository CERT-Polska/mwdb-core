"""remove double escaping

Revision ID: 888ea7758a20
Revises: 6db157d09a30
Create Date: 2022-10-13 07:56:23.267451

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "888ea7758a20"
down_revision = "e81d851aa91f"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "UPDATE object SET cfg = to_jsonb(replace(CAST(cfg AS varchar), '\\\\', '\\')::json)"
    )


def downgrade():
    op.execute(
        "UPDATE object SET cfg = to_jsonb(replace(CAST(cfg AS varchar), '\\', '\\\\')::json)"
    )
