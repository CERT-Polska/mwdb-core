"""quick query to user relation

Revision ID: 1b49fefdfcb0
Revises: b78affca7273
Create Date: 2022-09-05 11:50:35.701528

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "1b49fefdfcb0"
down_revision = "b78affca7273"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint("quick_query_user_id_fkey", "quick_query", type_="foreignkey")
    op.create_foreign_key(
        None, "quick_query", "user", ["user_id"], ["id"], ondelete="CASCADE"
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, "quick_query", type_="foreignkey")
    op.create_foreign_key(
        "quick_query_user_id_fkey", "quick_query", "user", ["user_id"], ["id"]
    )
    # ### end Alembic commands ###
