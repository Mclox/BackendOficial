const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("❌ Error: No DATABASE_URL found in .env");
        process.exit(1);
    }

    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("📡 Conectado a Render PostgreSQL para el sembrado completo...");

        // 1. Insertar Roles por defecto si no existen
        const rolesCheck = await client.query("SELECT COUNT(*) FROM Roles");
        if (parseInt(rolesCheck.rows[0].count) === 0) {
            console.log("🌱 Insertando roles por defecto...");
            
            const adminPermissions = JSON.stringify([
                { modulo: "Usuarios", crear: true, leer: true, actualizar: true, eliminar: true },
                { modulo: "Roles", crear: true, leer: true, actualizar: true, eliminar: true },
                { modulo: "Productos", crear: true, leer: true, actualizar: true, eliminar: true },
                { modulo: "Servicios", crear: true, leer: true, actualizar: true, eliminar: true },
                { modulo: "Empleados", crear: true, leer: true, actualizar: true, eliminar: true },
                { modulo: "Citas", crear: true, leer: true, actualizar: true, eliminar: true },
                { modulo: "Ventas", crear: true, leer: true, actualizar: true, eliminar: true }
            ]);

            const barberoPermissions = JSON.stringify([
                { modulo: "Usuarios", crear: false, leer: true, actualizar: false, eliminar: false },
                { modulo: "Roles", crear: false, leer: true, actualizar: false, eliminar: false },
                { modulo: "Productos", crear: false, leer: true, actualizar: false, eliminar: false },
                { modulo: "Servicios", crear: false, leer: true, actualizar: false, eliminar: false },
                { modulo: "Empleados", crear: false, leer: true, actualizar: false, eliminar: false },
                { modulo: "Citas", crear: true, leer: true, actualizar: true, eliminar: false },
                { modulo: "Ventas", crear: true, leer: true, actualizar: false, eliminar: false },
                { modulo: "Clientes", crear: true, leer: true, actualizar: false, eliminar: false }
            ]);

            const clientePermissions = JSON.stringify([
                { modulo: "Citas", crear: true, leer: true, actualizar: true, eliminar: true }
            ]);

            await client.query(`
                INSERT INTO Roles (id_rol, nombre, descripcion, estado, permisos) VALUES
                (1, 'Administrador', 'Acceso total al sistema', 'Activo', $1),
                (2, 'Barbero', 'Acceso a gestión de citas y ventas', 'Activo', $2),
                (3, 'Cliente', 'Acceso a reservar y ver citas propias', 'Activo', $3)
            `, [adminPermissions, barberoPermissions, clientePermissions]);
            
            console.log("✅ Roles creados.");
        } else {
            console.log("✔ Los roles ya existen.");
        }

        // 2. Insertar Administrador por defecto si no existe
        const adminEmail = 'miguelangelcardonalopez0@gmail.com';
        const userCheck = await client.query("SELECT COUNT(*) FROM Usuarios WHERE email = $1", [adminEmail]);
        if (parseInt(userCheck.rows[0].count) === 0) {
            console.log(`🌱 Registrando al administrador "${adminEmail}"...`);
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await client.query(`
                INSERT INTO Usuarios (id_rol, nombre, tipo_documento, documento, email, telefono, contrasena, direccion, estado)
                VALUES (1, 'Miguel Angel', 'CC', '1000000000', $1, '3000000000', $2, 'Calle Falsa 123', 'Activo')
            `, [adminEmail, hashedPassword]);

            console.log(`✅ Administrador "${adminEmail}" registrado con éxito (contraseña: admin123).`);
        } else {
            console.log(`✔ El administrador "${adminEmail}" ya está registrado.`);
        }

        // 3. Insertar Categorías de Productos por defecto si no existen
        const catCheck = await client.query("SELECT COUNT(*) FROM Categorias_Productos");
        if (parseInt(catCheck.rows[0].count) === 0) {
            console.log("🌱 Insertando categorías de productos por defecto...");
            await client.query(`
                INSERT INTO Categorias_Productos (nombre) VALUES
                ('Afeitado'),
                ('Bebidas'),
                ('Cuidado Capilar'),
                ('Cuidado de Barba'),
                ('Fijación'),
                ('Herramientas'),
                ('Snacks')
            `);
            console.log("✅ Categorías creadas.");
        } else {
            console.log("✔ Las categorías de productos ya existen.");
        }

        // 4. Insertar Marcas por defecto si no existen
        const brandCheck = await client.query("SELECT COUNT(*) FROM Marcas");
        if (parseInt(brandCheck.rows[0].count) === 0) {
            console.log("🌱 Insertando marcas por defecto...");
            await client.query(`
                INSERT INTO Marcas (nombre) VALUES
                ('Suavecito'),
                ('Gillette'),
                ('Elegance'),
                ('Reuzel'),
                ('Sin Marca')
            `);
            console.log("✅ Marcas creadas.");
        } else {
            console.log("✔ Las marcas ya existen.");
        }

    } catch (err) {
        console.error("❌ Error durante el sembrado:", err.message);
    } finally {
        await client.end();
        console.log("🔌 Conexión cerrada.");
    }
}

run();
