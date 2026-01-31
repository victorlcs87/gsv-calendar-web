-- ============================================
-- GSV Calendar - Schema do Banco de Dados
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Tabela de Escalas
CREATE TABLE IF NOT EXISTS scales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('Ordinária', 'Extra')),
    local TEXT NOT NULL,
    hora_inicio INTEGER NOT NULL CHECK (hora_inicio >= 0 AND hora_inicio <= 23),
    hora_fim INTEGER NOT NULL CHECK (hora_fim >= 0 AND hora_fim <= 23),
    horas INTEGER NOT NULL DEFAULT 0,
    valor_bruto NUMERIC(10, 2) NOT NULL DEFAULT 0,
    valor_liquido NUMERIC(10, 2) NOT NULL DEFAULT 0,
    observacoes TEXT,
    sincronizado BOOLEAN NOT NULL DEFAULT FALSE,
    sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
    calendar_event_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS scales_user_id_idx ON scales(user_id);
CREATE INDEX IF NOT EXISTS scales_data_idx ON scales(data);
CREATE INDEX IF NOT EXISTS scales_user_data_idx ON scales(user_id, data);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS scales_updated_at ON scales;
CREATE TRIGGER scales_updated_at
    BEFORE UPDATE ON scales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular horas e valores automaticamente
CREATE OR REPLACE FUNCTION calculate_scale_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcula horas (considera virada de meia-noite)
    IF NEW.hora_fim >= NEW.hora_inicio THEN
        NEW.horas = NEW.hora_fim - NEW.hora_inicio;
    ELSE
        NEW.horas = (24 - NEW.hora_inicio) + NEW.hora_fim;
    END IF;
    
    -- Calcula valores (R$50/hora, desconto 27.5%)
    NEW.valor_bruto = NEW.horas * 50.00;
    NEW.valor_liquido = NEW.valor_bruto * 0.725;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para cálculo automático
DROP TRIGGER IF EXISTS scales_calculate_values ON scales;
CREATE TRIGGER scales_calculate_values
    BEFORE INSERT OR UPDATE ON scales
    FOR EACH ROW
    EXECUTE FUNCTION calculate_scale_values();

-- ============================================
-- Row Level Security (RLS)
-- Cada usuário só vê/edita suas próprias escalas
-- ============================================

ALTER TABLE scales ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver suas próprias escalas
CREATE POLICY "Users can view own scales"
    ON scales FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Usuário pode inserir suas próprias escalas
CREATE POLICY "Users can insert own scales"
    ON scales FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Usuário pode atualizar suas próprias escalas
CREATE POLICY "Users can update own scales"
    ON scales FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Usuário pode deletar suas próprias escalas
CREATE POLICY "Users can delete own scales"
    ON scales FOR DELETE
    USING (auth.uid() = user_id);
