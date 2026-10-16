-- ============================================
-- MIGRACIÓN: Tabla de tokens push
-- Ejecutar: psql -d rondines_db -f migration_push_tokens.sql
-- ============================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL,
  plataforma  VARCHAR(20) DEFAULT 'android',   -- 'android' | 'ios'
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_usuario ON push_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_activo  ON push_tokens(activo);

-- Trigger updated_at
CREATE TRIGGER trigger_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Vista útil: tokens activos de supervisores y admins
CREATE OR REPLACE VIEW v_tokens_supervisores AS
  SELECT pt.token, u.nombre, u.rol
  FROM push_tokens pt
  JOIN usuarios u ON pt.usuario_id = u.id
  WHERE pt.activo = TRUE
    AND u.activo = TRUE
    AND u.rol IN ('supervisor', 'admin');
