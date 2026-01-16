-- ============================================================================
-- Migration 008: Add Soft Delete to Clients
-- ============================================================================
-- Add is_deleted column to clients table for soft delete functionality
-- ============================================================================

-- Add is_deleted column to clients table
ALTER TABLE clients
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for faster queries filtering by is_deleted
CREATE INDEX idx_clients_is_deleted ON clients(trainer_id, is_deleted);

-- Add comment
COMMENT ON COLUMN clients.is_deleted IS 'Soft delete flag - true if client is deleted but retained for historical data';
