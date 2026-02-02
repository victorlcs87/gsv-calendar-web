-- Migration: Add 'ativa' and 'motivo_inatividade' to scales
-- Run this in your Supabase SQL Editor

ALTER TABLE scales 
ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS motivo_inatividade TEXT DEFAULT NULL;

-- Optional: Update existing records to be active
UPDATE scales SET ativa = true WHERE ativa IS NULL;
