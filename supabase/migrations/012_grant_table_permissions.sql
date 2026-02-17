-- ============================================================================
-- Gymbo Database Schema - Grant Table Permissions
-- Migration: 012_grant_table_permissions.sql
-- Description: Fix permission denied errors by granting table access to roles
-- ============================================================================

-- Grant permissions on all tables to service_role (bypasses RLS)
GRANT ALL ON TABLE trainers TO service_role;
GRANT ALL ON TABLE clients TO service_role;
GRANT ALL ON TABLE punches TO service_role;
GRANT ALL ON TABLE payments TO service_role;
GRANT ALL ON TABLE audit_log TO service_role;

-- Grant permissions to authenticated users (respects RLS policies)
GRANT ALL ON TABLE trainers TO authenticated;
GRANT ALL ON TABLE clients TO authenticated;
GRANT ALL ON TABLE punches TO authenticated;
GRANT ALL ON TABLE payments TO authenticated;
GRANT ALL ON TABLE audit_log TO authenticated;

-- Grant permissions to anon users (respects RLS policies)
GRANT ALL ON TABLE trainers TO anon;
GRANT ALL ON TABLE clients TO anon;
GRANT ALL ON TABLE punches TO anon;
GRANT ALL ON TABLE payments TO anon;
GRANT ALL ON TABLE audit_log TO anon;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
