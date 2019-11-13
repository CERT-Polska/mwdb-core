"""empty message

Revision ID: 462a7481563f
Revises: b77f641bc025
Create Date: 2019-03-12 17:25:45.922461

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '462a7481563f'
down_revision = 'b77f641bc025'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute("ALTER TABLE ONLY \"user\" ALTER COLUMN id SET DEFAULT nextval('user_id_seq'::regclass);")


def downgrade():
    pass
