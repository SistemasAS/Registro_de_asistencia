# Manual de Usuario - Sistema de Lista de Asistencia Digital

## 📖 Introducción

Este manual proporciona instrucciones detalladas para el uso del Sistema de Lista de Asistencia Digital, diseñado para reemplazar el proceso manual de registro de asistencia en capacitaciones.

## 👥 Tipos de Usuarios

### 1. Trabajadores/Asistentes
Personas que asisten a las capacitaciones y necesitan registrar su asistencia.

### 2. Administradores/Encargados
Personas responsables de gestionar las capacitaciones y supervisar el registro de asistencia.

---

## 🧑‍💼 Guía para Trabajadores

### Paso 1: Acceso al Sistema
1. **Obtener la URL**: El encargado de la capacitación proporcionará la dirección web
2. **Abrir navegador**: Usar cualquier navegador moderno (Chrome, Firefox, Safari, Edge)
3. **Navegar a la URL**: Escribir o hacer clic en el enlace proporcionado

### Paso 2: Verificar Disponibilidad
Al cargar la página, el sistema mostrará:
- ✅ **"Sistema Activo"**: El formulario está disponible para registro
- ❌ **"Sistema Inactivo"**: El formulario no está disponible (fuera de horario)

**Mensajes posibles:**
- "Formulario disponible" - Puede proceder con el registro
- "El formulario está disponible de XX:XX a XX:XX" - Fuera del horario permitido
- "La capacitación está programada para DD/MM/AAAA" - Fecha incorrecta

### Paso 3: Completar el Formulario

#### Campos Obligatorios (marcados con *)
1. **Nombres y Apellidos**
   - Escribir nombre completo
   - Ejemplo: "Juan Carlos Pérez García"

2. **Número de Documento**
   - Ingresar cédula o documento de identidad
   - Solo números, sin puntos ni espacios
   - Ejemplo: "12345678"

3. **Cargo**
   - Especificar el puesto de trabajo
   - Ejemplo: "Supervisor de Seguridad", "Operario", "Técnico"

4. **Ruta**
   - Indicar la ruta o área de trabajo
   - Ejemplo: "Ruta Norte", "Área A", "Planta 1"

#### Campo Opcional
5. **Firma Digital**
   - Hacer clic en "Choose File" o "Seleccionar archivo"
   - Seleccionar imagen de la firma (PNG, JPG, JPEG, GIF)
   - Tamaño máximo: 5MB
   - Se mostrará una vista previa de la imagen

### Paso 4: Registrar Asistencia
1. **Verificar datos**: Revisar que toda la información esté correcta
2. **Hacer clic en "Registrar Asistencia"**: El botón se encuentra al final del formulario
3. **Esperar confirmación**: El sistema procesará la información

### Paso 5: Confirmación
Si el registro es exitoso, verá:
- ✅ Mensaje "¡Asistencia Registrada!"
- 🕐 Hora exacta de registro
- 🔄 Opción para "Registrar Otra Persona"

### Posibles Errores y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| "Todos los campos son obligatorios" | Falta completar campos marcados con * | Completar todos los campos obligatorios |
| "Ya existe un registro con este número de documento" | Documento ya registrado hoy | Verificar si ya se registró anteriormente |
| "El formulario no está disponible" | Fuera del horario permitido | Esperar al horario correcto o contactar al administrador |
| "Tipo de archivo no permitido" | Formato de imagen incorrecto | Usar PNG, JPG, JPEG o GIF |
| "El archivo es demasiado grande" | Imagen mayor a 5MB | Reducir el tamaño de la imagen |

---

## 👨‍💼 Guía para Administradores

### Acceso al Panel de Administración

#### Paso 1: Navegación
1. Agregar `/admin.html` al final de la URL principal
2. Ejemplo: Si la URL es `http://empresa.com/asistencia`, usar `http://empresa.com/asistencia/admin.html`

#### Paso 2: Autenticación
**Credenciales por defecto:**
- **Usuario**: `admin`
- **Contraseña**: `admin123`

> ⚠️ **Importante**: Cambiar estas credenciales después de la primera instalación

### Dashboard Principal

#### Estadísticas en Tiempo Real
- **Asistentes Hoy**: Número total de personas registradas
- **Estado del Sistema**: Activo/Inactivo según configuración
- **Cargos Diferentes**: Cantidad de cargos únicos registrados
- **Rutas Diferentes**: Cantidad de rutas únicas registradas

#### Gráficos de Distribución
- **Por Cargo**: Muestra la distribución de asistentes según su cargo
- **Por Ruta**: Muestra la distribución de asistentes según su ruta

### Gestión de Asistentes

#### Visualización de Lista
- **Tabla completa**: Todos los asistentes con sus datos
- **Información mostrada**: Nombre, documento, cargo, ruta, hora de llegada, firma
- **Ordenamiento**: Por hora de llegada (más reciente primero)

#### Filtros Disponibles
1. **Por Fecha**: Seleccionar fecha específica (por defecto: hoy)
2. **Por Búsqueda**: Buscar por nombre o número de documento
3. **Por Cargo**: Filtrar por cargo específico
4. **Por Ruta**: Filtrar por ruta específica

#### Generación de PDF
1. **Seleccionar fecha**: Usar el selector de fecha
2. **Aplicar filtros**: Si desea un reporte específico
3. **Hacer clic en "Generar PDF"**: El archivo se descargará automáticamente

**Contenido del PDF:**
- Encabezado con datos de la empresa
- Información de la capacitación
- Tabla completa de asistentes
- Total de asistentes registrados

### Configuración del Sistema

#### Datos de la Capacitación
- **Nombre de la Capacitación**: Título que aparece en el formulario
- **Empresa Capacitadora**: Nombre de la empresa que imparte la capacitación
- **Fecha de Capacitación**: Día en que se realizará la capacitación

#### Control de Horarios
- **Hora de Inicio**: Hora desde la cual el formulario estará disponible
- **Hora de Fin**: Hora hasta la cual el formulario estará disponible
- **Formato**: 24 horas (ejemplo: 08:00, 17:30)

#### Información de la Empresa
- **Nombre de la Empresa**: Aparece en el encabezado del formulario
- **Dirección**: Dirección física de la empresa
- **Teléfono**: Número de contacto de la empresa

#### Control del Sistema
- **Sistema Activo**: Checkbox para activar/desactivar el formulario
- **Efecto**: Cuando está desactivado, nadie puede registrar asistencia

### Tareas Administrativas Comunes

#### Preparación Diaria
1. **Verificar configuración**: Revisar fecha y horarios
2. **Activar sistema**: Asegurar que el checkbox "Sistema Activo" esté marcado
3. **Probar formulario**: Hacer una prueba de registro
4. **Compartir URL**: Proporcionar la dirección web a los participantes

#### Durante la Capacitación
1. **Monitorear registros**: Revisar el dashboard periódicamente
2. **Asistir usuarios**: Ayudar con problemas de registro
3. **Verificar duplicados**: El sistema previene automáticamente registros duplicados

#### Finalización
1. **Desactivar sistema**: Desmarcar "Sistema Activo" al finalizar
2. **Generar reporte final**: Crear PDF con todos los asistentes
3. **Respaldar datos**: Guardar copia de la base de datos si es necesario

### Gestión de Múltiples Capacitaciones

#### Para Nueva Capacitación
1. **Actualizar configuración**: Cambiar nombre, fecha y horarios
2. **Verificar datos de empresa**: Actualizar si es necesario
3. **Activar sistema**: Habilitar para la nueva fecha
4. **Comunicar cambios**: Informar nueva URL si cambió

#### Historial de Capacitaciones
- Los datos se mantienen en la base de datos
- Usar filtro de fecha para ver capacitaciones anteriores
- Generar PDFs históricos cuando sea necesario

### Solución de Problemas para Administradores

#### Problemas de Acceso
- **No puede ingresar al panel**: Verificar credenciales
- **Página no carga**: Verificar que la aplicación esté ejecutándose
- **Sesión expirada**: Volver a iniciar sesión

#### Problemas de Configuración
- **Cambios no se guardan**: Verificar conexión y hacer clic en "Guardar"
- **Horarios incorrectos**: Usar formato 24 horas (HH:MM)
- **Fechas incorrectas**: Usar formato AAAA-MM-DD

#### Problemas con Registros
- **No aparecen asistentes**: Verificar filtro de fecha
- **Registros duplicados**: El sistema previene esto automáticamente
- **PDF no se genera**: Verificar que haya asistentes registrados

### Seguridad y Mejores Prácticas

#### Seguridad
- **Cambiar credenciales por defecto** inmediatamente
- **No compartir credenciales** de administrador
- **Cerrar sesión** al terminar de usar el panel
- **Usar HTTPS** en producción

#### Respaldos
- **Respaldar base de datos** regularmente
- **Guardar PDFs importantes** en ubicación segura
- **Documentar configuraciones** para futuras referencias

#### Mantenimiento
- **Limpiar archivos antiguos** de firmas digitales periódicamente
- **Monitorear espacio de almacenamiento**
- **Actualizar sistema** cuando sea necesario

---

## 📞 Contacto y Soporte

### Para Trabajadores
- Contactar al encargado de la capacitación
- Verificar URL y horarios proporcionados
- Reportar problemas técnicos al administrador

### Para Administradores
- Consultar documentación técnica (README.md)
- Revisar logs de la aplicación para errores
- Contactar soporte técnico si es necesario

---

**Última actualización**: Julio 2025  
**Versión del manual**: 1.0

