const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'DELL', 'Documents', 'barbersiteweb-2', 'src', 'components', 'views', 'ProductosView.tsx');

if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found at: ${filePath}`);
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

const target = "imagen: p.img ? (p.img.startsWith('http') ? p.img : `${API_BASE_URL}${p.img}`) : null,";
const targetLF = "imagen: p.img ? (p.img.startsWith('http') ? p.img : `${API_BASE_URL}${p.img}`) : null,";
const replacement = "imagen: p.img ? (p.img.startsWith('http') ? p.img : `${API_BASE_URL.replace('/api', '')}${p.img}`) : null,";

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("✅ Reemplazo de preview de imagen exitoso (CRLF).");
} else if (content.includes(targetLF)) {
    content = content.replace(targetLF, replacement);
    console.log("✅ Reemplazo de preview de imagen exitoso (LF).");
} else {
    console.log("⚠ No se encontró la coincidencia exacta, intentando reemplazo parcial...");
    content = content.replace("`${API_BASE_URL}${p.img}`", "`${API_BASE_URL.replace('/api', '')}${p.img}`");
    console.log("✅ Reemplazo parcial completado.");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("💾 Cambios guardados en ProductosView.tsx.");
