const express = require('express');
const cors = require('cors');

const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
// Redireccionar solicitudes de imágenes de productos a Supabase Storage
app.get('/uploads/products/:filename', (req, res) => {
    const filename = req.params.filename;
    const publicUrl = `https://efbxbulijhskaohvlwys.supabase.co/storage/v1/object/public/products/${filename}`;
    return res.redirect(302, publicUrl);
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
    res.send('API de BarberSite V2 funcionando correctamente 💈');
});

// --- MÓDULOS DEL BACKEND HABILITADOS Y OPERATIVOS EN POSTGRES ---
app.use('/api/auth', require('./features/auth/auth.routes'));
app.use('/api/users', require('./features/users/user.routes'));
app.use('/api/roles', require('./features/roles/role.routes'));
app.use('/api/notifications', require('./features/notifications/notification.routes'));
app.use('/api/clients', require('./features/clients/client.routes'));
app.use('/api/products', require('./features/products/product.routes'));
app.use('/api/services', require('./features/services/service.routes'));
app.use('/api/employees', require('./features/employees/employee.routes'));
app.use('/api/appointments', require('./features/appointments/appointment.routes'));
app.use('/api/sales', require('./features/sales/sale.routes'));
app.use('/api/landing-config', require('./features/landing-config/landing.routes'));
app.use('/api/product-entries', require('./features/product-entries/product-entries.routes'));
app.use('/api/dashboard', require('./features/dashboard/dashboard.routes'));
app.use('/api/reports', require('./features/reports/reports.routes'));
app.use('/api/purchases', require('./features/purchases/purchase.routes'));
app.use('/api/suppliers', require('./features/suppliers/supplier.routes'));
app.use('/api/supplier-returns', require('./features/supplier-returns/supp-return.routes'));
app.use('/api/stock-returns', require('./features/stock-returns/stock-return.routes'));

module.exports = app;