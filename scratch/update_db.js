const db = require('../src/config/db');

async function updateDb() {
    try {
        console.log("Updating Barber role permissions...");
        
        // 1. Get the current permissions for Barbero (id_rol = 2)
        const result = await db.query("SELECT permisos FROM Roles WHERE id_rol = 2");
        if (result.rows.length === 0) {
            console.error("Barber role not found.");
            process.exit(1);
        }

        let permisos = result.rows[0].permisos;
        if (typeof permisos === 'string') {
            permisos = JSON.parse(permisos);
        }

        // 2. Modify "Clientes" permission
        let found = false;
        permisos = permisos.map(p => {
            if (p.modulo === 'Clientes') {
                found = true;
                return { ...p, leer: true, crear: true }; // allow read and create for booking
            }
            return p;
        });

        if (!found) {
            permisos.push({
                modulo: 'Clientes',
                leer: true,
                crear: true,
                actualizar: false,
                eliminar: false
            });
        }

        // 3. Update in database
        await db.query("UPDATE Roles SET permisos = $1 WHERE id_rol = 2", [JSON.stringify(permisos)]);
        console.log("✅ Barber role permissions updated successfully!");

        // 4. Verify update
        const verifyRes = await db.query("SELECT permisos FROM Roles WHERE id_rol = 2");
        console.log("Updated Barber permissions:", JSON.stringify(verifyRes.rows[0].permisos, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("Error updating DB:", e);
        process.exit(1);
    }
}

updateDb();
