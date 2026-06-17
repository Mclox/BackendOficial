const DashboardModel = require('./dashboard.model');

class DashboardController {
    static async getDashboardData(req, res) {
        try {
            const { id: id_usuario, rol } = req.user;
            let data;

            if (rol === 'Cliente') {
                data = await DashboardModel.getClientStats(id_usuario);
            } else {
                // Admin o Barbero ven el panel general
                data = await DashboardModel.getAdminStats();
            }

            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
module.exports = DashboardController;