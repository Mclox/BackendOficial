const express = require('express');
const router = express.Router();
const AppointmentController = require('./appointment.controller');
const { verifyToken, checkPermission } = require('../../middlewares/auth.middleware');

// Endpoints públicos para el agendamiento desde la landing page (sin token)
router.get('/public-busy-slots', AppointmentController.getPublicBusySlots);
router.post('/public-booking', AppointmentController.createPublicBooking);

router.get('/', verifyToken, checkPermission('Citas', 'leer'), AppointmentController.getAppointments);
router.post('/', verifyToken, checkPermission('Citas', 'crear'), AppointmentController.createAppointment);
router.put('/:id', verifyToken, checkPermission('Citas', 'actualizar'), AppointmentController.updateAppointment); // Edición completa
router.put('/:id/status', verifyToken, checkPermission('Citas', 'actualizar'), AppointmentController.updateAppointmentStatus); // Solo cambiar estado
router.delete('/:id', verifyToken, checkPermission('Citas', 'eliminar'), AppointmentController.deleteAppointment); // Eliminar

module.exports = router;