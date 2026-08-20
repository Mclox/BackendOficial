const db = require('../../config/db');

class AppointmentModel {
    static async getAll() {
        const result = await db.query(`
            SELECT c.*, 
                   COALESCE(u_cli.nombre, cl.nombre_invitado) as cliente_nombre, 
                   u_cli.telefono as cliente_telefono,
                   u_cli.documento as cliente_documento,
                   u_bar.nombre as barbero_nombre, 
                   u_bar.telefono as barbero_telefono,
                   u_bar.documento as barbero_documento,
                   s.nombre as servicio_nombre,
                   s.precio_neto as servicio_precio
            FROM Citas c
            LEFT JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            LEFT JOIN Usuarios u_cli ON cl.id_usuario = u_cli.id_usuario
            LEFT JOIN Barberos b ON c.id_barbero = b.id_barbero
            LEFT JOIN Usuarios u_bar ON b.id_usuario = u_bar.id_usuario
            LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
            ORDER BY c.fecha DESC, c.hora_inicio DESC
        `);

        return result.rows.map(row => {
            let detalles = row.detalles_json;
            if (typeof detalles === 'string') {
                try { detalles = JSON.parse(detalles); } catch (e) { detalles = {}; }
            }
            if (!detalles || typeof detalles !== 'object') detalles = {};
            
            let serviciosArr = detalles.servicios || [];
            if (Array.isArray(serviciosArr)) {
                serviciosArr = serviciosArr.map(s => {
                    if (typeof s === 'number' || typeof s === 'string') {
                        return {
                            id_servicio: parseInt(s),
                            nombre: row.servicio_nombre || `Servicio #${s}`,
                            precio: parseFloat(row.servicio_precio || 0),
                            cantidad: 1
                        };
                    } else if (typeof s === 'object' && s !== null) {
                        return {
                            id_servicio: s.id_servicio || s.id || row.id_servicio,
                            nombre: s.nombre || row.servicio_nombre || `Servicio #${s.id_servicio || row.id_servicio}`,
                            precio: s.precio !== undefined ? parseFloat(s.precio) : parseFloat(row.servicio_precio || 0),
                            cantidad: s.cantidad || 1
                        };
                    }
                    return s;
                });
            } else if (row.id_servicio) {
                serviciosArr = [{
                    id_servicio: row.id_servicio,
                    nombre: row.servicio_nombre || 'Servicio',
                    precio: parseFloat(row.servicio_precio || 0),
                    cantidad: 1
                }];
            }

            detalles.servicios = serviciosArr;
            detalles.productos = detalles.productos || [];

            let totalEstimado = parseFloat(row.precio_total || 0);
            if (totalEstimado === 0 && serviciosArr.length > 0) {
                totalEstimado = serviciosArr.reduce((sum, item) => sum + ((item.precio || 0) * (item.cantidad || 1)), 0);
            }

            return {
                ...row,
                detalles_json: detalles,
                precio_total: totalEstimado,
                precio_neto: totalEstimado
            };
        });
    }

    static async create(data) {
        const { id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, detalles_json } = data;
        
        let cliId = id_cliente ? parseInt(id_cliente) : 1;
        let barbId = id_barbero ? parseInt(id_barbero) : 1;
        let servId = id_servicio ? parseInt(id_servicio) : 1;
        const horaStart = hora_inicio || '09:00';
        
        let horaEnd = hora_fin;
        if (!horaEnd) {
            const parts = horaStart.split(':');
            let h = parseInt(parts[0]) || 9;
            let m = (parseInt(parts[1]) || 0) + 30;
            if (m >= 60) { h += 1; m -= 60; }
            horaEnd = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        }

        // 1. Resolver id_cliente válido en la tabla Clientes
        try {
            const cRes = await db.query('SELECT id_cliente FROM Clientes WHERE id_cliente = $1', [cliId]);
            if (cRes.rows.length === 0) {
                const uRes = await db.query('SELECT id_cliente FROM Clientes WHERE id_usuario = $1', [cliId]);
                if (uRes.rows.length > 0) {
                    cliId = uRes.rows[0].id_cliente;
                } else {
                    const insRes = await db.query(
                        "INSERT INTO Clientes (id_usuario, nombre_invitado, fecha_registro) VALUES ($1, 'Cliente Registrado', CURRENT_DATE) RETURNING id_cliente",
                        [cliId]
                    );
                    if (insRes.rows.length > 0) {
                        cliId = insRes.rows[0].id_cliente;
                    } else {
                        const firstCli = await db.query('SELECT id_cliente FROM Clientes LIMIT 1');
                        if (firstCli.rows.length > 0) cliId = firstCli.rows[0].id_cliente;
                    }
                }
            }
        } catch (err) {
            console.error("Error resolviendo id_cliente en AppointmentModel.create:", err.message);
        }

        // 2. Resolver id_barbero válido en la tabla Barberos
        try {
            const bRes = await db.query('SELECT id_barbero FROM Barberos WHERE id_barbero = $1', [barbId]);
            if (bRes.rows.length === 0) {
                const uRes = await db.query('SELECT id_barbero FROM Barberos WHERE id_usuario = $1', [barbId]);
                if (uRes.rows.length > 0) {
                    barbId = uRes.rows[0].id_barbero;
                } else {
                    const firstBarb = await db.query('SELECT id_barbero FROM Barberos LIMIT 1');
                    if (firstBarb.rows.length > 0) barbId = firstBarb.rows[0].id_barbero;
                }
            }
        } catch (err) {
            console.error("Error resolviendo id_barbero en AppointmentModel.create:", err.message);
        }

        // 3. Resolver id_servicio válido en la tabla Servicios
        try {
            const sCheck = await db.query('SELECT id_servicio FROM Servicios WHERE id_servicio = $1', [servId]);
            if (sCheck.rows.length === 0) {
                const firstServ = await db.query('SELECT id_servicio FROM Servicios LIMIT 1');
                if (firstServ.rows.length > 0) servId = firstServ.rows[0].id_servicio;
            }
        } catch (err) {
            console.error("Error resolviendo id_servicio en AppointmentModel.create:", err.message);
        }

        let serviceInfo = null;
        if (servId) {
            try {
                const sRes = await db.query('SELECT nombre, precio_neto FROM Servicios WHERE id_servicio = $1', [servId]);
                if (sRes.rows.length > 0) serviceInfo = sRes.rows[0];
            } catch (e) {
                console.error("Error fetching service details for appointment create:", e);
            }
        }

        let finalDetalles = detalles_json || {};
        if (typeof finalDetalles === 'string') {
            try { finalDetalles = JSON.parse(finalDetalles); } catch (e) { finalDetalles = {}; }
        }
        
        let serviciosArr = finalDetalles.servicios || [];
        if (serviciosArr.length === 0 && servId) {
            serviciosArr = [{
                id_servicio: servId,
                nombre: serviceInfo ? serviceInfo.nombre : `Servicio #${servId}`,
                precio: serviceInfo ? parseFloat(serviceInfo.precio_neto) : 0,
                cantidad: 1
            }];
        } else {
            serviciosArr = serviciosArr.map(s => {
                if (typeof s === 'number' || typeof s === 'string') {
                    return {
                        id_servicio: parseInt(s),
                        nombre: serviceInfo ? serviceInfo.nombre : `Servicio #${s}`,
                        precio: serviceInfo ? parseFloat(serviceInfo.precio_neto) : 0,
                        cantidad: 1
                    };
                } else if (typeof s === 'object' && s !== null) {
                    return {
                        id_servicio: s.id_servicio || servId,
                        nombre: s.nombre || (serviceInfo ? serviceInfo.nombre : 'Servicio'),
                        precio: s.precio !== undefined ? parseFloat(s.precio) : (serviceInfo ? parseFloat(serviceInfo.precio_neto) : 0),
                        cantidad: s.cantidad || 1
                    };
                }
                return s;
            });
        }
        finalDetalles.servicios = serviciosArr;
        finalDetalles.productos = finalDetalles.productos || [];

        const precioTotal = serviciosArr.reduce((sum, item) => sum + ((item.precio || 0) * (item.cantidad || 1)), 0);
        const detallesStr = JSON.stringify(finalDetalles);

        const query = `
            INSERT INTO Citas (id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, estado, detalles_json, precio_total)
            VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', $7, $8)
            RETURNING id_cita
        `;
        
        const values = [cliId, barbId, servId, fecha || new Date().toISOString().split('T')[0], horaStart, horaEnd, detallesStr, precioTotal];
        const result = await db.query(query, values);
        return result.rows[0].id_cita;
    }

    static async update(id, data) {
        const { id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, detalles_json, estado } = data;
        const detallesStr = typeof detalles_json === 'object' ? JSON.stringify(detalles_json) : detalles_json;

        let query = `
            UPDATE Citas 
            SET id_cliente = $1, id_barbero = $2, id_servicio = $3, 
                fecha = $4, hora_inicio = $5, hora_fin = $6, detalles_json = $7
        `;
        
        const values = [id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, detallesStr || null];

        if (estado) {
            values.push(estado);
            query += `, estado = $${values.length}`;
        }

        values.push(id);
        query += ` WHERE id_cita = $${values.length}`;

        const result = await db.query(query, values);
        return result.rowCount > 0;
    }

    static async updateStatus(id, estado) {
        const result = await db.query('UPDATE Citas SET estado = $1 WHERE id_cita = $2', [estado, id]);
        return result.rowCount > 0;
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM Citas WHERE id_cita = $1', [id]);
        return result.rowCount > 0;
    }
}

module.exports = AppointmentModel;