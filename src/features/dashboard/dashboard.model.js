const { sql, poolPromise } = require('../../config/db');

class DashboardModel {
    static async getAdminStats() {
        const pool = await poolPromise;
        
        // 1. Estadísticas Generales (Matemáticas en BD)
        const statsRes = await pool.request().query(`
            SELECT 
                ISNULL((SELECT SUM(total) FROM Ventas), 0) as totalVentas,
                ISNULL((SELECT SUM(e.cantidad * p.precio_neto) FROM Entradas_Productos e JOIN Productos p ON e.id_producto = p.id_producto WHERE e.estado = 'Activo'), 0) as totalCompras,
                (SELECT COUNT(*) FROM Productos) as totalProductos,
                ISNULL((SELECT SUM(stock) FROM Productos), 0) as stockTotal,
                (SELECT COUNT(*) FROM Clientes) as totalClientes,
                (SELECT COUNT(*) FROM Citas WHERE estado NOT IN ('completado', 'cancelado')) as citasPendientes,
                (SELECT COUNT(*) FROM Productos WHERE stock < 10) as stockBajo
        `);

        // 2. Listas de Resumen (TOP 5)
        const lowStockRes = await pool.request().query(`
            SELECT TOP 5 id_producto, nombre, codigo, stock 
            FROM Productos WHERE stock < 10 ORDER BY stock ASC
        `);

        const nextCitasRes = await pool.request().query(`
            SELECT TOP 5 c.id_cita, c.fecha, c.hora_inicio, c.estado, 
                   COALESCE(u.nombre, cl.nombre_invitado, 'Cliente General') AS cliente_nombre
            FROM Citas c
            LEFT JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            LEFT JOIN Usuarios u ON cl.id_usuario = u.id_usuario
            WHERE c.estado NOT IN ('completado', 'cancelado')
            ORDER BY c.fecha ASC, c.hora_inicio ASC
        `);

        const recentSalesRes = await pool.request().query(`
            SELECT TOP 5 v.id_venta, v.fecha, v.total, v.metodo_pago, 
                   COALESCE(u.nombre, cl.nombre_invitado, 'Cliente General') AS cliente_nombre
            FROM Ventas v
            LEFT JOIN Clientes cl ON v.id_cliente = cl.id_cliente
            LEFT JOIN Usuarios u ON cl.id_usuario = u.id_usuario
            ORDER BY v.fecha DESC
        `);

        return {
            stats: statsRes.recordset[0],
            lowStock: lowStockRes.recordset,
            nextCitas: nextCitasRes.recordset,
            recentSales: recentSalesRes.recordset
        };
    }

    static async getClientStats(id_usuario) {
        const pool = await poolPromise;
        
        // Stats del Cliente
        const statsRes = await pool.request()
            .input('id_u', sql.Int, id_usuario)
            .query(`
                DECLARE @id_cli INT = (SELECT id_cliente FROM Clientes WHERE id_usuario = @id_u);
                
                SELECT 
                    (SELECT COUNT(*) FROM Citas WHERE id_cliente = @id_cli AND estado NOT IN ('completado', 'cancelado')) as citasProgramadas,
                    (SELECT COUNT(*) FROM Citas WHERE id_cliente = @id_cli AND estado = 'completado') as historialTotal,
                    (SELECT COUNT(*) FROM Servicios) as serviciosDisponibles
            `);

        // Próximas Citas del Cliente
        const nextCitasRes = await pool.request()
            .input('id_u', sql.Int, id_usuario)
            .query(`
                DECLARE @id_cli INT = (SELECT id_cliente FROM Clientes WHERE id_usuario = @id_u);
                SELECT TOP 5 c.id_cita, c.fecha, c.hora_inicio, c.estado, s.nombre as servicio_nombre
                FROM Citas c
                LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
                WHERE c.id_cliente = @id_cli AND c.estado NOT IN ('completado', 'cancelado')
                ORDER BY c.fecha ASC, c.hora_inicio ASC
            `);

        // Servicios Recomendados (3 aleatorios)
        const recommendedRes = await pool.request().query(`
            SELECT TOP 3 id_servicio, nombre, duracion_minutos, precio_neto 
            FROM Servicios ORDER BY NEWID()
        `);

        return {
            stats: statsRes.recordset[0],
            nextCitas: nextCitasRes.recordset,
            recommendedServices: recommendedRes.recordset
        };
    }
}
module.exports = DashboardModel;