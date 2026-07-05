const db = require('../../config/db');

class ReportsModel {
    // Helper para generar el filtro de fechas en SQL
    static getDateFilter(startDate, endDate, tableAlias = 'v') {
        if (!startDate || !endDate) return "1=1";
        return `CAST(${tableAlias}.fecha AS DATE) >= '${startDate}' AND CAST(${tableAlias}.fecha AS DATE) <= '${endDate}'`;
    }

    // 1. REPORTE DE CITAS
    static async getAppointmentsReport(startDate, endDate, id_barbero) {
        const dateFilter = this.getDateFilter(startDate, endDate, 'c');
        const barberoFilter = (id_barbero && id_barbero !== 'Todos') ? `AND c.id_barbero = ${id_barbero}` : '';

        const query = `
            SELECT 
                COUNT(*) as totalAgendadas,
                SUM(CASE WHEN estado IN ('completada', 'completado') THEN 1 ELSE 0 END)::int as totalCompletadas,
                SUM(CASE WHEN estado IN ('cancelada', 'cancelado') THEN 1 ELSE 0 END)::int as totalCanceladas,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END)::int as totalPendientes
            FROM Citas c
            WHERE ${dateFilter} ${barberoFilter};

            SELECT estado, COUNT(*)::int as cantidad
            FROM Citas c
            WHERE ${dateFilter} ${barberoFilter}
            GROUP BY estado;

            SELECT c.id_cita as id, c.fecha, c.hora_inicio as hora, 
                   COALESCE(u_cli.nombre, cl.nombre_invitado, 'Cliente General') as cliente,
                   u_barb.nombre as barbero,
                   s.nombre as servicio,
                   c.estado, s.precio_neto as precio
            FROM Citas c
            LEFT JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            LEFT JOIN Usuarios u_cli ON cl.id_usuario = u_cli.id_usuario
            LEFT JOIN Barberos b ON c.id_barbero = b.id_barbero
            LEFT JOIN Usuarios u_barb ON b.id_usuario = u_barb.id_usuario
            LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
            WHERE ${dateFilter} ${barberoFilter}
            ORDER BY c.fecha DESC, c.hora_inicio DESC;
        `;

        const result = await db.query(query);

        return {
            resumen: result[0].rows[0],
            porEstado: result[1].rows,
            detalle: result[2].rows
        };
    }

    // 2. REPORTE DE PRODUCTOS
    static async getProductsReport(periodo, categoria) {
        const catFilter = (categoria && categoria !== 'Todas') ? `AND cp.nombre = '${categoria}'` : '';

        const query = `
            SELECT 
                COALESCE(SUM(d.cantidad), 0)::int as unidadesVendidas,
                COALESCE(SUM(p.stock * p.precio_neto), 0)::numeric as valorInventario,
                COALESCE(SUM(p.stock), 0)::int as unidadesEnStock
            FROM Productos p
            LEFT JOIN Ventas_Detalle d ON p.id_producto = d.id_producto AND d.tipo = 'Producto'
            LEFT JOIN Categorias_Productos cp ON p.id_categoria = cp.id_categoria
            WHERE 1=1 ${catFilter};

            SELECT p.id_producto as id, p.nombre, COALESCE(cp.nombre, 'Sin categoría') as categoria, 
                   COALESCE(SUM(d.cantidad), 0)::int as vendidos, p.stock, p.precio_neto as precio,
                   CASE WHEN p.stock < 10 THEN 'Bajo Stock' ELSE 'Activo' END as estado
            FROM Productos p
            LEFT JOIN Ventas_Detalle d ON p.id_producto = d.id_producto AND d.tipo = 'Producto'
            LEFT JOIN Categorias_Productos cp ON p.id_categoria = cp.id_categoria
            WHERE 1=1 ${catFilter}
            GROUP BY p.id_producto, p.nombre, cp.nombre, p.stock, p.precio_neto
            ORDER BY vendidos DESC;
        `;

        const result = await db.query(query);

        return {
            resumen: result[0].rows[0],
            detalle: result[1].rows
        };
    }

    // 3. REPORTE DE SERVICIOS
    static async getServicesReport(startDate, endDate, id_barbero) {
        const dateFilter = this.getDateFilter(startDate, endDate, 'v');
        const barberoFilter = (id_barbero && id_barbero !== 'Todos') ? `AND v.id_vendedor = ${id_barbero}` : '';

        const query = `
            SELECT s.nombre as servicioEstrella, COUNT(d.id_detalle)::int as servicioEstrellaCant
            FROM Ventas_Detalle d
            JOIN Servicios s ON d.id_servicio = s.id_servicio
            JOIN Ventas v ON d.id_venta = v.id_venta
            WHERE d.tipo = 'Servicio' AND ${dateFilter} ${barberoFilter}
            GROUP BY s.nombre ORDER BY servicioEstrellaCant DESC LIMIT 1;

            SELECT COUNT(*)::int as totalServicios
            FROM Ventas_Detalle d JOIN Ventas v ON d.id_venta = v.id_venta
            WHERE d.tipo = 'Servicio' AND ${dateFilter} ${barberoFilter};

            SELECT s.id_servicio as id, s.nombre as servicio, 
                   COUNT(d.id_detalle)::int as veces, 
                   COALESCE(SUM(d.subtotal_item),0)::numeric as ingresos,
                   COALESCE(AVG(d.precio_unitario_neto),0)::numeric as precioPromedio
            FROM Ventas_Detalle d
            JOIN Servicios s ON d.id_servicio = s.id_servicio
            JOIN Ventas v ON d.id_venta = v.id_venta
            WHERE d.tipo = 'Servicio' AND ${dateFilter} ${barberoFilter}
            GROUP BY s.id_servicio, s.nombre
            ORDER BY veces DESC;
        `;

        const result = await db.query(query);

        const resumen1 = result[0].rows.length > 0 ? result[0].rows[0] : { servicioEstrella: 'N/A', servicioEstrellaCant: 0 };
        const resumen2 = result[1].rows.length > 0 ? result[1].rows[0] : { totalServicios: 0 };

        return {
            resumen: { ...resumen1, ...resumen2 },
            ranking: result[2].rows
        };
    }

    // 4. REPORTE DE EMPLEADOS
    static async getEmployeesReport(startDate, endDate, service) {
        const dateFilterVentas = this.getDateFilter(startDate, endDate, 'v');
        const dateFilterCitas = this.getDateFilter(startDate, endDate, 'c');

        const query = `
            SELECT 
                u.id_usuario as id_empleado, u.nombre, 'Barbero' as cargo,
                COALESCE((SELECT COUNT(c.id_cita) FROM Citas c JOIN Barberos b2 ON c.id_barbero = b2.id_barbero WHERE b2.id_usuario = u.id_usuario AND c.estado IN ('completado', 'completada') AND ${dateFilterCitas}), 0)::int as citasAtendidas,
                COALESCE((SELECT SUM(v.total) FROM Ventas v WHERE v.id_vendedor = u.id_usuario AND ${dateFilterVentas}), 0)::numeric as ventasGeneradas,
                95 as puntualidad, 4.8 as calificacion
            FROM Usuarios u
            JOIN Barberos b ON u.id_usuario = b.id_usuario
            WHERE u.id_rol = 2
            ORDER BY ventasGeneradas DESC;

            SELECT 
                to_char(v.fecha, 'Dy') as name, 
                COALESCE(SUM(v.total), 0)::numeric as totalGrupo
            FROM Ventas v
            WHERE ${dateFilterVentas}
            GROUP BY to_char(v.fecha, 'Dy'), EXTRACT(ISODOW FROM v.fecha)
            ORDER BY EXTRACT(ISODOW FROM v.fecha);
        `;

        const result = await db.query(query);

        return { 
            empleados: result[0].rows,
            productividadGlobal: result[1].rows
        };
    }

    static async getIncomeReport(startDate, endDate, category, barbero) {
        const dateFilter = this.getDateFilter(startDate, endDate, 'v');

        const query = `
            SELECT 
                COALESCE((SELECT SUM(v2.total) FROM Ventas v2 WHERE ${this.getDateFilter(startDate, endDate, 'v2')}), 0)::numeric as ingresosTotales,
                COALESCE((SELECT SUM(d2.subtotal_item) FROM Ventas_Detalle d2 JOIN Ventas v3 ON d2.id_venta = v3.id_venta WHERE d2.tipo = 'Servicio' AND ${this.getDateFilter(startDate, endDate, 'v3')}), 0)::numeric as ingresosPorServicios,
                COALESCE((SELECT SUM(d3.subtotal_item) FROM Ventas_Detalle d3 JOIN Ventas v4 ON d3.id_venta = v4.id_venta WHERE d3.tipo = 'Producto' AND ${this.getDateFilter(startDate, endDate, 'v4')}), 0)::numeric as ingresosPorProductos;

            SELECT v.id_venta as id, v.fecha, 
                   COALESCE(p.nombre, s.nombre, 'Varios') as concepto,
                   d.tipo, u.nombre as barbero, d.subtotal_item as monto,
                   v.metodo_pago
            FROM Ventas_Detalle d
            JOIN Ventas v ON d.id_venta = v.id_venta
            LEFT JOIN Productos p ON d.id_producto = p.id_producto
            LEFT JOIN Servicios s ON d.id_servicio = s.id_servicio
            LEFT JOIN Usuarios u ON v.id_vendedor = u.id_usuario
            WHERE ${dateFilter}
            ORDER BY v.fecha DESC;
        `;

        const result = await db.query(query);

        return {
            resumen: result[0].rows[0],
            detalle: result[1].rows
        };
    }
}

module.exports = ReportsModel;