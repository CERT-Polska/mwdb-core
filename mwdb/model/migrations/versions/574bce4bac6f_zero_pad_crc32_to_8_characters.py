"""Zero-pad CRC32 to 8 characters

Revision ID: 574bce4bac6f
Revises: 373e4d6322eb
Create Date: 2021-12-02 16:11:21.579604

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "574bce4bac6f"
down_revision = "373e4d6322eb"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE file SET crc32=LPAD(crc32, 8, '0') WHERE char_length(crc32) < 8")


def downgrade():
    pass
