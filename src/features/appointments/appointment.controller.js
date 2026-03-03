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

    static async updateAppointmentStatus(req, res) {
        try {
            const { estado } = req.body;
            await AppointmentModel.updateStatus(req.params.id, estado);
            res.json({ success: true, message: 'Estado actualizado' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }
}
module.exports = AppointmentController;