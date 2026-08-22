const db = require('../../config/db');

class AppVersionController {
    /**
     * Obtiene el registro de versión más reciente (con mayor version_code).
     */
    static async getLatestVersion(req, res) {
        try {
            const query = `
                SELECT id, version_name, version_code, download_url, fecha_creacion
                FROM App_Version
                ORDER BY version_code DESC
                LIMIT 1
            `;
            const result = await db.query(query);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No hay ninguna versión registrada'
                });
            }
            
            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error al obtener la versión más reciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Inserta o actualiza un registro de versión.
     * Si el version_code ya existe, actualiza la información; de lo contrario, inserta una nueva versión.
     */
    static async updateVersion(req, res) {
        const { version_name, version_code, download_url } = req.body;
        
        if (!version_name || version_code === undefined || !download_url) {
            return res.status(400).json({
                success: false,
                message: 'Los campos version_name, version_code y download_url son obligatorios'
            });
        }

        const vCode = parseInt(version_code);
        if (isNaN(vCode)) {
            return res.status(400).json({
                success: false,
                message: 'El campo version_code debe ser un número entero'
            });
        }

        try {
            // Verificar si ya existe este código de versión
            const checkQuery = 'SELECT id FROM App_Version WHERE version_code = $1';
            const checkResult = await db.query(checkQuery, [vCode]);
            
            if (checkResult.rows.length > 0) {
                // Actualizar
                const updateQuery = `
                    UPDATE App_Version
                    SET version_name = $1, download_url = $2, fecha_creacion = CURRENT_TIMESTAMP
                    WHERE version_code = $3
                    RETURNING *
                `;
                const result = await db.query(updateQuery, [version_name, download_url, vCode]);
                return res.json({
                    success: true,
                    message: 'Información de versión actualizada correctamente',
                    data: result.rows[0]
                });
            } else {
                // Insertar nueva
                const insertQuery = `
                    INSERT INTO App_Version (version_name, version_code, download_url)
                    VALUES ($1, $2, $3)
                    RETURNING *
                `;
                const result = await db.query(insertQuery, [version_name, vCode, download_url]);
                return res.status(201).json({
                    success: true,
                    message: 'Nueva versión registrada correctamente',
                    data: result.rows[0]
                });
            }
        } catch (error) {
            console.error('Error al registrar/actualizar la versión:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = AppVersionController;
