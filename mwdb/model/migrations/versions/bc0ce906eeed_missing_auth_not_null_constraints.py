"""Missing auth 'not null' constraints

Revision ID: bc0ce906eeed
Revises: 2e692ea445a1
Create Date: 2020-07-13 17:28:25.481454

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "bc0ce906eeed"
down_revision = "2e692ea445a1"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "UPDATE \"user\" SET additional_info='<unknown>' WHERE additional_info IS NULL"
    )
    op.execute('UPDATE "group" SET private=FALSE WHERE private IS NULL')
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column("api_key", "issued_by", existing_type=sa.INTEGER(), nullable=False)
    op.alter_column(
        "api_key", "issued_on", existing_type=postgresql.TIMESTAMP(), nullable=False
    )
    op.alter_column("group", "private", existing_type=sa.BOOLEAN(), nullable=False)
    op.alter_column(
        "user", "additional_info", existing_type=sa.VARCHAR(), nullable=False
    )
    op.alter_column(
        "user", "email", existing_type=sa.VARCHAR(length=128), nullable=False
    )
    op.alter_column(
        "user",
        "feed_quality",
        existing_type=sa.VARCHAR(length=32),
        nullable=False,
        existing_server_default=sa.text("'high'::character varying"),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "user",
        "feed_quality",
        existing_type=sa.VARCHAR(length=32),
        nullable=True,
        existing_server_default=sa.text("'high'::character varying"),
    )
    op.alter_column(
        "user", "email", existing_type=sa.VARCHAR(length=128), nullable=True
    )
    op.alter_column(
        "user", "additional_info", existing_type=sa.VARCHAR(), nullable=True
    )
    op.alter_column("group", "private", existing_type=sa.BOOLEAN(), nullable=True)
    op.alter_column(
        "api_key", "issued_on", existing_type=postgresql.TIMESTAMP(), nullable=True
    )
    op.alter_column("api_key", "issued_by", existing_type=sa.INTEGER(), nullable=True)
    # ### end Alembic commands ###
