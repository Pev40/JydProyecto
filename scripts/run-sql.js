require("dotenv").config({ path: ".env.local" })
const { neon } = require("@neondatabase/serverless")
const fs = require("fs")
const path = require("path")

async function runSqlScript(scriptName) {
  try {
    // Verificar que DATABASE_URL esté configurada
    if (!process.env.DATABASE_URL) {
      console.error("❌ ERROR: DATABASE_URL no está configurada")
      console.log("💡 Configura DATABASE_URL en tu archivo .env")
      process.exit(1)
    }

    const sql = neon(process.env.DATABASE_URL)
    const scriptPath = path.join(__dirname, scriptName)

    // Verificar que el archivo existe
    if (!fs.existsSync(scriptPath)) {
      console.error(`❌ ERROR: Script ${scriptName} no encontrado en ${scriptPath}`)
      process.exit(1)
    }

    console.log(`🚀 Ejecutando script: ${scriptName}`)

    // Leer el contenido del archivo SQL
    const sqlContent = fs.readFileSync(scriptPath, "utf8")

    // Ejecutar el contenido completo del archivo SQL como una sola transacción
    console.log(`📝 Ejecutando script completo: ${scriptName}`);
    try {
      // Usamos .unsafe() para ejecutar el script crudo, ya que puede contener múltiples sentencias.
      // Esto es crucial para los archivos de migración complejos con funciones, etc.
      await sql.unsafe(sqlContent);
      console.log(`   ✅ Script ${scriptName} ejecutado exitosamente.`);
    } catch (error) {
      console.error(`   ❌ Error ejecutando ${scriptName}:`, error.message);
      // Salir con error para detener el proceso si un script falla.
      process.exit(1);
    }

    console.log(`✅ Script ${scriptName} ejecutado exitosamente`)
  } catch (error) {
    console.error(`❌ Error ejecutando ${scriptName}:`, error.message)
    process.exit(1)
  }
}

// Obtener el nombre del script desde los argumentos de línea de comandos
const scriptName = process.argv[2]

if (!scriptName) {
  console.error("❌ ERROR: Debes especificar el nombre del script SQL")
  console.log("💡 Uso: node run-sql.js <nombre-del-script.sql>")
  console.log("💡 Ejemplo: node run-sql.js 01-create-database.sql")
  process.exit(1)
}

// Ejecutar el script
runSqlScript(scriptName)
