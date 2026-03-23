"""add supporting_documents

Revision ID: 76a1e708e65b
Revises: 
Create Date: 2026-03-20 18:21:49.739108

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '76a1e708e65b'
down_revision: Union[str, Sequence[str], None] = None

def upgrade():
    op.add_column(
        'applications',
        sa.Column('supporting_documents', sa.Text(), nullable=True)
    )