const request = require('supertest');
const app = require('./app'); // Importa tu app.js de BarberSite

/* 
  -----------------------------------------------------------------------
  AISLAMIENTO DE BASE DE DATOS (Equivalente a 'Moq' en tus fuentes)
  -----------------------------------------------------------------------
  Aquí simulamos el controlador o modelo para no tocar datos reales.
  (Ajusta la ruta './features/employees/employee.controller' a la ruta real de tu lógica)
*/
jest.mock('./features/employees/employee.controller', () => {
    return {
        crearEmpleado: jest.fn((req, res) => {
            if (!req.body.nombre) {
                return res.status(400).json({ error: "Datos inválidos" });
            }
            return res.status(201).json({ id: 1, nombre: req.body.nombre });
        })
    };
});

describe('Pruebas del módulo de Empleados (/api/employees)', () => {

    /* 
      -----------------------------------------------------------------------
      PRUEBA 1: CASO POSITIVO (Datos válidos)
      -----------------------------------------------------------------------
    */
    test('Debería crear un empleado exitosamente (Caso Positivo)', async () => {
        // 1. Arrange (Preparar): Definimos los datos válidos a enviar
        const nuevoEmpleado = { nombre: "Carlos Barbero", rol: "Especialista" };
        
        // 2. Act (Actuar): Simulamos la petición POST a tu ruta
        const response = await request(app)
            .post('/api/employees')
            .send(nuevoEmpleado);

        // 3. Assert (Afirmar): Verificamos que el estado sea 201 (Creado)
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
        // 1. Arrange (Preparar): Definimos un objeto con datos incompletos
        const empleadoInvalido = { rol: "Recepcionista" }; // Falta el nombre
        
        // 2. Act (Actuar): Enviamos los datos inválidos
        const response = await request(app)
            .post('/api/employees')
            .send(empleadoInvalido);

        // 3. Assert (Afirmar): Confirmamos que el backend responde con un error 400
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

});