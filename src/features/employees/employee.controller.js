const EmployeeModel = require('./employee.model');

class EmployeeController {
    static async getEmployees(req, res) {
        try {
            const data = await EmployeeModel.getAll();
            res.json({ success: true, data });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async createEmployee(req, res) {
        try {
            const id = await EmployeeModel.create(req.body);
            res.status(201).json({ success: true, id_empleado: id });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async updateEmployee(req, res) {
        try {
            await EmployeeModel.update(req.params.id, req.body);
            res.json({ success: true, message: 'Actualizado correctamente' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async toggleStatus(req, res) {
        try {
            const { estado } = req.body;
            await EmployeeModel.toggleStatus(req.params.id, estado);
            res.json({ success: true, message: 'Estado actualizado' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }
}
module.exports = EmployeeController;