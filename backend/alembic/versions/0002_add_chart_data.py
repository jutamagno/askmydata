"""add chart_data to messages

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-09

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('messages', sa.Column('chart_data', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('messages', 'chart_data')
