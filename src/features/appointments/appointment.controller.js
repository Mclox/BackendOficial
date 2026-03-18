const AppointmentModel = require('./appointment.model');

class AppointmentController {
    static async getAppointments(req, res) {
        try {
            const data = await AppointmentModel.getAll();
            res.json({ success: true, data });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async createAppointment(req, res) {
        try {
            const id = await AppointmentModel.create(req.body);
            res.status(201).json({ success: true, id_cita: id });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async updateAppointment(req, res) {
        try {
            const updated = await AppointmentModel.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ success: false, message: 'Cita no encontrada' });
            res.json({ success: true, message: 'Cita actualizada' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async updateAppointmentStatus(req, res) {
        try {
            const { estado } = req.body;
            await AppointmentModel.updateStatus(req.params.id, estado);
            res.json({ success: true, message: 'Estado actualizado' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async deleteAppointment(req, res) {
        try {
            const deleted = await AppointmentModel.delete(req.params.id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Cita no encontrada' });
            res.json({ success: true, message: 'Cita eliminada' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }
}
module.exports = AppointmentController;