"""convert chart_data and schema_json to JSONB

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-09

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = '0003'
down_revision: Union[str, None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'messages', 'chart_data',
        type_=JSONB,
        postgresql_using='chart_data::jsonb',
        existing_nullable=True,
    )
    op.alter_column(
        'csv_files', 'schema_json',
        type_=JSONB,
        postgresql_using='schema_json::jsonb',
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        'messages', 'chart_data',
        type_=sa.Text(),
        postgresql_using='chart_data::text',
        existing_nullable=True,
    )
    op.alter_column(
        'csv_files', 'schema_json',
        type_=sa.Text(),
        postgresql_using='schema_json::text',
        existing_nullable=True,
    )
