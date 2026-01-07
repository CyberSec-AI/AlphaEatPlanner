"""add_vegetarian_column

Revision ID: a3ed87b8b926
Revises: 6e5ae7e6c6ee
Create Date: 2026-01-05 12:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3ed87b8b926'
down_revision: Union[str, None] = '6e5ae7e6c6ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('recipes', sa.Column('is_vegetarian', sa.Boolean(), nullable=True, default=False))


def downgrade() -> None:
    op.drop_column('recipes', 'is_vegetarian')
