const { neon } = require("@neondatabase/serverless")
const fs = require("fs")
const path = require("path")

// Cargar .env si existe
try {
  const envPath = path.join(__dirname, "..", ".env")
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8")
    envContent
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#"))
      .forEach((line) => {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
        if (match) {
          let value = match[2]
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          if (!(match[1] in process.env)) {
            process.env[match[1]] = value
          }
        }
      })
  }
} catch {}

async function inspect() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL no definida. Define en .env o entorno.")
    process.exit(1)
  }
  try {
    const u = new URL(process.env.DATABASE_URL)
    const masked = `${u.protocol}//${u.username || 'user'}:***@${u.hostname}${u.port ? ':'+u.port : ''}${u.pathname}${u.search}`
    console.log(`🔗 Conectando a: ${masked}`)
  } catch {}
  const sql = neon(process.env.DATABASE_URL)
  try {
    const db = await sql`select current_database() as db`;
    const user = await sql`select current_user as user`;
    const schema = await sql`select current_schema as schema`;
    const spath = await sql`show search_path`;
    console.log(`🔎 Base: ${db[0].db}\n👤 Usuario: ${user[0].user}\n📦 Esquema: ${schema[0].schema}\n🛣️  search_path: ${spath[0].search_path}`)

    const tables = await sql`
      select table_schema, table_name
      from information_schema.tables
      where table_type = 'BASE TABLE'
      order by table_schema, table_name
    `
    if (tables.length === 0) {
      console.log("(sin tablas visibles en information_schema.tables)")
    } else {
      console.log("📋 Tablas:")
      for (const t of tables) {
        console.log(` - ${t.table_schema}.${t.table_name}`)
      }
    }
    // Listado de tablas de usuario (excluye catálogos)
    const userTables = await sql`
      select schemaname as table_schema, tablename as table_name
      from pg_tables
      where schemaname not in ('pg_catalog', 'information_schema')
      order by schemaname, tablename
    `
    console.log("\n📦 Tablas de usuario (pg_tables):")
    if (userTables.length === 0) {
      console.log("(no hay tablas de usuario)")
    } else {
      for (const t of userTables) {
        console.log(` - ${t.table_schema}.${t.table_name}`)
      }
    }

    // Probar existencia de tablas esperadas por nuestros scripts
    const expected = [
      'public."Clasificacion"',
      'public."CategoriaEmpresa"',
      'public."Servicio"',
      'public."Rol"',
      'public."TipoNotificacion"',
      'public."CronogramaSunat"',
      'public."Banco"',
      'public."PlantillaMensaje"',
      'public."Usuario"',
      'public."Cartera"',
      'public."Cliente"',
      'public."Pago"',
      'public."Notificacion"',
      'public."CompromisoPago"',
      'public."HistorialClasificacion"',
      'public."Auditoria"',
      'public."LogAcceso"',
      'public.roles',
      'public.permisos',
      'public.rolpermisos',
      'public.usuarios',
    ]
    console.log("\n🔍 Chequeo rápido de tablas clave:")
    for (const name of expected) {
      try {
        const res = await sql`select to_regclass(${name}) as exists`;
        console.log(` - ${name}: ${res[0].exists ? 'OK' : 'NO'}`)
      } catch (err) {
        console.log(` - ${name}: error (${err.message})`)
      }
    }
  } catch (e) {
    console.error("❌ Error inspeccionando la base:", e.message)
    process.exit(1)
  }
}

inspect()


