const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
    let databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("❌ Error: No DATABASE_URL found in .env");
        process.exit(1);
    }

    // Clean up comments if they exist in the connection string
    databaseUrl = databaseUrl.split('#')[0].trim();

    // Check if password has '@' and encode it if it isn't already encoded
    // Format: postgresql://user:password@host:port/database
    // If the password has special characters like '@', we need to percent-encode it.
    try {
        const urlObj = new URL(databaseUrl);
        console.log(`📡 Intentando conectar a Supabase (${urlObj.hostname})...`);
    } catch (e) {
        // If URL parsing fails, let's try to automatically percent-encode '@' in the password part
        console.log("⚠️ Cadena de conexión con caracteres especiales. Intentando codificar contraseña...");
        const match = databaseUrl.match(/^(postgresql:\/\/|postgres:\/\/)([^:]+):(.+)@([^@]+)$/);
        if (match) {
            const protocol = match[1];
            const user = match[2];
            let password = match[3];
            const rest = match[4];
            
            // Encode the password
            password = encodeURIComponent(password);
            databaseUrl = `${protocol}${user}:${password}@${rest}`;
        } else {
            console.error("❌ Error: Formato de DATABASE_URL inválido.");
            process.exit(1);
        }
    }

    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ ¡Conexión exitosa a la base de datos de Supabase!");

        // 1. Leer y aplicar el esquema
        console.log("🌱 Aplicando el esquema de base de datos (database_schema.sql)...");
        const schemaPath = path.join(__dirname, 'database_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Ejecutar el script completo
        await client.query(schemaSql);
        console.log("✅ Esquema creado exitosamente (Tablas, Índices, Disparadores creados).");

        // 2. Sembrado de datos iniciales
        console.log("🌱 Insertando datos iniciales (roles, administrador, categorías, marcas)...");
        
        // Roles
        const rolesCheck = await client.query("SELECT COUNT(*) FROM Roles");
        if (parseInt(rolesCheck.rows[0].count) === 0) {
            console.log("   Creando roles...");
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
                { modulo: "Ventas", crear: true, leer: true, actualizar: false, eliminar: false }
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
            console.log("   ✅ Roles creados.");
        }

        // Administrador por defecto
        const adminEmail = 'miguelangelcardonalopez0@gmail.com';
        const userCheck = await client.query("SELECT COUNT(*) FROM Usuarios WHERE email = $1", [adminEmail]);
        if (parseInt(userCheck.rows[0].count) === 0) {
            console.log(`   Registrando administrador "${adminEmail}"...`);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await client.query(`
                INSERT INTO Usuarios (id_rol, nombre, tipo_documento, documento, email, telefono, contrasena, direccion, estado)
                VALUES (1, 'Miguel Angel', 'CC', '1000000000', $1, '3000000000', $2, 'Calle Falsa 123', 'Activo')
            `, [adminEmail, hashedPassword]);
            console.log("   ✅ Administrador registrado (correo: miguelangelcardonalopez0@gmail.com / contraseña: admin123).");
        }

        // Categorías de productos
        const catCheck = await client.query("SELECT COUNT(*) FROM Categorias_Productos");
        if (parseInt(catCheck.rows[0].count) === 0) {
            console.log("   Insertando categorías...");
            await client.query(`
                INSERT INTO Categorias_Productos (nombre) VALUES
                ('Afeitado'), ('Bebidas'), ('Cuidado Capilar'), ('Cuidado de Barba'), ('Fijación'), ('Herramientas'), ('Snacks')
            `);
            console.log("   ✅ Categorías creadas.");
        }

        // Marcas
        const brandCheck = await client.query("SELECT COUNT(*) FROM Marcas");
        if (parseInt(brandCheck.rows[0].count) === 0) {
            console.log("   Insertando marcas...");
            await client.query(`
                INSERT INTO Marcas (nombre) VALUES
                ('Suavecito'), ('Gillette'), ('Elegance'), ('Reuzel'), ('Sin Marca')
            `);
            console.log("   ✅ Marcas creadas.");
        }

        console.log("🎉 ¡Migración e Inicialización completada exitosamente!");

    } catch (err) {
        console.error("❌ Error durante la migración:", err.message);
        console.error(err);
    } finally {
        await client.end();
        console.log("🔌 Conexión cerrada.");
    }
}

run();
