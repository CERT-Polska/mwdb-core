"""New logic for reason_type in permission table

Revision ID: 717b5da712b8
Revises: 25ea40a798ac
Create Date: 2023-01-03 13:57:32.830842

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "717b5da712b8"
down_revision = "25ea40a798ac"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        UPDATE
            permission
        SET
            reason_type = 'shared'
        FROM
            public.group,
            public.user	
        WHERE
            public.group.id = permission.group_id
            AND public.user.id = permission.related_user_id
            AND reason_type = 'added'
            AND public.group.name != public.user.login;
    """
    )


def downgrade():
    """
    Downgrade is possible - it won't cause instability
    However it is impossible to revert changes
    """
    pass
