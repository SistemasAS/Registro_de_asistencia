# Sistema de Lista de Asistencia Digital

Una aplicación web completa para el registro digital de asistencia en capacitaciones, que reemplaza el proceso manual tradicional con una solución moderna, eficiente y fácil de usar.

## 🚀 Características Principales

### Para Trabajadores
- **Formulario de registro intuitivo** con campos obligatorios y opcionales
- **Carga de firma digital** mediante imágenes
- **Registro automático de hora de llegada**
- **Interfaz responsive** que funciona en cualquier dispositivo
- **Validación en tiempo real** de datos ingresados
- **Prevención de registros duplicados** por número de documento

### Para Administradores
- **Panel de administración completo** con autenticación segura
- **Dashboard con estadísticas** en tiempo real
- **Gestión de configuración** del sistema
- **Control de horarios** de disponibilidad del formulario
- **Visualización completa** de asistentes registrados
- **Filtros y búsqueda avanzada** de registros
- **Generación automática de PDF** con lista de asistencia

### Características Técnicas
- **Control de acceso por horario** configurable
- **Encabezado personalizable** con logo y datos de empresa
- **Base de datos SQLite** para fácil despliegue
- **API REST** para comunicación frontend-backend
- **Diseño responsive** con Bootstrap 5
- **Validación de seguridad** en cliente y servidor

## 📋 Requisitos del Sistema

- Python 3.8 o superior
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Espacio de almacenamiento para base de datos e imágenes

## 🛠️ Instalación

### 1. Clonar o descargar el proyecto
```bash
# Si tienes el proyecto en un repositorio
git clone [URL_DEL_REPOSITORIO]
cd lista_asistencia

# O simplemente descomprime el archivo ZIP en una carpeta
```

### 2. Crear entorno virtual (recomendado)
```bash
python -m venv venv

# En Windows
venv\\Scripts\\activate

# En Linux/Mac
source venv/bin/activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Inicializar la aplicación
```bash
cd src
python main.py
```

La aplicación estará disponible en: `http://localhost:5001`

## 🎯 Uso del Sistema

### Para Trabajadores

1. **Acceder al formulario**: Navega a la URL proporcionada por el administrador
2. **Verificar disponibilidad**: El sistema mostrará si el formulario está disponible según el horario configurado
3. **Completar datos obligatorios**:
   - Nombres y apellidos
   - Número de documento
   - Cargo
   - Ruta
4. **Agregar firma digital** (opcional): Subir una imagen con la firma
5. **Registrar asistencia**: Hacer clic en "Registrar Asistencia"
6. **Confirmación**: El sistema mostrará la confirmación con la hora de registro

### Para Administradores

#### Acceso al Panel
1. Navegar a: `http://localhost:5001/admin.html`
2. Usar las credenciales por defecto:
   - **Usuario**: `admin`
   - **Contraseña**: `admin123`

#### Dashboard
- Ver estadísticas en tiempo real
- Monitorear asistentes registrados
- Verificar estado del sistema
- Analizar distribución por cargo y ruta

#### Gestión de Asistentes
- Ver lista completa de asistentes
- Filtrar por fecha, cargo o ruta
- Buscar por nombre o documento
- Generar PDF con lista de asistencia

#### Configuración del Sistema
- **Datos de la capacitación**:
  - Nombre de la capacitación
  - Empresa capacitadora
  - Fecha de la capacitación
- **Horarios de acceso**:
  - Hora de inicio
  - Hora de fin
- **Información de la empresa**:
  - Nombre de la empresa
  - Dirección
  - Teléfono
- **Control del sistema**:
  - Activar/desactivar formulario

## 📁 Estructura del Proyecto

```
lista_asistencia/
├── src/
│   ├── models/
│   │   └── asistencia.py          # Modelos de base de datos
│   ├── routes/
│   │   ├── asistencia.py          # Rutas para registro de asistencia
│   │   └── admin.py               # Rutas para panel de administración
│   ├── static/
│   │   ├── index.html             # Página principal
│   │   ├── admin.html             # Panel de administración
│   │   ├── styles.css             # Estilos principales
│   │   ├── admin-styles.css       # Estilos del panel admin
│   │   ├── script.js              # JavaScript principal
│   │   ├── admin-script.js        # JavaScript del panel admin
│   │   ├── logo-placeholder.svg   # Logo por defecto
│   │   └── uploads/
│   │       └── firmas/            # Directorio para firmas digitales
│   ├── database/
│   │   └── app.db                 # Base de datos SQLite
│   └── main.py                    # Archivo principal de la aplicación
├── venv/                          # Entorno virtual
├── requirements.txt               # Dependencias de Python
└── README.md                      # Este archivo
```

## 🔧 Configuración Avanzada

### Cambiar Puerto
Editar `src/main.py` línea 77:
```python
app.run(host='0.0.0.0', port=NUEVO_PUERTO, debug=True)
```

### Cambiar Credenciales de Administrador
Las credenciales se crean automáticamente al iniciar la aplicación. Para cambiarlas:
1. Eliminar el archivo `src/database/app.db`
2. Editar `src/main.py` líneas 35-36:
```python
admin = Administrador(usuario='NUEVO_USUARIO')
admin.set_password('NUEVA_CONTRASEÑA')
```
3. Reiniciar la aplicación

### Personalizar Logo de Empresa
1. Reemplazar `src/static/logo-placeholder.svg` con tu logo
2. Formatos soportados: SVG, PNG, JPG
3. Tamaño recomendado: 120x80 píxeles

## 🚀 Despliegue en Producción

### Opción 1: Servidor Local
```bash
# Instalar gunicorn para producción
pip install gunicorn

# Ejecutar con gunicorn
cd src
gunicorn -w 4 -b 0.0.0.0:5001 main:app
```

### Opción 2: Servidor Web (Apache/Nginx)
1. Configurar proxy reverso hacia la aplicación Flask
2. Servir archivos estáticos directamente desde el servidor web
3. Configurar HTTPS para mayor seguridad

### Consideraciones de Seguridad
- Cambiar la `SECRET_KEY` en `main.py`
- Usar HTTPS en producción
- Configurar firewall para limitar acceso
- Realizar respaldos regulares de la base de datos

## 📊 API Endpoints

### Endpoints Públicos
- `GET /` - Página principal
- `GET /api/estado` - Estado del sistema
- `POST /api/registrar` - Registrar asistencia

### Endpoints de Administración
- `POST /admin/login` - Iniciar sesión
- `POST /admin/logout` - Cerrar sesión
- `GET /admin/configuracion` - Obtener configuración
- `POST /admin/configuracion` - Actualizar configuración
- `GET /admin/asistentes` - Lista de asistentes
- `GET /admin/dashboard` - Estadísticas
- `GET /admin/generar-pdf` - Generar PDF

## 🔍 Solución de Problemas

### La aplicación no inicia
- Verificar que Python 3.8+ esté instalado
- Asegurar que todas las dependencias estén instaladas
- Verificar que el puerto no esté en uso

### Error de base de datos
- Eliminar `src/database/app.db` y reiniciar la aplicación
- Verificar permisos de escritura en el directorio

### Problemas con imágenes
- Verificar que el directorio `src/static/uploads/firmas/` exista
- Comprobar permisos de escritura
- Verificar tamaño máximo de archivo (5MB)

### Panel de administración no carga
- Verificar credenciales (admin/admin123)
- Limpiar caché del navegador
- Verificar que JavaScript esté habilitado

## 📞 Soporte

Para soporte técnico o consultas:
- Revisar la documentación completa
- Verificar los logs de la aplicación
- Consultar la sección de solución de problemas

## 📄 Licencia

Este proyecto está desarrollado para uso interno de la empresa. Todos los derechos reservados.

---

**Desarrollado con ❤️ para modernizar el proceso de registro de asistencia**

