"""openID_tables

Revision ID: 243dede4eb74
Revises: 35916645cf47
Create Date: 2021-09-17 11:00:24.555849

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "243dede4eb74"
down_revision = "35916645cf47"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "openid_provider",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("client_id", sa.String(length=64), nullable=False),
        sa.Column("client_secret", sa.String(length=64), nullable=True),
        sa.Column("authorization_endpoint", sa.String(length=128), nullable=False),
        sa.Column("token_endpoint", sa.String(length=128), nullable=False),
        sa.Column("userinfo_endpoint", sa.String(length=128), nullable=False),
        sa.Column("jwks_endpoint", sa.String(length=128), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "openid_identity",
        sa.Column("sub_id", sa.String(length=256), nullable=False),
        sa.Column("provider_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["provider_id"],
            ["openid_provider.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["user.id"],
        ),
        sa.PrimaryKeyConstraint("sub_id", "provider_id", "user_id"),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("openid_identity")
    op.drop_table("openid_provider")
    # ### end Alembic commands ###
