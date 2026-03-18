const express = require('express');
const router = express.Router();
const AppointmentController = require('./appointment.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, AppointmentController.getAppointments);
router.post('/', verifyToken, AppointmentController.createAppointment);
router.put('/:id', verifyToken, AppointmentController.updateAppointment); // Edición completa
router.put('/:id/status', verifyToken, AppointmentController.updateAppointmentStatus); // Solo cambiar estado
router.delete('/:id', verifyToken, AppointmentController.deleteAppointment); // Eliminar

module.exports = router;