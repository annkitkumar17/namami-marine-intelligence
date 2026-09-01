"""Initial NAMAMI Database Schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-01 23:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import geoalchemy2

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    
    op.create_table(
        'app_user',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True, unique=True),
        sa.Column('preferred_language', sa.String(), server_default='en'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )

    op.create_table(
        'vessel_class',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('max_wave_height_m', sa.Float(), nullable=False),
        sa.Column('max_wind_speed_knots', sa.Float(), nullable=False),
        sa.Column('max_distance_nmi', sa.Float(), nullable=False)
    )

    op.create_table(
        'vessel',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('registration_no', sa.String(), nullable=False, unique=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('app_user.id')),
        sa.Column('vessel_class_id', sa.String(), sa.ForeignKey('vessel_class.id')),
        sa.Column('home_port', sa.String()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )

    op.create_table(
        'voyage',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('vessel_id', sa.String(), sa.ForeignKey('vessel.id'), nullable=False),
        sa.Column('status', sa.String(), server_default='ARMED'),
        sa.Column('departure_time', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('return_time', sa.DateTime(), nullable=True),
        sa.Column('departure_location', geoalchemy2.Geometry(geometry_type='POINT', srid=4326))
    )

    op.create_table(
        'ingest_run',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('source_id', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('started_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('records_ingested', sa.Integer(), server_default='0'),
        sa.Column('error_log', sa.Text(), nullable=True)
    )

    op.create_table(
        'advisory',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('app_user.id'), nullable=True),
        sa.Column('query_text', sa.Text(), nullable=False),
        sa.Column('intent_type', sa.String(), nullable=False),
        sa.Column('safety_verdict', sa.String(), nullable=False),
        sa.Column('degraded_tier', sa.String(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('narrative', sa.Text(), nullable=False)
    )

    op.create_table(
        'ledger_step',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('advisory_id', sa.String(), sa.ForeignKey('advisory.id'), nullable=False),
        sa.Column('step_order', sa.Integer(), nullable=False),
        sa.Column('agent_name', sa.String(), nullable=False),
        sa.Column('kernel_name', sa.String(), nullable=True),
        sa.Column('inputs', sa.JSON(), nullable=False),
        sa.Column('outputs', sa.JSON(), nullable=False),
        sa.Column('execution_time_ms', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.func.now())
    )

def downgrade() -> None:
    op.drop_table('ledger_step')
    op.drop_table('advisory')
    op.drop_table('ingest_run')
    op.drop_table('voyage')
    op.drop_table('vessel')
    op.drop_table('vessel_class')
    op.drop_table('app_user')
