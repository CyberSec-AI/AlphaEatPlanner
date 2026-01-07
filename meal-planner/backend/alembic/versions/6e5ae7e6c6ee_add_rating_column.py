"""add_rating_column

Revision ID: 6e5ae7e6c6ee
Revises: da05c4392ad1
Create Date: 2026-01-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6e5ae7e6c6ee'
down_revision: Union[str, None] = 'da05c4392ad1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('recipes', sa.Column('rating', sa.Integer(), nullable=True, default=0))


def downgrade() -> None:
    op.drop_column('recipes', 'rating')
