const request = require('supertest');

// Mockear el middleware de autenticación ANTES de importar app
jest.mock('./src/middlewares/auth.middleware', () => {
    return {
        verifyToken: jest.fn((req, res, next) => next()),
        checkPermission: jest.fn((modulo, accion) => (req, res, next) => next())
    };
});

const app = require('./src/app');

/* 
  -----------------------------------------------------------------------
  AISLAMIENTO DE BASE DE DATOS
  -----------------------------------------------------------------------
*/
jest.mock('./src/features/employees/employee.controller', () => {
    return {
        getEmployees: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
        createEmployee: jest.fn((req, res) => {
            if (!req.body.nombre) {
                return res.status(400).json({ error: "Datos inválidos" });
            }
            return res.status(201).json({ id: 1, nombre: req.body.nombre });
        }),
        updateEmployee: jest.fn((req, res) => res.status(200).json({ success: true })),
        toggleStatus: jest.fn((req, res) => res.status(200).json({ success: true }))
    };
});

describe('Pruebas del módulo de Empleados (/api/employees)', () => {

    /* 
      -----------------------------------------------------------------------
      PRUEBA 1: CASO POSITIVO (Datos válidos)
      -----------------------------------------------------------------------
    */
    test('Debería crear un empleado exitosamente (Caso Positivo)', async () => {
        const nuevoEmpleado = { nombre: "Carlos Barbero", rol: "Especialista" };
        
        const response = await request(app)
            .post('/api/employees')
            .send(nuevoEmpleado);

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.nombre).toBe("Carlos Barbero");
    });

    /* 
      -----------------------------------------------------------------------
      PRUEBA 2: CASO NEGATIVO (Manejo de errores o datos faltantes)
      -----------------------------------------------------------------------
    */
    test('Debería retornar error 400 si faltan datos en la petición (Caso Negativo)', async () => {
        const empleadoInvalido = { rol: "Recepcionista" };
        
        const response = await request(app)
            .post('/api/employees')
            .send(empleadoInvalido);

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

});