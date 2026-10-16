-- ============================================
-- ESQUEMA DE BASE DE DATOS - RONDINES APP
-- ============================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------
-- TABLA: usuarios (guardias y supervisores)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('guardia', 'supervisor', 'admin')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------
-- TABLA: sitios (instalaciones/empresas)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS sitios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(150) NOT NULL,
  direccion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------
-- TABLA: puntos_rondin (puntos de control con QR)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS puntos_rondin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sitio_id UUID REFERENCES sitios(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  qr_codigo VARCHAR(255) UNIQUE NOT NULL,  -- El contenido del código QR
  latitud DECIMAL(10, 8),                   -- Coordenada esperada
  longitud DECIMAL(11, 8),
  radio_tolerancia_metros INT DEFAULT 50,   -- Margen de distancia aceptado
  orden INT DEFAULT 0,                      -- Orden en la ruta
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------
-- TABLA: rutas (secuencia de puntos)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS rutas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sitio_id UUID REFERENCES sitios(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  intervalo_minutos INT DEFAULT 60,         -- Cada cuánto debe completarse
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Puntos que conforman una ruta
CREATE TABLE IF NOT EXISTS ruta_puntos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ruta_id UUID REFERENCES rutas(id) ON DELETE CASCADE,
  punto_id UUID REFERENCES puntos_rondin(id) ON DELETE CASCADE,
  orden INT NOT NULL,
  UNIQUE(ruta_id, orden)
);

-- ----------------------------------------
-- TABLA: turnos (asignación guardia-ruta)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guardia_id UUID REFERENCES usuarios(id),
  ruta_id UUID REFERENCES rutas(id),
  inicio TIMESTAMP NOT NULL,
  fin TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------
-- TABLA: escaneos (registro de cada QR escaneado)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS escaneos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turno_id UUID REFERENCES turnos(id),
  guardia_id UUID REFERENCES usuarios(id) NOT NULL,
  punto_id UUID REFERENCES puntos_rondin(id) NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,          -- GPS al momento del escaneo
  longitud DECIMAL(11, 8) NOT NULL,
  precision_gps DECIMAL(8, 2),             -- Precisión en metros
  dentro_de_rango BOOLEAN DEFAULT FALSE,    -- Si el GPS coincide con el punto
  foto_url TEXT,                            -- Opcional: foto del guardia
  notas TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------
-- TABLA: alertas
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  turno_id UUID REFERENCES turnos(id),
  guardia_id UUID REFERENCES usuarios(id),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'no_escaneo',        -- Guardia no escaneó a tiempo
    'fuera_de_rango',    -- GPS lejos del punto QR
    'turno_no_iniciado', -- No inició turno a tiempo
    'sos'                -- Alerta manual del guardia
  )),
  mensaje TEXT,
  resuelta BOOLEAN DEFAULT FALSE,
  resuelta_por UUID REFERENCES usuarios(id),
  resuelta_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------
-- ÍNDICES para mejor rendimiento
-- ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_escaneos_guardia ON escaneos(guardia_id);
CREATE INDEX IF NOT EXISTS idx_escaneos_punto ON escaneos(punto_id);
CREATE INDEX IF NOT EXISTS idx_escaneos_timestamp ON escaneos(timestamp);
CREATE INDEX IF NOT EXISTS idx_alertas_guardia ON alertas(guardia_id);
CREATE INDEX IF NOT EXISTS idx_alertas_resuelta ON alertas(resuelta);
CREATE INDEX IF NOT EXISTS idx_turnos_activo ON turnos(activo);

-- ----------------------------------------
-- FUNCIÓN: actualizar updated_at automáticamente
-- ----------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
