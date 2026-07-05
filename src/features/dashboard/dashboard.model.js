const db = require('../../config/db');

class DashboardModel {
    static async getAdminStats() {
        // 1. Estadísticas Generales (Matemáticas en BD)
        const statsRes = await db.query(`
            SELECT 
                COALESCE((SELECT SUM(total) FROM Ventas), 0)::numeric as totalVentas,
                COALESCE((SELECT SUM(e.cantidad * p.precio_neto) FROM Entradas_Productos e JOIN Productos p ON e.id_producto = p.id_producto WHERE e.estado = 'Activo'), 0)::numeric as totalCompras,
                (SELECT COUNT(*) FROM Productos)::int as totalProductos,
                COALESCE((SELECT SUM(stock) FROM Productos), 0)::int as stockTotal,
                (SELECT COUNT(*) FROM Clientes)::int as totalClientes,
                (SELECT COUNT(*) FROM Citas WHERE estado NOT IN ('completada', 'completado', 'cancelada', 'cancelado'))::int as citasPendientes,
                (SELECT COUNT(*) FROM Productos WHERE stock < 10)::int as stockBajo
        `);

        // 2. Listas de Resumen (LIMIT 5)
        const lowStockRes = await db.query(`
            SELECT id_producto, nombre, codigo, stock 
            FROM Productos WHERE stock < 10 ORDER BY stock ASC LIMIT 5
        `);

        const nextCitasRes = await db.query(`
            SELECT c.id_cita, c.fecha, c.hora_inicio, c.estado, 
                   COALESCE(u.nombre, cl.nombre_invitado, 'Cliente General') AS cliente_nombre
            FROM Citas c
            LEFT JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            LEFT JOIN Usuarios u ON cl.id_usuario = u.id_usuario
            WHERE c.estado NOT IN ('completada', 'completado', 'cancelada', 'cancelado')
            ORDER BY c.fecha ASC, c.hora_inicio ASC
            LIMIT 5
        `);

        const recentSalesRes = await db.query(`
            SELECT v.id_venta, v.fecha, v.total, v.metodo_pago, 
                   COALESCE(u.nombre, cl.nombre_invitado, 'Cliente General') AS cliente_nombre
            FROM Ventas v
            LEFT JOIN Clientes cl ON v.id_cliente = cl.id_cliente
            LEFT JOIN Usuarios u ON cl.id_usuario = u.id_usuario
            ORDER BY v.fecha DESC
            LIMIT 5
        `);

        return {
            stats: statsRes.rows[0],
            lowStock: lowStockRes.rows,
            nextCitas: nextCitasRes.rows,
            recentSales: recentSalesRes.rows
        };
    }

    static async getClientStats(id_usuario) {
        // Stats del Cliente
        const statsRes = await db.query(`
            WITH client_id AS (
                SELECT id_cliente FROM Clientes WHERE id_usuario = $1
            )
            SELECT 
                (SELECT COUNT(*) FROM Citas WHERE id_cliente = (SELECT id_cliente FROM client_id) AND estado NOT IN ('completada', 'completado', 'cancelada', 'cancelado'))::int as citasProgramadas,
                (SELECT COUNT(*) FROM Citas WHERE id_cliente = (SELECT id_cliente FROM client_id) AND estado IN ('completada', 'completado'))::int as historialTotal,
                (SELECT COUNT(*) FROM Servicios)::int as serviciosDisponibles
        `, [id_usuario]);

        // Próximas Citas del Cliente
        const nextCitasRes = await db.query(`
            WITH client_id AS (
                SELECT id_cliente FROM Clientes WHERE id_usuario = $1
            )
            SELECT c.id_cita, c.fecha, c.hora_inicio, c.estado, s.nombre as servicio_nombre
            FROM Citas c
            LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
            WHERE c.id_cliente = (SELECT id_cliente FROM client_id) AND c.estado NOT IN ('completada', 'completado', 'cancelada', 'cancelado')
            ORDER BY c.fecha ASC, c.hora_inicio ASC
            LIMIT 5
        `, [id_usuario]);

        // Servicios Recomendados (3 aleatorios)
        const recommendedRes = await db.query(`
            SELECT id_servicio, nombre, duracion_minutos, precio_neto 
            FROM Servicios ORDER BY RANDOM() LIMIT 3
        `);

        return {
            stats: statsRes.rows[0],
            nextCitas: nextCitasRes.rows,
            recommendedServices: recommendedRes.rows
        };
    }
}

module.exports = DashboardModel;