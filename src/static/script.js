// Estado global de la aplicación
let appState = {
    systemStatus: null,
    configuration: null,
    isLoading: false
};

// Elementos del DOM
const elements = {
    loadingSpinner: document.getElementById('loadingSpinner'),
    systemAlert: document.getElementById('systemAlert'),
    systemMessage: document.getElementById('systemMessage'),
    registrationSection: document.getElementById('registrationSection'),
    successSection: document.getElementById('successSection'),
    registrationForm: document.getElementById('registrationForm'),
    submitBtn: document.getElementById('submitBtn'),

    // Elementos de información
    nombreEmpresa: document.getElementById('nombreEmpresa'),
    direccionEmpresa: document.getElementById('direccionEmpresa'),
    telefonoEmpresa: document.getElementById('telefonoEmpresa'),
    logoEmpresa: document.getElementById('logoEmpresa'),
    nombreCapacitacion: document.getElementById('nombreCapacitacion'),
    empresaCapacitadora: document.getElementById('empresaCapacitadora'),
    fechaCapacitacion: document.getElementById('fechaCapacitacion'),
    horarioCapacitacion: document.getElementById('horarioCapacitacion'),
    statusIcon: document.getElementById('statusIcon'),
    statusText: document.getElementById('statusText'),

    // Elementos del formulario
    nombresApellidos: document.getElementById('nombresApellidos'),
    numeroDocumento: document.getElementById('numeroDocumento'),
    cargo: document.getElementById('cargo'),
    ruta: document.getElementById('ruta'),
    firmaDigital: document.getElementById('firmaDigital'),
    imagePreview: document.getElementById('imagePreview'),
    previewImg: document.getElementById('previewImg'),
    ciudad: document.getElementById('ciudad'),

    // Elementos de éxito
    successMessage: document.getElementById('successMessage'),
    horaRegistro: document.getElementById('horaRegistro')
};

// Utilidades
const utils = {
    // Mostrar/ocultar loading
    showLoading: () => {
        elements.loadingSpinner.classList.remove('d-none');
        appState.isLoading = true;
    },

    hideLoading: () => {
        elements.loadingSpinner.classList.add('d-none');
        appState.isLoading = false;
    },

    // Formatear fecha
    formatDate: (dateString) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // zona local
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Formatear hora
    formatTime: (timeString) => {
        return timeString.substring(0, 5); // HH:MM
    },

    // Mostrar notificación
    showNotification: (message, type = 'info') => {
        elements.systemAlert.className = `alert alert-${type} fade-in`;
        elements.systemMessage.textContent = message;
        elements.systemAlert.classList.remove('d-none');

        // Auto-ocultar después de 5 segundos para mensajes de éxito
        if (type === 'success') {
            setTimeout(() => {
                elements.systemAlert.classList.add('d-none');
            }, 5000);
        }
    },

    // Validar archivo de imagen
    validateImageFile: (file) => {
        const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, message: 'Tipo de archivo no permitido. Use PNG, JPG, JPEG o GIF.' };
        }

        if (file.size > maxSize) {
            return { valid: false, message: 'El archivo es demasiado grande. Máximo 5MB.' };
        }

        return { valid: true };
    }
};

// API calls
const api = {
    // Obtener estado del sistema
    getSystemStatus: async () => {
        try {
            const response = await fetch('/api/estado');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener estado del sistema:', error);
            throw error;
        }
    },

    // Registrar asistencia
    registerAttendance: async (formData) => {
        try {
            const response = await fetch('/api/registrar', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Error al registrar asistencia:', error);
            throw error;
        }
    }
};

// Funciones de UI
const ui = {
    // Actualizar información de la empresa y capacitación
    updateCompanyInfo: (config) => {
        if (config.nombre_empresa) {
            elements.nombreEmpresa.textContent = config.nombre_empresa;
        }

        if (config.direccion_empresa) {
            elements.direccionEmpresa.textContent = config.direccion_empresa;
        }

        if (config.telefono_empresa) {
            elements.telefonoEmpresa.textContent = config.telefono_empresa;
        }

        if (config.nombre_capacitacion) {
            elements.nombreCapacitacion.innerHTML = `<i class="fas fa-graduation-cap me-2"></i>${config.nombre_capacitacion}`;
        }

        if (config.empresa_capacitadora) {
            elements.empresaCapacitadora.textContent = config.empresa_capacitadora;
        }

        if (config.fecha_capacitacion) {
            elements.fechaCapacitacion.textContent = utils.formatDate(config.fecha_capacitacion);
        }

        if (config.hora_inicio && config.hora_fin) {
            elements.horarioCapacitacion.textContent = `${utils.formatTime(config.hora_inicio)} - ${utils.formatTime(config.hora_fin)}`;
        }

        // Logo (si existe)
        if (config.logo_empresa) {
            elements.logoEmpresa.src = config.logo_empresa;
        }
    },

    // Actualizar estado del sistema
    updateSystemStatus: (status, message) => {
        const statusIndicator = elements.statusText.parentElement;

        if (status) {
            elements.statusIcon.className = 'fas fa-circle me-1';
            elements.statusText.textContent = 'Sistema Activo';
            statusIndicator.className = 'status-indicator status-active';

            elements.registrationSection.classList.remove('d-none');
            elements.systemAlert.classList.add('d-none');
        } else {
            elements.statusIcon.className = 'fas fa-circle me-1';
            elements.statusText.textContent = 'Sistema Inactivo';
            statusIndicator.className = 'status-indicator status-inactive';

            elements.registrationSection.classList.add('d-none');
            utils.showNotification(message, 'warning');
        }
    },

    // Mostrar vista previa de imagen
    showImagePreview: (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.previewImg.src = e.target.result;
            elements.imagePreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    },

    // Mostrar sección de éxito
    showSuccessSection: (data) => {
        elements.registrationSection.classList.add('d-none');
        elements.successSection.classList.remove('d-none');
        elements.successSection.classList.add('fade-in');

        if (data.asistente && data.asistente.hora_llegada) {
            elements.horaRegistro.textContent = data.asistente.hora_llegada;
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Validar formulario
    validateForm: () => {
        const form = elements.registrationForm;
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
            }
        });

        return isValid;
    },

    // Limpiar validación del formulario
    clearFormValidation: () => {
        const inputs = elements.registrationForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
    }
};

// Manejadores de eventos
const eventHandlers = {
    // Manejar envío del formulario
    handleFormSubmit: async (e) => {
        e.preventDefault();

        if (appState.isLoading) return;

        // Validar formulario
        if (!ui.validateForm()) {
            utils.showNotification('Por favor complete todos los campos obligatorios.', 'danger');
            return;
        }

        // Verificar estado del sistema antes de enviar
        try {
            utils.showLoading();
            const statusData = await api.getSystemStatus();

            if (!statusData.disponible) {
                utils.hideLoading();
                utils.showNotification(statusData.mensaje, 'warning');
                ui.updateSystemStatus(false, statusData.mensaje);
                return;
            }
        } catch (error) {
            utils.hideLoading();
            utils.showNotification('Error al verificar el estado del sistema.', 'danger');
            return;
        }

        // Preparar datos del formulario
        const formData = new FormData();

        // Preparar datos del formulario
        const ciudadSeleccionada = elements.ciudad.value.trim();

        // Validar ciudad antes de enviar
        if (!ciudadSeleccionada) {
            alert("Por favor, selecciona una ciudad.");
            return; // Detiene el envío
        }

        formData.append('nombres_apellidos', elements.nombresApellidos.value.trim());
        formData.append('numero_documento', elements.numeroDocumento.value.trim());
        formData.append('cargo', elements.cargo.value.trim());
        formData.append('ruta', elements.ruta.value.trim());
        formData.append('ciudad', ciudadSeleccionada);


        // Agregar firma digital si existe
        if (elements.firmaDigital.files[0]) {
            formData.append('firma_digital', elements.firmaDigital.files[0]);
        }

        try {
            // Deshabilitar botón
            elements.submitBtn.disabled = true;
            elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Registrando...';

            const result = await api.registerAttendance(formData);

            utils.hideLoading();
            utils.showNotification(result.mensaje, 'success');
            ui.showSuccessSection(result);

        } catch (error) {
            utils.hideLoading();
            utils.showNotification(error.message, 'danger');

            // Re-habilitar botón
            elements.submitBtn.disabled = false;
            elements.submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Registrar Asistencia';
        }
    },

    // Manejar cambio de archivo de imagen
    handleImageChange: (e) => {
        const file = e.target.files[0];

        if (file) {
            const validation = utils.validateImageFile(file);

            if (!validation.valid) {
                utils.showNotification(validation.message, 'danger');
                e.target.value = '';
                elements.imagePreview.classList.add('d-none');
                return;
            }

            ui.showImagePreview(file);
        } else {
            elements.imagePreview.classList.add('d-none');
        }
    },

    // Manejar entrada en campos de texto
    handleInputChange: (e) => {
        const input = e.target;
        if (input.value.trim()) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        } else {
            input.classList.remove('is-valid');
        }
    }
};

// Funciones globales
window.removeImage = () => {
    elements.firmaDigital.value = '';
    elements.imagePreview.classList.add('d-none');
};

window.resetForm = () => {
    elements.registrationForm.reset();
    ui.clearFormValidation();
    elements.imagePreview.classList.add('d-none');
    elements.successSection.classList.add('d-none');
    elements.registrationSection.classList.remove('d-none');
    elements.submitBtn.disabled = false;
    elements.submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Registrar Asistencia';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Inicialización de la aplicación
const app = {
    // Cargar estado inicial
    loadInitialState: async () => {
        try {
            utils.showLoading();

            const statusData = await api.getSystemStatus();
            appState.systemStatus = statusData.disponible;
            appState.configuration = statusData.configuracion;

            // Actualizar UI
            ui.updateCompanyInfo(statusData.configuracion);
            ui.updateSystemStatus(statusData.disponible, statusData.mensaje);

            utils.hideLoading();

        } catch (error) {
            utils.hideLoading();
            console.error('Error al cargar estado inicial:', error);
            utils.showNotification('Error al conectar con el servidor. Por favor recargue la página.', 'danger');
        }
    },

    // Configurar event listeners
    setupEventListeners: () => {
        // Formulario
        elements.registrationForm.addEventListener('submit', eventHandlers.handleFormSubmit);

        // Archivo de imagen
        elements.firmaDigital.addEventListener('change', eventHandlers.handleImageChange);

        // Campos de entrada
        const textInputs = [elements.nombresApellidos, elements.numeroDocumento, elements.cargo, elements.ruta, elements.ciudad];
        textInputs.forEach(input => {
            input.addEventListener('input', eventHandlers.handleInputChange);
            input.addEventListener('blur', eventHandlers.handleInputChange);
        });

        // Verificar estado periódicamente (cada 30 segundos)
        setInterval(async () => {
            if (!appState.isLoading) {
                try {
                    const statusData = await api.getSystemStatus();
                    if (statusData.disponible !== appState.systemStatus) {
                        appState.systemStatus = statusData.disponible;
                        ui.updateSystemStatus(statusData.disponible, statusData.mensaje);
                    }
                } catch (error) {
                    console.error('Error en verificación periódica:', error);
                }
            }
        }, 30000);
    },

    // Inicializar aplicación
    init: () => {
        console.log('Inicializando aplicación...');
        app.setupEventListeners();
        app.loadInitialState();
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', app.init);

