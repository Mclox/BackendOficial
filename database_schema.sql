-- ====================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS COMPLETO (DDL) PARA POSTGRESQL
-- BARBERSITE V2 - MIGRACIÓN DESDE SQL SERVER
-- ====================================================================

-- 1. Roles
CREATE TABLE IF NOT EXISTS Roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'Activo' NOT NULL,
    permisos JSONB DEFAULT '[]' NOT NULL
);

-- 2. Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INT NOT NULL REFERENCES Roles(id_rol) ON DELETE RESTRICT,
    nombre VARCHAR(150) NOT NULL,
    tipo_documento VARCHAR(10) DEFAULT 'CC' NOT NULL,
    documento VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    contrasena VARCHAR(255) NOT NULL,
    img VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'Activo' NOT NULL
);

-- 3. Clientes
CREATE TABLE IF NOT EXISTS Clientes (
    id_cliente SERIAL PRIMARY KEY,
    id_usuario INT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    nombre_invitado VARCHAR(150),
    telefono_invitado VARCHAR(20),
    email_invitado VARCHAR(100),
    tipo_documento VARCHAR(10),
    documento VARCHAR(30)
);

-- 4. Barberos
CREATE TABLE IF NOT EXISTS Barberos (
    id_barbero SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'Activo' NOT NULL,
    tipo_contrato VARCHAR(50) DEFAULT 'porcentaje' NOT NULL,
    porcentaje_ganancia DECIMAL(5,2),
    hora_inicio TIME,
    hora_fin TIME
);

-- 5. Categorías de Productos
CREATE TABLE IF NOT EXISTS Categorias_Productos (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

-- 6. Marcas
CREATE TABLE IF NOT EXISTS Marcas (
    id_marca SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

-- 7. Productos
CREATE TABLE IF NOT EXISTS Productos (
    id_producto SERIAL PRIMARY KEY,
    id_categoria INT REFERENCES Categorias_Productos(id_categoria) ON DELETE SET NULL,
    id_marca INT REFERENCES Marcas(id_marca) ON DELETE SET NULL,
    nombre VARCHAR(150) NOT NULL,
    precio_neto DECIMAL(12,2) NOT NULL,
    iva_porcentaje DECIMAL(5,2) DEFAULT 19.00 NOT NULL,
    stock INT DEFAULT 0 NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    descripcion TEXT,
    img VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'Activo' NOT NULL,
    tipo_adquisicion VARCHAR(50) DEFAULT 'compra_directa' NOT NULL
);

-- 8. Servicios
CREATE TABLE IF NOT EXISTS Servicios (
    id_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio_neto DECIMAL(12,2) NOT NULL,
    iva_porcentaje DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    duracion_minutos INT NOT NULL,
    estado VARCHAR(20) DEFAULT 'Activo' NOT NULL,
    descripcion TEXT
);

-- 9. Citas
CREATE TABLE IF NOT EXISTS Citas (
    id_cita SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES Clientes(id_cliente) ON DELETE CASCADE,
    id_barbero INT NOT NULL REFERENCES Barberos(id_barbero) ON DELETE CASCADE,
    id_servicio INT NOT NULL REFERENCES Servicios(id_servicio) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora_inicio VARCHAR(10) NOT NULL,
    hora_fin VARCHAR(10) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' NOT NULL,
    detalles_json JSONB DEFAULT '{}'::jsonb,
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    recordatorio_30m_enviado BOOLEAN DEFAULT FALSE
);

-- 10. Notificaciones
CREATE TABLE IF NOT EXISTS Notificaciones (
    id SERIAL PRIMARY KEY,
    modulo VARCHAR(100) NOT NULL,
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    usuario_id INT NULL REFERENCES Usuarios(id_usuario) ON DELETE SET NULL,
    usuario_nombre VARCHAR(100) NULL,
    leido BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. Ventas
CREATE TABLE IF NOT EXISTS Ventas (
    id_venta SERIAL PRIMARY KEY,
    id_cliente INT NULL REFERENCES Clientes(id_cliente) ON DELETE SET NULL,
    id_vendedor INT NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE RESTRICT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    total DECIMAL(12,2) DEFAULT 0.00 NOT NULL
);

-- 12. Ventas Detalle
CREATE TABLE IF NOT EXISTS Ventas_Detalle (
    id_detalle SERIAL PRIMARY KEY,
    id_venta INT NOT NULL REFERENCES Ventas(id_venta) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Producto', 'Servicio')),
    id_producto INT NULL REFERENCES Productos(id_producto) ON DELETE SET NULL,
    id_servicio INT NULL REFERENCES Servicios(id_servicio) ON DELETE SET NULL,
    id_barbero INT NULL REFERENCES Barberos(id_barbero) ON DELETE SET NULL,
    cantidad INT NOT NULL,
    precio_unitario_neto DECIMAL(12,2) NOT NULL,
    iva_monto DECIMAL(12,2) NOT NULL,
    subtotal_item DECIMAL(12,2) NOT NULL
);

-- 13. Entradas Productos
CREATE TABLE IF NOT EXISTS Entradas_Productos (
    id_entrada SERIAL PRIMARY KEY,
    id_producto INT NOT NULL REFERENCES Productos(id_producto) ON DELETE CASCADE,
    id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE RESTRICT,
    cantidad INT NOT NULL,
    observaciones VARCHAR(255),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado VARCHAR(20) DEFAULT 'Activo' NOT NULL,
    motivo_anulacion VARCHAR(255),
    fecha_anulacion TIMESTAMP
);

-- 14. Proveedores
CREATE TABLE IF NOT EXISTS Proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    id_marca INT REFERENCES Marcas(id_marca) ON DELETE SET NULL,
    nombre VARCHAR(150) NOT NULL,
    documento VARCHAR(30) UNIQUE NOT NULL,
    representante VARCHAR(150),
    telefono VARCHAR(20),
    correo VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'Activo' NOT NULL
);

-- 15. Compras
CREATE TABLE IF NOT EXISTS Compras (
    id_compra SERIAL PRIMARY KEY,
    id_proveedor INT NOT NULL REFERENCES Proveedores(id_proveedor) ON DELETE RESTRICT,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    total DECIMAL(12,2) NOT NULL
);

-- 16. Detalle Compra
CREATE TABLE IF NOT EXISTS Detalle_Compra (
    id_detalle_compra SERIAL PRIMARY KEY,
    id_compra INT NOT NULL REFERENCES Compras(id_compra) ON DELETE CASCADE,
    id_producto INT NOT NULL REFERENCES Productos(id_producto) ON DELETE RESTRICT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL
);

-- 17. Devoluciones Proveedor
CREATE TABLE IF NOT EXISTS Devoluciones_Proveedor (
    id_dev_prov SERIAL PRIMARY KEY,
    id_detalle_compra INT NOT NULL REFERENCES Detalle_Compra(id_detalle_compra) ON DELETE CASCADE,
    id_proveedor INT NOT NULL REFERENCES Proveedores(id_proveedor) ON DELETE RESTRICT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    motivo VARCHAR(255),
    cantidad_devuelta INT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' NOT NULL
);

-- 18. Devoluciones Stock
CREATE TABLE IF NOT EXISTS Devoluciones_Stock (
    id_devolucion SERIAL PRIMARY KEY,
    id_venta INT NOT NULL REFERENCES Ventas(id_venta) ON DELETE CASCADE,
    id_producto INT NOT NULL REFERENCES Productos(id_producto) ON DELETE RESTRICT,
    id_usuario INT NOT NULL REFERENCES Usuarios(id_usuario) ON DELETE RESTRICT,
    cantidad INT NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    estado VARCHAR(20) DEFAULT 'Activo' NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices recomendados para optimización
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON Usuarios(id_rol);
CREATE INDEX IF NOT EXISTS idx_clientes_usuario ON Clientes(id_usuario);
CREATE INDEX IF NOT EXISTS idx_barberos_usuario ON Barberos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON Productos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_productos_marca ON Productos(id_marca);
CREATE INDEX IF NOT EXISTS idx_citas_cliente ON Citas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_citas_barbero ON Citas(id_barbero);
CREATE INDEX IF NOT EXISTS idx_citas_servicio ON Citas(id_servicio);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON Ventas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON Ventas(id_vendedor);
CREATE INDEX IF NOT EXISTS idx_ventas_detalle_venta ON Ventas_Detalle(id_venta);
CREATE INDEX IF NOT EXISTS idx_entradas_productos_prod ON Entradas_Productos(id_producto);
CREATE INDEX IF NOT EXISTS idx_entradas_productos_user ON Entradas_Productos(id_usuario);

-- TRIGGERS PARA SIMULAR LÓGICA AUTOMÁTICA DE STOCK Y TOTALES

-- A. Trigger para Ventas_Detalle (Actualizar Ventas.total y restar stock de Productos)
CREATE OR REPLACE FUNCTION fn_trg_ventas_detalle_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Actualizar total de la Venta
    UPDATE Ventas 
    SET total = COALESCE(total, 0) + NEW.subtotal_item 
    WHERE id_venta = NEW.id_venta;

    -- 2. Restar stock de Productos si el tipo es 'Producto'
    IF NEW.tipo = 'Producto' AND NEW.id_producto IS NOT NULL THEN
        UPDATE Productos 
        SET stock = stock - NEW.cantidad 
        WHERE id_producto = NEW.id_producto;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_ventas_detalle_insert
AFTER INSERT ON Ventas_Detalle
FOR EACH ROW
EXECUTE FUNCTION fn_trg_ventas_detalle_insert();

-- B. Trigger para Entradas_Productos (Actualizar stock de Productos al insertar/anular)
CREATE OR REPLACE FUNCTION fn_trg_entradas_productos_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es una inserción normal, sumamos stock
    IF TG_OP = 'INSERT' THEN
        IF NEW.estado = 'Activo' THEN
            UPDATE Productos 
            SET stock = stock + NEW.cantidad 
            WHERE id_producto = NEW.id_producto;
        END IF;
    -- Si es una actualización (ej: anulación), ajustamos stock
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.estado = 'Activo' AND NEW.estado = 'Anulado' THEN
            UPDATE Productos 
            SET stock = stock - NEW.cantidad 
            WHERE id_producto = NEW.id_producto;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_entradas_productos_stock
AFTER INSERT OR UPDATE ON Entradas_Productos
FOR EACH ROW
EXECUTE FUNCTION fn_trg_entradas_productos_stock();
