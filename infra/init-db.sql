-- Initialize extensions for PostGIS and TimescaleDB
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
-- TimescaleDB extension if supported in postgis image
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create default schema search path
SET search_path TO public;
