// Estado global
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
    capacitadorForm: document.getElementById('capacitadorForm'),
    submitBtn: document.getElementById('submitBtn'),
    
    nombreEmpresa: document.getElementById('nombreEmpresa'),
    direccionEmpresa: document.getElementById('direccionEmpresa'),
    telefonoEmpresa: document.getElementById('telefonoEmpresa'),
    logoEmpresa: document.getElementById('logoEmpresa'),
    nombreCapacitacion: document.getElementById('nombreCapacitacion'),
    fechaCapacitacion: document.getElementById('fechaCapacitacion'),
    statusIcon: document.getElementById('statusIcon'),
    statusText: document.getElementById('statusText'),
    
    nombreCompleto: document.getElementById('nombreCompleto'),
    cargoCapacitador: document.getElementById('cargoCapacitador'),
    signatureCanvas: document.getElementById('signatureCanvas'),
    clearSignature: document.getElementById('clearSignature'),
    
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
    
    showNotification: (message, type = 'info') => {
        elements.systemAlert.className = `alert alert-${type} fade-in`;
        elements.systemMessage.textContent = message;
        elements.systemAlert.classList.remove('d-none');
        
        if (type === 'success') {
            setTimeout(() => {
                elements.systemAlert.classList.add('d-none');
            }, 5000);
        }
    }
};

// API
const api = {
    getSystemStatus: async () => {
        const response = await fetch('/api/estado');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    },
    
    registerCapacitador: async (formData) => {
        const response = await fetch('/api/capacitador/registrar', {
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
        if (config.nombre_empresa) elements.nombreEmpresa.textContent = config.nombre_empresa;
        if (config.direccion_empresa) elements.direccionEmpresa.textContent = config.direccion_empresa;
        if (config.telefono_empresa) elements.telefonoEmpresa.textContent = config.telefono_empresa;
        if (config.nombre_capacitacion)
            elements.nombreCapacitacion.innerHTML = `<i class="fas fa-chalkboard-teacher me-2"></i>${config.nombre_capacitacion}`;
        if (config.fecha_capacitacion)
            elements.fechaCapacitacion.textContent = utils.formatDate(config.fecha_capacitacion);
        if (config.logo_empresa) elements.logoEmpresa.src = config.logo_empresa;
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
    
    showSuccessSection: (data) => {
        elements.registrationSection.classList.add('d-none');
        elements.successSection.classList.remove('d-none');
        elements.successSection.classList.add('fade-in');
        if (data.capacitador && data.capacitador.hora_registro)
            elements.horaRegistro.textContent = data.capacitador.hora_registro;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    validateForm: () => {
        const inputs = elements.capacitadorForm.querySelectorAll('input[required]');
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
    }
};

// Event Handlers
const eventHandlers = {
    handleFormSubmit: async (e) => {
        e.preventDefault();
        if (appState.isLoading) return;
        
        if (!ui.validateForm()) {
            utils.showNotification('Por favor complete todos los campos obligatorios.', 'danger');
            return;
        }
        
        // Validar firma
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
        formData.append('nombre_completo', elements.nombreCompleto.value.trim());
        
        // Capturar firma del canvas
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
            
            const result = await api.registerCapacitador(formData);
            
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
            elements.submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Registrar Información';
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

// App
const app = {
    loadInitialState: async () => {
        try {
            utils.showLoading();
            const statusData = await api.getSystemStatus();
            appState.systemStatus = statusData.disponible;
            appState.configuration = statusData.configuracion;
            ui.updateCompanyInfo(statusData.configuracion);
            ui.updateSystemStatus(statusData.disponible, statusData.mensaje);
            utils.hideLoading();
        } catch (error) {
            utils.hideLoading();
            console.error('Error al cargar estado inicial:', error);
            utils.showNotification('Error al conectar con el servidor. Por favor recargue la página.', 'danger');
        }
    },
    
    setupEventListeners: () => {
        elements.capacitadorForm.addEventListener('submit', eventHandlers.handleFormSubmit);
        
        const textInputs = [elements.nombreCompleto, elements.cargoCapacitador];
        textInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', eventHandlers.handleInputChange);
                input.addEventListener('blur', eventHandlers.handleInputChange);
            }
        });
    },
    
    init: () => {
        console.log('Inicializando formulario de capacitador...');
        app.setupEventListeners();
        app.loadInitialState();
        
        // Inicializar canvas de firma
        if (elements.signatureCanvas) {
            const canvas = elements.signatureCanvas;
            const ctx = canvas.getContext("2d");
            let drawing = false;
            let hasDrawn = false;
            
            function resizeCanvas() {
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.strokeStyle = "#000";
            }
            
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
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
                e.preventDefault();
                drawing = true;
                hasDrawn = true;
                
                const coords = getCoordinates(e);
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

document.addEventListener('DOMContentLoaded', app.init);