const EmployeeModel = require('./employee.model');
const NotificationService = require('../notifications/notification.service');

class EmployeeController {
    static async getEmployees(req, res) {
        try {
            const data = await EmployeeModel.getAll();
            res.json({ success: true, data });
        } catch (error) { 
            res.status(500).json({ success: false, error: error.message }); 
        }
    }

    static async createEmployee(req, res) {
        try {
            const id = await EmployeeModel.create(req.body);
            await NotificationService.createNotification({
                modulo: 'Empleados',
                accion: 'creacion',
                descripcion: `Se registró al nuevo empleado/barbero "${req.body.primer_nombre} ${req.body.primer_apellido}" (ID Barbero: ${id}).`,
                req
            });
            res.status(201).json({ success: true, id_empleado: id });
        } catch (error) { 
            res.status(500).json({ success: false, error: error.message }); 
        }
    }

    static async updateEmployee(req, res) {
        try {
            await EmployeeModel.update(req.params.id, req.body);
            await NotificationService.createNotification({
                modulo: 'Empleados',
                accion: 'edicion',
                descripcion: `Se actualizó la información del empleado/barbero con ID ${req.params.id}.`,
                req
            });
            res.json({ success: true, message: 'Actualizado correctamente' });
        } catch (error) { 
            res.status(500).json({ success: false, error: error.message }); 
        }
    }

    static async toggleStatus(req, res) {
        try {
            const { estado } = req.body;
            await EmployeeModel.toggleStatus(req.params.id, estado);
            await NotificationService.createNotification({
                modulo: 'Empleados',
                accion: 'cambio_estado',
                descripcion: `Se cambió el estado del empleado/barbero con ID ${req.params.id} a "${estado}".`,
                req
            });
            res.json({ success: true, message: 'Estado actualizado' });
        } catch (error) { 
            res.status(500).json({ success: false, error: error.message }); 
        }
    }

    static async getSchedule(req, res) {
        try {
            const data = await EmployeeModel.getSchedule(req.params.id);
            if (!data) {
                return res.json({
                    success: true,
                    data: {
                        schedules: [
                            { dayId: 1, dayName: 'Lunes', activo: true, hora_inicio: '09:00', hora_fin: '21:00' },
                            { dayId: 2, dayName: 'Martes', activo: true, hora_inicio: '09:00', hora_fin: '21:00' },
                            { dayId: 3, dayName: 'Miércoles', activo: true, hora_inicio: '09:00', hora_fin: '21:00' },
                            { dayId: 4, dayName: 'Jueves', activo: true, hora_inicio: '09:00', hora_fin: '21:00' },
                            { dayId: 5, dayName: 'Viernes', activo: true, hora_inicio: '09:00', hora_fin: '21:00' },
                            { dayId: 6, dayName: 'Sábado', activo: true, hora_inicio: '08:00', hora_fin: '21:00' },
                            { dayId: 0, dayName: 'Domingo', activo: false, hora_inicio: '09:00', hora_fin: '14:00' }
                        ],
                        timeBlocks: [],
                        generalShift: { hora_inicio: '09:00', hora_fin: '21:00' }
                    }
                });
            }
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateSchedule(req, res) {
        try {
            await EmployeeModel.updateSchedule(req.params.id, req.body);
            await NotificationService.createNotification({
                modulo: 'Empleados',
                accion: 'edicion_horario',
                descripcion: `Se actualizó la disponibilidad y horarios del barbero con ID ${req.params.id}.`,
                req
            });
            res.json({ success: true, message: 'Disponibilidad y horarios guardados correctamente' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = EmployeeController;
