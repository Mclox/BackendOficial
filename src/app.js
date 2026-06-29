const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('API de BarberSite V2 funcionando correctamente 💈');
});

// --- MÓDULOS DE SEGURIDAD Y ACCESO ---
app.use('/api/auth', require('./features/auth/auth.routes'));
app.use('/api/users', require('./features/users/user.routes'));
app.use('/api/roles', require('./features/roles/role.routes'));

// --- CRUD TABLAS MAESTRAS ---
app.use('/api/clients', require('./features/clients/client.routes'));
app.use('/api/products', require('./features/products/product.routes'));
app.use('/api/services', require('./features/services/service.routes'));
app.use('/api/employees', require('./features/employees/employee.routes'));

// --- MÓDULOS TRANSACCIONALES Y DE NEGOCIO ---
app.use('/api/appointments', require('./features/appointments/appointment.routes'));
app.use('/api/sales', require('./features/sales/sale.routes'));
app.use('/api/landing-config', require('./features/landing-config/landing.routes'));
app.use('/api/product-entries', require('./features/product-entries/product-entries.routes'));
app.use('/api/dashboard', require('./features/dashboard/dashboard.routes'));
app.use('/api/reports', require('./features/reports/reports.routes'));
app.use('/api/notifications', require('./features/notifications/notification.routes'));

// --- MÓDULOS DESHABILITADOS ---
app.use('/api/stock-returns', require('./features/stock-returns/stock-return.routes'));

module.exports = app;