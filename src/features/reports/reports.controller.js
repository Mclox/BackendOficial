const ReportsModel = require('./reports.model');

class ReportsController {
    // 1. Reporte de Citas
    static async getAppointments(req, res) {
        try {
            const { start, end, barbero } = req.query;
            const data = await ReportsModel.getAppointmentsReport(start, end, barbero);
            res.json({ success: true, data });
        } catch (error) { 
            res.status(500).json({ success: false, error: error.message }); 
        }
    }

    // 2. Reporte de Productos
    static async getProducts(req, res) {
        try {
            const { period, category } = req.query;
            const data = await ReportsModel.getProductsReport(period, category);
            res.json({ success: true, data });
        } catch (error) { 
            res.status(500).json({ success: false, error: error.message }); 
        }
    }

    // 3. Reporte de Servicios
    static async getServices(req, res) {
        try {
            const { start, end, barbero } = req.query;
            const data = await ReportsModel.getServicesReport(start, end, barbero);
            res.json({ success: true, data });
        } catch (error) { 
            res.status(500).json({ success: false, error: error.message }); 
        }
    }

    // 4. Reporte de Empleados
    static async getEmployees(req, res) {
        try {
            const { start, end, service } = req.query;
            const data = await ReportsModel.getEmployeesReport(start, end, service);
            res.json({ success: true, data });
        } catch (error) { 
            res.status(500).json({ success: false, error: error.message }); 
        }
    }

    // 5. Reporte de Ingresos
    static async getIncome(req, res) {
        try {
            const { start, end, category, barbero } = req.query;
            const data = await ReportsModel.getIncomeReport(start, end, category, barbero);
            res.json({ success: true, data });
        } catch (error) { 
            res.status(500).json({ success: false, error: error.message }); 
        }
    }
}

module.exports = ReportsController;