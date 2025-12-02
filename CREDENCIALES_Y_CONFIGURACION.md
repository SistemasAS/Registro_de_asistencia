# Credenciales y Configuración Inicial

## 🔐 Credenciales de Acceso

### Panel de Administración
- **URL de acceso**: `http://localhost:5001/admin.html`
- **Usuario**: `admin`
- **Contraseña**: `admin123`

> ⚠️ **IMPORTANTE**: Estas son las credenciales por defecto. Se recomienda cambiarlas después de la primera instalación.

## 🌐 URLs del Sistema

### Para Trabajadores (Registro de Asistencia)
- **URL principal**: `http://localhost:5001/`
- **Descripción**: Formulario de registro de asistencia

### Para Administradores
- **Panel de administración**: `http://localhost:5001/admin.html`
- **Descripción**: Dashboard, configuración y gestión de asistentes

## ⚙️ Configuración Inicial por Defecto

### Datos de la Capacitación
- **Nombre**: "Capacitación de Seguridad"
- **Empresa Capacitadora**: "Empresa Capacitadora"
- **Fecha**: Fecha actual del sistema
- **Horario**: 08:00 - 17:00

### Información de la Empresa
- **Nombre**: "Mi Empresa"
- **Dirección**: "Calle Principal #123, Ciudad"
- **Teléfono**: "+57 300 123 4567"

### Estado del Sistema
- **Sistema Activo**: ✅ Habilitado por defecto
- **Puerto de aplicación**: 5001

## 🔧 Cómo Cambiar las Credenciales

### Método 1: Eliminar Base de Datos y Reiniciar
1. Detener la aplicación (Ctrl+C)
2. Eliminar el archivo `src/database/app.db`
3. Editar `src/main.py` líneas 35-36:
```python
admin = Administrador(usuario='NUEVO_USUARIO')
admin.set_password('NUEVA_CONTRASEÑA')
```
4. Reiniciar la aplicación: `python main.py`

### Método 2: Modificar en Base de Datos (Avanzado)
```python
# Ejecutar en consola Python dentro del directorio src/
from models.asistencia import db, Administrador
from werkzeug.security import generate_password_hash

# Buscar administrador existente
admin = Administrador.query.first()
admin.usuario = 'NUEVO_USUARIO'
admin.password_hash = generate_password_hash('NUEVA_CONTRASEÑA')
db.session.commit()
```

## 🌐 Configuración de Red

### Para Acceso Local Únicamente
- **Host**: `127.0.0.1` o `localhost`
- **Puerto**: `5001`
- **URL completa**: `http://localhost:5001`

### Para Acceso en Red Local
- **Host**: `0.0.0.0` (configurado por defecto)
- **Puerto**: `5001`
- **URL desde otros dispositivos**: `http://[IP_DEL_SERVIDOR]:5001`

#### Encontrar IP del Servidor
```bash
# En Windows
ipconfig

# En Linux/Mac
ifconfig
# o
ip addr show
```

### Para Acceso desde Internet (Producción)
1. **Configurar router**: Abrir puerto 5001 hacia el servidor
2. **Usar dominio**: Configurar DNS para apuntar al servidor
3. **Implementar HTTPS**: Usar certificados SSL/TLS
4. **Configurar firewall**: Permitir solo conexiones necesarias

## 📁 Estructura de Archivos Importantes

### Base de Datos
- **Ubicación**: `src/database/app.db`
- **Tipo**: SQLite
- **Respaldo**: Copiar este archivo para hacer backup

### Firmas Digitales
- **Ubicación**: `src/static/uploads/firmas/`
- **Formato**: PNG, JPG, JPEG, GIF
- **Tamaño máximo**: 5MB por archivo

### Logs de la Aplicación
- **Ubicación**: Consola donde se ejecuta `python main.py`
- **Información**: Errores, accesos, registros de asistencia

## 🔄 Configuración de Horarios

### Formato de Hora
- **Formato**: 24 horas (HH:MM)
- **Ejemplos válidos**: 
  - `08:00` (8:00 AM)
  - `17:30` (5:30 PM)
  - `23:59` (11:59 PM)

### Comportamiento del Sistema
- **Dentro del horario**: Formulario disponible, muestra "Sistema Activo"
- **Fuera del horario**: Formulario bloqueado, muestra mensaje informativo
- **Fecha incorrecta**: Formulario bloqueado, muestra fecha programada

## 📊 Configuración de PDF

### Datos Incluidos en el PDF
- Logo de la empresa (si está configurado)
- Información de la capacitación
- Datos de la empresa
- Tabla completa de asistentes
- Total de registros

### Personalización
- **Logo**: Reemplazar `src/static/logo-placeholder.svg`
- **Encabezado**: Modificar en panel de configuración
- **Formato**: A4, orientación vertical

## 🛡️ Configuración de Seguridad

### Clave Secreta de la Aplicación
- **Ubicación**: `src/main.py` línea 12
- **Valor actual**: `'tu_clave_secreta_aqui'`
- **Recomendación**: Cambiar por una clave aleatoria de 32+ caracteres

```python
# Generar clave segura
import secrets
print(secrets.token_hex(32))
```

### Configuración de Sesiones
- **Duración**: Hasta cerrar navegador
- **Seguridad**: Cookies HTTPOnly habilitadas
- **Alcance**: Solo dominio de la aplicación

## 🚀 Configuración para Producción

### Variables de Entorno Recomendadas
```bash
export FLASK_ENV=production
export SECRET_KEY=tu_clave_secreta_muy_larga_y_aleatoria
export DATABASE_URL=sqlite:///database/app.db
```

### Servidor WSGI (Gunicorn)
```bash
# Instalar gunicorn
pip install gunicorn

# Ejecutar en producción
gunicorn -w 4 -b 0.0.0.0:5001 main:app
```

### Proxy Reverso (Nginx)
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📋 Lista de Verificación Pre-Despliegue

### Configuración Básica
- [ ] Cambiar credenciales por defecto
- [ ] Configurar datos de la empresa
- [ ] Establecer horarios correctos
- [ ] Probar registro de asistencia
- [ ] Verificar generación de PDF

### Seguridad
- [ ] Cambiar SECRET_KEY
- [ ] Configurar HTTPS (producción)
- [ ] Configurar firewall
- [ ] Establecer respaldos automáticos

### Red y Acceso
- [ ] Verificar acceso desde dispositivos móviles
- [ ] Probar desde diferentes navegadores
- [ ] Confirmar URLs de acceso
- [ ] Documentar IPs y puertos

### Capacitación
- [ ] Entrenar administradores
- [ ] Preparar material de ayuda para usuarios
- [ ] Establecer procedimientos de soporte
- [ ] Documentar procesos de respaldo

## 📞 Información de Contacto Técnico

### Soporte de Primera Línea
- Administrador del sistema local
- Manual de usuario disponible

### Soporte Técnico
- Documentación completa en README.md
- Logs de aplicación para diagnóstico
- Base de conocimientos en manuales

---

**Fecha de creación**: Julio 2025  
**Versión**: 1.0  
**Estado**: Configuración inicial lista para producción

