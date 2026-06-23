// const { sql, poolPromise } = require('../../config/db');

// class ReportsModel {
//     static async getSalesReport(periodo) {
//         const pool = await poolPromise;
//         let dateFilter = '';
        
//         // Filtro de tiempo dinámico
//         if (periodo === 'diario') dateFilter = "CAST(v.fecha AS DATE) = CAST(GETDATE() AS DATE)";
//         else if (periodo === 'semanal') dateFilter = "v.fecha >= DATEADD(day, -7, GETDATE())";
//         else if (periodo === 'mensual') dateFilter = "v.fecha >= DATEADD(day, -30, GETDATE())";
//         else if (periodo === 'anual') dateFilter = "v.fecha >= DATEADD(day, -365, GETDATE())";
//         else dateFilter = "1=1"; 

//         // 1. Tendencia (Gráfico de Líneas)
//         const lineRes = await pool.request().query(`
//             SELECT FORMAT(v.fecha, 'MMM dd') as name, SUM(v.total) as total 
//             FROM Ventas v WHERE ${dateFilter}
//             GROUP BY FORMAT(v.fecha, 'MMM dd'), CAST(v.fecha AS DATE)
//             ORDER BY CAST(v.fecha AS DATE) ASC
//         `);

//         // 2. Distribución (Gráfico Circular - Pie)
//         const pieRes = await pool.request().query(`
//             SELECT 
//                 CASE WHEN d.tipo = 'Servicio' THEN 'Servicios' ELSE 'Productos' END as name,
//                 SUM(d.subtotal_item) as value
//             FROM Ventas_Detalle d
//             JOIN Ventas v ON d.id_venta = v.id_venta
//             WHERE ${dateFilter}
//             GROUP BY d.tipo
//         `);

//         // 3. Top Servicios (Gráfico de Barras)
//         const barRes = await pool.request().query(`
//             SELECT TOP 5 s.nombre as name, SUM(d.cantidad) as cantidad 
//             FROM Ventas_Detalle d
//             JOIN Servicios s ON d.id_servicio = s.id_servicio
//             JOIN Ventas v ON d.id_venta = v.id_venta
//             WHERE d.tipo = 'Servicio' AND ${dateFilter}
//             GROUP BY s.nombre ORDER BY cantidad DESC
//         `);

//         // 4. Últimas Transacciones (Tabla)
//         const tableRes = await pool.request().query(`
//             SELECT TOP 5 v.id_venta, v.fecha, v.total, v.metodo_pago, 
//                    COALESCE(u.nombre, cl.nombre_invitado, 'Cliente General') AS cliente_nombre
//             FROM Ventas v
//             LEFT JOIN Clientes cl ON v.id_cliente = cl.id_cliente
//             LEFT JOIN Usuarios u ON cl.id_usuario = u.id_usuario
//             WHERE ${dateFilter}
//             ORDER BY v.fecha DESC
//         `);

//         return {
//             ventasPorDia: lineRes.recordset,
//             ventasPorCategoria: pieRes.recordset,
//             serviciosMasVendidos: barRes.recordset,
//             ultimasTransacciones: tableRes.recordset
//         };
//     }

//     static async getEmployeePerformance(periodo) {
//         const pool = await poolPromise;
//         let dateFilter = '';
        
//         // Filtro de tiempo dinámico
//         if (periodo === 'diario') dateFilter = "CAST(v.fecha AS DATE) = CAST(GETDATE() AS DATE)";
//         else if (periodo === 'semanal') dateFilter = "v.fecha >= DATEADD(day, -7, GETDATE())";
//         else if (periodo === 'mensual') dateFilter = "v.fecha >= DATEADD(day, -30, GETDATE())";
//         else if (periodo === 'anual') dateFilter = "v.fecha >= DATEADD(day, -365, GETDATE())";
//         else dateFilter = "1=1";

//         // 1. Obtener la lista de empleados (Barberos) con sus métricas básicas
//         const employeesRes = await pool.request().query(`
//             SELECT 
//                 u.id_usuario as id_empleado,
//                 u.nombre,
//                 'Barbero' as cargo,
//                 -- Ventas totales generadas por este empleado en el periodo
//                 ISNULL((SELECT SUM(total) FROM Ventas v WHERE v.id_vendedor = u.id_usuario AND ${dateFilter}), 0) as ventasGeneradas,
//                 -- Citas completadas por este empleado en el periodo
//                 (SELECT COUNT(*) FROM Citas c WHERE c.id_barbero = b.id_barbero AND c.estado = 'completado' AND ${dateFilter.replace(/v\./g, 'c.')}) as citasAtendidas,
//                 -- Simulación de métricas cualitativas (en una app real vendrían de una tabla de evaluaciones)
//                 95 as puntualidad,
//                 4.8 as calificacion
//             FROM Usuarios u
//             JOIN Barberos b ON u.id_usuario = b.id_usuario
//             WHERE u.id_rol = 2 -- 2 es el rol de Barbero
//         `);

//         // 2. Productividad Semanal (Gráfico de Barras agrupado por día para el empleado promedio vs grupo)
//         // Para simplificar y no sobrecargar la BD en esta versión, tomamos las ventas totales de la última semana por día
//         const productivityRes = await pool.request().query(`
//             SELECT 
//                 FORMAT(v.fecha, 'ddd') as name, -- Ej: 'Mon', 'Tue'
//                 SUM(v.total) as totalGrupo
//             FROM Ventas v
//             WHERE v.fecha >= DATEADD(day, -7, GETDATE())
//             GROUP BY FORMAT(v.fecha, 'ddd'), DATEPART(dw, v.fecha)
//             ORDER BY DATEPART(dw, v.fecha)
//         `);

//         return {
//             empleados: employeesRes.recordset,
//             productividadGlobal: productivityRes.recordset
//         };
//     }
// }
// module.exports = ReportsModel;

const { sql, poolPromise } = require('../../config/db');

class ReportsModel {
    // Helper para generar el filtro de fechas en SQL
    static getDateFilter(startDate, endDate, tableAlias = 'v') {
        if (!startDate || !endDate) return "1=1";
        return `CAST(${tableAlias}.fecha AS DATE) >= '${startDate}' AND CAST(${tableAlias}.fecha AS DATE) <= '${endDate}'`;
    }

    // 1. REPORTE DE CITAS
    static async getAppointmentsReport(startDate, endDate, id_barbero) {
        const pool = await poolPromise;
        const dateFilter = this.getDateFilter(startDate, endDate, 'c');
        const barberoFilter = (id_barbero && id_barbero !== 'Todos') ? `AND c.id_barbero = ${id_barbero}` : '';

        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as totalAgendadas,
                SUM(CASE WHEN estado IN ('completada', 'completado') THEN 1 ELSE 0 END) as totalCompletadas,
                SUM(CASE WHEN estado IN ('cancelada', 'cancelado') THEN 1 ELSE 0 END) as totalCanceladas,
                SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as totalPendientes
            FROM Citas c
            WHERE ${dateFilter} ${barberoFilter};

            SELECT estado, COUNT(*) as cantidad
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
        `);

        return {
            resumen: result.recordsets[0][0],
            porEstado: result.recordsets[1],
            detalle: result.recordsets[2]
        };
    }

    // 2. REPORTE DE PRODUCTOS
    static async getProductsReport(periodo, categoria) {
        const pool = await poolPromise;
        const catFilter = (categoria && categoria !== 'Todas') ? `AND cp.nombre = '${categoria}'` : '';

        const result = await pool.request().query(`
            SELECT 
                ISNULL(SUM(d.cantidad), 0) as unidadesVendidas,
                ISNULL(SUM(p.stock * p.precio_neto), 0) as valorInventario,
                ISNULL(SUM(p.stock), 0) as unidadesEnStock
            FROM Productos p
            LEFT JOIN Ventas_Detalle d ON p.id_producto = d.id_producto AND d.tipo = 'Producto'
            LEFT JOIN Categorias_Productos cp ON p.id_categoria = cp.id_categoria
            WHERE 1=1 ${catFilter};

            SELECT p.id_producto as id, p.nombre, ISNULL(cp.nombre, 'Sin categoría') as categoria, 
                   ISNULL(SUM(d.cantidad), 0) as vendidos, p.stock, p.precio_neto as precio,
                   CASE WHEN p.stock < 10 THEN 'Bajo Stock' ELSE 'Activo' END as estado
            FROM Productos p
            LEFT JOIN Ventas_Detalle d ON p.id_producto = d.id_producto AND d.tipo = 'Producto'
            LEFT JOIN Categorias_Productos cp ON p.id_categoria = cp.id_categoria
            WHERE 1=1 ${catFilter}
            GROUP BY p.id_producto, p.nombre, cp.nombre, p.stock, p.precio_neto
            ORDER BY vendidos DESC;
        `);

        return {
            resumen: result.recordsets[0][0],
            detalle: result.recordsets[1]
        };
    }

    // 3. REPORTE DE SERVICIOS
    static async getServicesReport(startDate, endDate, id_barbero) {
        const pool = await poolPromise;
        const dateFilter = this.getDateFilter(startDate, endDate, 'v');
        // Filtramos por el vendedor de la cabecera (Barbero)
        const barberoFilter = (id_barbero && id_barbero !== 'Todos') ? `AND v.id_vendedor = ${id_barbero}` : '';

        const result = await pool.request().query(`
            SELECT TOP 1 s.nombre as servicioEstrella, COUNT(d.id_detalle) as servicioEstrellaCant
            FROM Ventas_Detalle d
            JOIN Servicios s ON d.id_servicio = s.id_servicio
            JOIN Ventas v ON d.id_venta = v.id_venta
            WHERE d.tipo = 'Servicio' AND ${dateFilter} ${barberoFilter}
            GROUP BY s.nombre ORDER BY servicioEstrellaCant DESC;

            SELECT COUNT(*) as totalServicios
            FROM Ventas_Detalle d JOIN Ventas v ON d.id_venta = v.id_venta
            WHERE d.tipo = 'Servicio' AND ${dateFilter} ${barberoFilter};

            SELECT s.id_servicio as id, s.nombre as servicio, 
                   COUNT(d.id_detalle) as veces, 
                   ISNULL(SUM(d.subtotal_item),0) as ingresos,
                   ISNULL(AVG(d.precio_unitario_neto),0) as precioPromedio
            FROM Ventas_Detalle d
            JOIN Servicios s ON d.id_servicio = s.id_servicio
            JOIN Ventas v ON d.id_venta = v.id_venta
            WHERE d.tipo = 'Servicio' AND ${dateFilter} ${barberoFilter}
            GROUP BY s.id_servicio, s.nombre
            ORDER BY veces DESC;
        `);

        // Manejo por si no hay datos
        const resumen1 = result.recordsets[0].length > 0 ? result.recordsets[0][0] : { servicioEstrella: 'N/A', servicioEstrellaCant: 0 };
        const resumen2 = result.recordsets[1].length > 0 ? result.recordsets[1][0] : { totalServicios: 0 };

        return {
            resumen: { ...resumen1, ...resumen2 },
            ranking: result.recordsets[2]
        };
    }

    // 4. REPORTE DE EMPLEADOS
    static async getEmployeesReport(startDate, endDate, service) {
        const pool = await poolPromise;
        const dateFilterVentas = this.getDateFilter(startDate, endDate, 'v');
        const dateFilterCitas = this.getDateFilter(startDate, endDate, 'c');

        const result = await pool.request().query(`
            SELECT 
                u.id_usuario as id_empleado, u.nombre, 'Barbero' as cargo,
                ISNULL((SELECT COUNT(c.id_cita) FROM Citas c JOIN Barberos b2 ON c.id_barbero = b2.id_barbero WHERE b2.id_usuario = u.id_usuario AND c.estado IN ('completado', 'completada') AND ${dateFilterCitas}), 0) as citasAtendidas,
                ISNULL((SELECT SUM(v.total) FROM Ventas v WHERE v.id_vendedor = u.id_usuario AND ${dateFilterVentas}), 0) as ventasGeneradas,
                95 as puntualidad, 4.8 as calificacion
            FROM Usuarios u
            JOIN Barberos b ON u.id_usuario = b.id_usuario
            WHERE u.id_rol = 2
            ORDER BY ventasGeneradas DESC;

            SELECT 
                FORMAT(v.fecha, 'ddd') as name, 
                ISNULL(SUM(v.total), 0) as totalGrupo
            FROM Ventas v
            WHERE ${dateFilterVentas}
            GROUP BY FORMAT(v.fecha, 'ddd'), DATEPART(dw, v.fecha)
            ORDER BY DATEPART(dw, v.fecha);
        `);

        return { 
            empleados: result.recordsets[0],
            productividadGlobal: result.recordsets[1]
        };
    }

    static async getIncomeReport(startDate, endDate, category, barbero) {
        const pool = await poolPromise;
        const dateFilter = this.getDateFilter(startDate, endDate, 'v');

        const result = await pool.request().query(`
            SELECT 
                ISNULL((SELECT SUM(v2.total) FROM Ventas v2 WHERE ${this.getDateFilter(startDate, endDate, 'v2')}), 0) as ingresosTotales,
                ISNULL((SELECT SUM(d2.subtotal_item) FROM Ventas_Detalle d2 JOIN Ventas v3 ON d2.id_venta = v3.id_venta WHERE d2.tipo = 'Servicio' AND ${this.getDateFilter(startDate, endDate, 'v3')}), 0) as ingresosPorServicios,
                ISNULL((SELECT SUM(d3.subtotal_item) FROM Ventas_Detalle d3 JOIN Ventas v4 ON d3.id_venta = v4.id_venta WHERE d3.tipo = 'Producto' AND ${this.getDateFilter(startDate, endDate, 'v4')}), 0) as ingresosPorProductos;

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
        `);

        return {
            resumen: result.recordsets[0][0],
            detalle: result.recordsets[1]
        };
    }
}
module.exports = ReportsModel;