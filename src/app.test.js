const request = require('supertest');
const app = require('./app'); // Aquí sí tiene sentido importar el 'app' de arriba

describe('Pruebas de la API BarberSite V2', () => {

    // PRUEBA 1: Ruta Base
    test('Debería responder correctamente en la ruta raíz (GET /)', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('API de BarberSite V2 funcionando correctamente 💈');
    });

    // PRUEBA 2: Módulo de Empleados
    describe('Módulo de Empleados (/api/employees)', () => {
        test('Debería retornar un error 404 para una ruta de empleado inexistente', async () => {
            const response = await request(app).get('/api/employees/ruta-falsa-que-no-existe');
            expect(response.statusCode).toBe(404);
        });
    });
});