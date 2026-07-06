const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'DELL', 'Documents', 'barbersiteweb-2', 'src', 'lib', 'api.ts');

if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found at: ${filePath}`);
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Buscamos y reemplazamos de forma insensible a los saltos de línea (\r\n o \n)
const target = "export const API_BASE_URL = 'http://localhost:4000';\r\nconst API_URL = `${API_BASE_URL}/api`;";
const targetLF = "export const API_BASE_URL = 'http://localhost:4000';\nconst API_URL = `${API_BASE_URL}/api`;";

const replacement = "export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';\r\nconst API_URL = API_BASE_URL.includes('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;";

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("✅ Reemplazo exitoso (CRLF).");
} else if (content.includes(targetLF)) {
    content = content.replace(targetLF, replacement);
    console.log("✅ Reemplazo exitoso (LF).");
} else {
    // Si tiene comentarios o espacios intermedios, hacemos un reemplazo más flexible
    console.log("⚠ No se encontró el bloque exacto, intentando reemplazo parcial...");
    content = content.replace("export const API_BASE_URL = 'http://localhost:4000';", "export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';");
    content = content.replace("const API_URL = `${API_BASE_URL}/api`;", "const API_URL = API_BASE_URL.includes('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;");
    console.log("✅ Reemplazo parcial completado.");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("💾 Cambios guardados en api.ts.");
