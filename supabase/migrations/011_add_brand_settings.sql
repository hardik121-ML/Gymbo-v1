-- Migration 011: Add Brand Settings to Trainers Table
-- Adds business branding fields for PDF statements and exported documents

-- Add brand settings columns to trainers table
ALTER TABLE trainers
ADD COLUMN brand_name VARCHAR(200),
ADD COLUMN brand_address TEXT,
ADD COLUMN brand_phone VARCHAR(15),
ADD COLUMN brand_email VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN trainers.brand_name IS 'Business/brand name for statements and exports';
COMMENT ON COLUMN trainers.brand_address IS 'Business address for statements and exports';
COMMENT ON COLUMN trainers.brand_phone IS 'Business phone number for statements and exports';
COMMENT ON COLUMN trainers.brand_email IS 'Business email for statements and exports (optional)';

-- All columns nullable for graceful degradation
-- Existing trainers will have NULL values
-- Existing RLS policies automatically cover these new columns (trainers_own_data policy uses FOR ALL)
