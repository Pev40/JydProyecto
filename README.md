# Sistema de Gestión de Cobranza

Sistema web para la gestión de cobranza y recordatorios de pago para **J & D CONSULTORES DE NEGOCIOS S.A.C.**

## 🚀 Características Principales

- ✅ **Gestión de Clientes** - Registro y clasificación automática (A, B, C)
- ✅ **Registro de Pagos** - Con subida de comprobantes a AWS S3
- ✅ **Dashboard Interactivo** - Métricas y KPIs en tiempo real
- ✅ **Filtros por Dígito RUC** - Integración con cronograma SUNAT
- ✅ **Clasificación Automática** - Basada en historial de pagos
- 🔄 **Notificaciones** - WhatsApp y Email (próximamente)
- 📊 **Reportes Avanzados** - Flujos de caja y análisis (próximamente)

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Neon PostgreSQL
- **Almacenamiento**: AWS S3 para comprobantes
- **UI**: shadcn/ui, Lucide Icons

## 📋 Requisitos Previos

- Node.js 18+ 
- Cuenta en [Neon.tech](https://neon.tech) (PostgreSQL)
- Cuenta en AWS con acceso a S3
- Git

## ⚡ Instalación Rápida

### 1. Clonar el repositorio
\`\`\`bash
git clone <repository-url>
cd sistema-cobranza
npm install
\`\`\`

### 2. Configurar variables de entorno
\`\`\`bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus credenciales
nano .env
\`\`\`

### 3. Configurar Base de Datos

#### Crear base de datos en Neon:
1. Ve a [neon.tech](https://neon.tech) y crea una cuenta
2. Crea un nuevo proyecto/base de datos
3. Copia la URL de conexión
4. Pégala en `.env` como `DATABASE_URL`

#### Ejecutar scripts SQL:
\`\`\`bash
# Ejecutar desde la consola de Neon o tu cliente SQL preferido
# 1. scripts/01-create-database.sql
# 2. scripts/02-seed-data.sql  
# 3. scripts/03-add-detalle-pago-servicio.sql
\`\`\`

### 4. Configurar AWS S3

#### Crear bucket S3:
1. Ve a AWS Console > S3
2. Crea un bucket (ej: `cobranza-comprobantes`)
3. Configura permisos públicos de lectura
4. Crea usuario IAM con permisos S3
5. Obtén Access Key y Secret Key
6. Configura en `.env`

### 5. Ejecutar la aplicación
\`\`\`bash
npm run dev
\`\`\`

Visita [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

\`\`\`
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   ├── clientes/          # Gestión de clientes
│   ├── pagos/             # Gestión de pagos
│   └── page.tsx           # Dashboard principal
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de shadcn/ui
│   ├── cliente-form.tsx  # Formulario de clientes
│   └── pago-form.tsx     # Formulario de pagos
├── lib/                  # Utilidades y configuración
│   ├── db.ts            # Configuración de base de datos
│   └── queries.ts       # Consultas SQL
├── scripts/             # Scripts SQL
└── .env                 # Variables de entorno
\`\`\`

## 🔧 Configuración Detallada

### Variables de Entorno Requeridas

\`\`\`env
# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_S3_BUCKET_NAME=tu_bucket_name
\`\`\`

### Configuración de S3 Bucket

1. **Crear bucket** con nombre único
2. **Configurar CORS**:
\`\`\`json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
\`\`\`

3. **Política de bucket** (opcional para acceso público):
\`\`\`json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::tu-bucket-name/*"
        }
    ]
}
\`\`\`

## 📊 Funcionalidades Implementadas

### ✅ Completamente Funcionales
- **RF01**: Registro completo de clientes
- **RF02**: Clasificación automática (A, B, C)
- **RF03**: Filtros por último dígito RUC
- **RF04**: Asignación de carteras y encargados
- **RF05**: Historial de pagos
- **RF06**: Cálculo automático de saldos
- **RF07**: Identificación de clientes morosos
- **RF13**: Registro de pagos con comprobantes
- **RF14**: Actualización automática de estados
- **RF17**: Identificación de meses/servicios pagados
- **RF20**: Dashboard con indicadores clave

### 🔄 En Desarrollo
- **RF08-RF12**: Sistema de notificaciones
- **RF15-RF16**: Gestión avanzada de comprobantes
- **RF18-RF23**: Reportes y análisis avanzados
- **RF24-RF25**: Integración completa con SUNAT

## 🚀 Despliegue

### Vercel (Recomendado)
\`\`\`bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en Vercel Dashboard
\`\`\`

### Variables de entorno en producción:
- Configura todas las variables del `.env` en tu plataforma de despliegue
- Asegúrate de que la base de datos sea accesible desde internet
- Configura el bucket S3 con los permisos correctos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@jdconsultores.com
- Documentación: [Wiki del proyecto]

## 📄 Licencia

Este proyecto es propiedad de **J & D CONSULTORES DE NEGOCIOS S.A.C.**

---

**Desarrollado con ❤️ para J & D CONSULTORES DE NEGOCIOS S.A.C.**
# JydProyecto
