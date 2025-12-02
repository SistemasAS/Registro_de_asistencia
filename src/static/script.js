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
    ciudadCapacitacion: document.getElementById('ciudadCapacitacion'),
    fechaCapacitacion: document.getElementById('fechaCapacitacion'),
    horarioCapacitacion: document.getElementById('horarioCapacitacion'),
    statusIcon: document.getElementById('statusIcon'),
    statusText: document.getElementById('statusText'),

    // Elementos del formulario
    nombresApellidos: document.getElementById('nombresApellidos'),
    tipodocumento: document.getElementById('tipodocumento'),
    numeroDocumento: document.getElementById('numeroDocumento'),
    cargo: document.getElementById('cargo'),
    ruta: document.getElementById('ruta'),
    firmaDigital: document.getElementById('firmaDigital'),
    imagePreview: document.getElementById('imagePreview'),
    previewImg: document.getElementById('previewImg'),
    ciudad: document.getElementById('ciudad'),

    // ELEMENTOS para la firma en canvas
    signatureCanvas: document.getElementById('signatureCanvas'),
    clearSignature: document.getElementById('clearSignature'),

    // Elementos de éxito
    successMessage: document.getElementById('successMessage'),
    horaRegistro: document.getElementById('horaRegistro')
};

// Utilidades
const utils = {
    showLoading: () => {
        elements.loadingSpinner.classList.remove('d-none');
        appState.isLoading = true;
    },

    hideLoading: () => {
        elements.loadingSpinner.classList.add('d-none');
        appState.isLoading = false;
    },

    formatDate: (dateString) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatTime: (timeString) => {
        return timeString.substring(0, 5);
    },

    showNotification: (message, type = 'info') => {
        elements.systemAlert.className = `alert alert-${type} fade-in`;
        elements.systemMessage.textContent = message;
        elements.systemAlert.classList.remove('d-none');

        if (type === 'success') {
            setTimeout(() => {
                elements.systemAlert.classList.add('d-none');
            }, 5000);
        }
    },

    validateImageFile: (file) => {
        const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
        const maxSize = 5 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, message: 'Tipo de archivo no permitido. Use PNG, JPG, JPEG o GIF.' };
        }

        if (file.size > maxSize) {
            return { valid: false, message: 'El archivo es demasiado grande. Máximo 5MB.' };
        }

        return { valid: true };
    }
};

// API
const api = {
    getSystemStatus: async () => {
        const response = await fetch('/api/estado');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    },

    registerAttendance: async (formData) => {
        const response = await fetch('/api/registrar', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);
        return data;
    }
};

// UI
const ui = {
    updateCompanyInfo: (config) => {
        // ✅ Si no hay configuración, limpiar campos
        if (!config) {
            console.warn('⚠️ No hay configuración disponible - limpiando campos');
            
            if (elements.nombreCapacitacion) {
                elements.nombreCapacitacion.innerHTML = '<i class="fas fa-graduation-cap me-2"></i>Sin capacitación programada';
            }
            if (elements.fechaCapacitacion) {
                elements.fechaCapacitacion.textContent = '-';
            }
            if (elements.horarioCapacitacion) {
                elements.horarioCapacitacion.textContent = '-';
            }
            if (elements.ciudadCapacitacion) {
                elements.ciudadCapacitacion.textContent = '-';
            }
            
            return;
        }

        // ✅ Si hay configuración, actualizar cada elemento
        if (config.nombre_empresa && elements.nombreEmpresa) {
            elements.nombreEmpresa.textContent = config.nombre_empresa;
        }
        if (config.direccion_empresa && elements.direccionEmpresa) {
            elements.direccionEmpresa.textContent = config.direccion_empresa;
        }
        if (config.telefono_empresa && elements.telefonoEmpresa) {
            elements.telefonoEmpresa.textContent = config.telefono_empresa;
        }
        if (config.nombre_capacitacion && elements.nombreCapacitacion) {
            elements.nombreCapacitacion.innerHTML = `<i class="fas fa-graduation-cap me-2"></i>${config.nombre_capacitacion}`;
        }
        if (config.ciudad_capacitacion && elements.ciudadCapacitacion) {
            elements.ciudadCapacitacion.textContent = config.ciudad_capacitacion;
        }
        if (config.fecha_capacitacion && elements.fechaCapacitacion) {
            elements.fechaCapacitacion.textContent = utils.formatDate(config.fecha_capacitacion);
        }
        if (config.hora_inicio && config.hora_fin && elements.horarioCapacitacion) {
            elements.horarioCapacitacion.textContent = `${utils.formatTime(config.hora_inicio)} - ${utils.formatTime(config.hora_fin)}`;
        }
        if (config.logo_empresa && elements.logoEmpresa) {
            elements.logoEmpresa.src = config.logo_empresa;
        }
    },

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

    showImagePreview: (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.previewImg.src = e.target.result;
            elements.imagePreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    },

    showSuccessSection: (data) => {
        elements.registrationSection.classList.add('d-none');
        elements.successSection.classList.remove('d-none');
        elements.successSection.classList.add('fade-in');
        if (data.asistente && data.asistente.hora_llegada)
            elements.horaRegistro.textContent = data.asistente.hora_llegada;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    validateForm: () => {
        const inputs = elements.registrationForm.querySelectorAll('input[required], select[required]');
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

    clearFormValidation: () => {
        const inputs = elements.registrationForm.querySelectorAll('input, select');
        inputs.forEach(input => input.classList.remove('is-invalid', 'is-valid'));
    }
};

// EVENT HANDLERS
const eventHandlers = {
    handleFormSubmit: async (e) => {
        e.preventDefault();
        if (appState.isLoading) return;
        
        // Validar formulario
        if (!ui.validateForm()) {
            utils.showNotification('Por favor complete todos los campos obligatorios.', 'danger');
            return;
        }

        // ✅ VALIDAR FIRMA
        if (window.validateSignature && !window.validateSignature()) {
            return;
        }

        try {
            utils.showLoading();
            const statusData = await api.getSystemStatus();

            if (!statusData.disponible) {
                utils.hideLoading();
                utils.showNotification(statusData.mensaje, 'warning');
                ui.updateSystemStatus(false, statusData.mensaje);
                return;
            }
        } catch {
            utils.hideLoading();
            utils.showNotification('Error al verificar el estado del sistema.', 'danger');
            return;
        }

        const formData = new FormData();
        const ciudadSeleccionada = elements.ciudad.value.trim();
        
        if (!ciudadSeleccionada) {
            utils.hideLoading();
            utils.showNotification("Por favor, selecciona una ciudad.", 'warning');
            return;
        }

        formData.append('nombres_apellidos', elements.nombresApellidos.value.trim());
        formData.append('tipodocumento', elements.tipodocumento.value.trim());
        formData.append('numero_documento', elements.numeroDocumento.value.trim());
        formData.append('cargo', elements.cargo.value.trim());
        formData.append('ruta', elements.ruta.value.trim());
        formData.append('ciudad', ciudadSeleccionada);

        // ✅ CAPTURAR Y ENVIAR FIRMA DEL CANVAS
        if (elements.signatureCanvas) {
            try {
                const signatureData = elements.signatureCanvas.toDataURL("image/png");
                formData.append('firma_digital', signatureData);
                console.log("✅ Firma capturada correctamente");
            } catch (error) {
                console.error("❌ Error al capturar firma:", error);
                utils.hideLoading();
                utils.showNotification('Error al procesar la firma. Intente nuevamente.', 'danger');
                return;
            }
        }

        try {
            elements.submitBtn.disabled = true;
            elements.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Registrando...';
            
            const result = await api.registerAttendance(formData);
            
            utils.hideLoading();
            utils.showNotification(result.mensaje, 'success');
            ui.showSuccessSection(result);
            
            // Limpiar canvas
            if (elements.signatureCanvas) {
                const ctx = elements.signatureCanvas.getContext("2d");
                ctx.clearRect(0, 0, elements.signatureCanvas.width, elements.signatureCanvas.height);
            }
            
        } catch (error) {
            utils.hideLoading();
            utils.showNotification(error.message, 'danger');
            elements.submitBtn.disabled = false;
            elements.submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Registrar Asistencia';
        }
    },

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

// FUNCIONES GLOBALES
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
    
    // Limpiar canvas de firma
    if (elements.signatureCanvas) {
        const ctx = elements.signatureCanvas.getContext("2d");
        ctx.clearRect(0, 0, elements.signatureCanvas.width, elements.signatureCanvas.height);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// APP
const app = {
    loadInitialState: async () => {
        try {
            utils.showLoading();
            const statusData = await api.getSystemStatus();
            
            console.log("📊 Datos recibidos del servidor:", statusData);
            
            // ✅ Validar que haya configuración
            if (!statusData.configuracion) {
                console.warn("⚠️ No hay configuración disponible");
                appState.systemStatus = false;
                appState.configuration = null;
                ui.updateCompanyInfo(null); // ✅ Llamar con null para limpiar campos
                ui.updateSystemStatus(false, statusData.mensaje || 'No hay capacitaciones programadas para hoy');
                utils.hideLoading();
                return;
            }
            
            appState.systemStatus = statusData.disponible;
            appState.configuration = statusData.configuracion;
            
            // ✅ Solo actualizar la UI si hay configuración válida
            ui.updateCompanyInfo(statusData.configuracion);
            ui.updateSystemStatus(statusData.disponible, statusData.mensaje);
            utils.hideLoading();
        } catch (error) {
            utils.hideLoading();
            console.error('❌ Error al cargar estado inicial:', error);
            
            // ✅ Mostrar error pero no romper la aplicación
            appState.systemStatus = false;
            appState.configuration = null;
            ui.updateCompanyInfo(null); // ✅ Limpiar campos en caso de error
            ui.updateSystemStatus(false, 'Error al conectar con el servidor');
            utils.showNotification('Error al conectar con el servidor. Por favor recargue la página.', 'danger');
        }
    },

    setupEventListeners: () => {
        elements.registrationForm.addEventListener('submit', eventHandlers.handleFormSubmit);
        if (elements.firmaDigital) elements.firmaDigital.addEventListener('change', eventHandlers.handleImageChange);

        const textInputs = [elements.nombresApellidos, elements.tipodocumento, elements.numeroDocumento, elements.cargo, elements.ruta, elements.ciudad];
        textInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', eventHandlers.handleInputChange);
                input.addEventListener('blur', eventHandlers.handleInputChange);
            }
        });

        // ✅ Verificación periódica del estado (cada 30 segundos)
        setInterval(async () => {
            if (!appState.isLoading) {
                try {
                    const statusData = await api.getSystemStatus();
                    
                    // ✅ Verificar si hay configuración antes de comparar
                    if (!statusData.configuracion) {
                        if (appState.systemStatus !== false) {
                            appState.systemStatus = false;
                            appState.configuration = null;
                            ui.updateCompanyInfo(null); // ✅ Limpiar campos
                            ui.updateSystemStatus(false, statusData.mensaje || 'No hay capacitaciones programadas');
                        }
                        return;
                    }
                    
                    // ✅ Si el estado cambió, actualizar
                    if (statusData.disponible !== appState.systemStatus) {
                        appState.systemStatus = statusData.disponible;
                        appState.configuration = statusData.configuracion;
                        ui.updateSystemStatus(statusData.disponible, statusData.mensaje);
                        
                        // Si cambió la configuración, actualizar la info
                        if (statusData.configuracion) {
                            ui.updateCompanyInfo(statusData.configuracion);
                        }
                    }
                } catch (error) {
                    console.error('Error en verificación periódica:', error);
                    // ✅ No mostrar errores en verificaciones periódicas para no molestar al usuario
                }
            }
        }, 30000);
    },

    init: () => {
        console.log('🚀 Inicializando aplicación...');
        app.setupEventListeners();
        app.loadInitialState();

        // ======================================================
        // 🎨 FIRMA DIGITAL (CANVAS) - OPTIMIZADO PARA MÓVILES
        // ======================================================
        if (elements.signatureCanvas) {
            const canvas = elements.signatureCanvas;
            const ctx = canvas.getContext("2d");
            let drawing = false;
            let hasDrawn = false;
            let lastImageData = null;
            
            function resizeCanvas() {
                const rect = canvas.getBoundingClientRect();
                
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                tempCtx.drawImage(canvas, 0, 0);
                
                canvas.width = rect.width;
                canvas.height = rect.height;
                
                if (hasDrawn) {
                    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 
                                 0, 0, canvas.width, canvas.height);
                }
                
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.strokeStyle = "#000";
            }
            
            resizeCanvas();
            
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(resizeCanvas, 100);
            });
            
            function getCoordinates(e) {
                const rect = canvas.getBoundingClientRect();
                let x, y;
                
                if (e.touches && e.touches.length > 0) {
                    x = e.touches[0].clientX - rect.left;
                    y = e.touches[0].clientY - rect.top;
                } else {
                    x = e.clientX - rect.left;
                    y = e.clientY - rect.top;
                }
                
                return { x, y };
            }
            
            function startDrawing(e) {
                const coords = getCoordinates(e);
                const rect = canvas.getBoundingClientRect();
                
                if (coords.x < 0 || coords.x > rect.width || coords.y < 0 || coords.y > rect.height) {
                    return;
                }
                
                e.preventDefault(); 
                drawing = true;
                hasDrawn = true;
                
                ctx.beginPath();
                ctx.moveTo(coords.x, coords.y);
                ctx.lineTo(coords.x, coords.y);
                ctx.stroke();
            }
            
            function draw(e) {
                if (!drawing) return;
                e.preventDefault();
                
                const coords = getCoordinates(e);
                ctx.lineTo(coords.x, coords.y);
                ctx.stroke();
            }
            
            function stopDrawing(e) {
                if (drawing) {
                    e.preventDefault();
                    drawing = false;
                    ctx.beginPath();
                    lastImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                }
            }
            
            canvas.addEventListener("mousedown", startDrawing);
            canvas.addEventListener("mousemove", draw);
            canvas.addEventListener("mouseup", stopDrawing);
            canvas.addEventListener("mouseleave", stopDrawing);
            
            canvas.addEventListener("touchstart", startDrawing, { passive: false });
            canvas.addEventListener("touchmove", draw, { passive: false });
            canvas.addEventListener("touchend", stopDrawing, { passive: false });
            canvas.addEventListener("touchcancel", stopDrawing, { passive: false });
            
            if (elements.clearSignature) {
                elements.clearSignature.addEventListener("click", () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    hasDrawn = false;
                    lastImageData = null;
                    const errorDiv = document.getElementById('signatureError');
                    if (errorDiv) {
                        errorDiv.style.display = 'none';
                    }
                });
            }
            
            window.validateSignature = function() {
                if (!hasDrawn) {
                    const errorDiv = document.getElementById('signatureError');
                    if (errorDiv) {
                        errorDiv.style.display = 'block';
                    }
                    utils.showNotification('Por favor firme en el recuadro antes de continuar.', 'warning');
                    canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }
                return true;
            };
            
            console.log("✅ Canvas de firma inicializado correctamente");
        }
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', app.init);