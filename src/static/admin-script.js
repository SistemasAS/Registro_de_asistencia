// Estado global del admin
let adminState = {
    isAuthenticated: false,
    adminData: null,
    currentTab: 'dashboard',
    asistentesData: [],
    configData: null,
    dashboardData: null
};

// Elementos del DOM
const adminElements = {
    // Login
    loginSection: document.getElementById('loginSection'),
    adminDashboard: document.getElementById('adminDashboard'),
    loginForm: document.getElementById('loginForm'),
    loginBtn: document.getElementById('loginBtn'),
    loginError: document.getElementById('loginError'),
    usuario: document.getElementById('usuario'),
    password: document.getElementById('password'),
    
    // Navigation
    adminUsername: document.getElementById('adminUsername'),
    
    // Loading
    loadingSpinner: document.getElementById('loadingSpinner'),
    
    // Dashboard Stats
    totalAsistentes: document.getElementById('totalAsistentes'),
    sistemaEstado: document.getElementById('sistemaEstado'),
    totalCargos: document.getElementById('totalCargos'),
    totalRutas: document.getElementById('totalRutas'),
    cargoChart: document.getElementById('cargoChart'),
    rutaChart: document.getElementById('rutaChart'),
    
    // Asistentes
    fechaFiltro: document.getElementById('fechaFiltro'),
    busquedaAsistente: document.getElementById('busquedaAsistente'),
    filtroCargoAsistente: document.getElementById('filtroCargoAsistente'),
    filtroRutaAsistente: document.getElementById('filtroRutaAsistente'),
    tablaAsistentes: document.getElementById('tablaAsistentes'),
    
    // Configuración
    configForm: document.getElementById('configForm'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    configNombreCapacitacion: document.getElementById('configNombreCapacitacion'),
    configCiudadCapacitacion: document.getElementById('configCiudadCapacitacion'),
    configFechaCapacitacion: document.getElementById('configFechaCapacitacion'),
    configHoraInicio: document.getElementById('configHoraInicio'),
    configHoraFin: document.getElementById('configHoraFin'),
    configNombreInstructor: document.getElementById('configNombreInstructor'),
    configCargoInstructor: document.getElementById('configCargoInstructor'),
    configAsesorExterno: document.getElementById('configAsesorExterno'),
    configFirmaDigital: document.getElementById('configFirmaDigital'),
    imagePreview: document.getElementById('imagePreview'),
    previewImg: document.getElementById('previewImg'),
    configNombreEmpresa: document.getElementById('configNombreEmpresa'),
    configDireccionEmpresa: document.getElementById('configDireccionEmpresa'),
    configTelefonoEmpresa: document.getElementById('configTelefonoEmpresa'),
    configActivo: document.getElementById('configActivo'),
    estadoActualInfo: document.getElementById('estadoActualInfo')
};

// Utilidades
const adminUtils = {
    showLoading: () => {
        adminElements.loadingSpinner.classList.remove('d-none');
    },
    
    hideLoading: () => {
        adminElements.loadingSpinner.classList.add('d-none');
    },
    
    showError: (message) => {
        adminElements.loginError.textContent = message;
        adminElements.loginError.classList.remove('d-none');
    },
    
    hideError: () => {
        adminElements.loginError.classList.add('d-none');
    },
    
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    },
    
    formatTime: (timeString) => {
        return timeString.substring(0, 5);
    },
    
    showNotification: (message, type = 'success') => {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
};

// API calls para admin
const adminApi = {
    login: async (usuario, password) => {
        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error de autenticación');
        }
        
        return await response.json();
    },
    
    logout: async () => {
        const response = await fetch('/admin/logout', {
            method: 'POST'
        });
        return response.ok;
    },
    
    verificarSesion: async () => {
        const response = await fetch('/admin/verificar-sesion');
        if (response.ok) {
            return await response.json();
        }
        return null;
    },
    
    obtenerConfiguracion: async () => {
        const response = await fetch('/admin/configuracion');
        if (!response.ok) {
            throw new Error('Error al obtener configuración');
        }
        return await response.json();
    },
    
    actualizarConfiguracion: async (configData) => {
        const response = await fetch('/admin/configuracion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar configuración');
        }
        
        return await response.json();
    },
    
    obtenerAsistentes: async (filtros = {}) => {
        const params = new URLSearchParams(filtros);
        const response = await fetch(`/admin/asistentes?${params}`);
        
        if (!response.ok) {
            throw new Error('Error al obtener asistentes');
        }
        
        return await response.json();
    },
    
    obtenerDashboard: async () => {
        const response = await fetch('/admin/dashboard');
        
        if (!response.ok) {
            throw new Error('Error al obtener datos del dashboard');
        }
        
        return await response.json();
    },
    
    generarPDF: async (fecha) => {
        const response = await fetch(`/admin/generar-pdf?fecha=${fecha}`);
        
        if (!response.ok) {
            throw new Error('Error al generar PDF');
        }
        
        // Descargar archivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lista_asistencia_${fecha}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
};



// Funciones de UI para admin
const adminUI = {
    showLoginSection: () => {
        adminElements.loginSection.classList.remove('d-none');
        adminElements.adminDashboard.classList.add('d-none');
    },
    
    showDashboard: () => {
        adminElements.loginSection.classList.add('d-none');
        adminElements.adminDashboard.classList.remove('d-none');
        adminElements.adminDashboard.classList.add('fade-in');
    },
    
    updateDashboardStats: (data) => {
        adminElements.totalAsistentes.textContent = data.asistentes_hoy || 0;
        adminElements.sistemaEstado.textContent = data.sistema_activo ? 'Activo' : 'Inactivo';
        adminElements.totalCargos.textContent = Object.keys(data.por_cargo || {}).length;
        adminElements.totalRutas.textContent = Object.keys(data.por_ruta || {}).length;
        
        // Actualizar gráficos
        adminUI.updateCharts(data);
    },
    
    updateCharts: (data) => {
        // Gráfico de cargos
        if (data.por_cargo && Object.keys(data.por_cargo).length > 0) {
            let cargoHtml = '<div class="chart-data">';
            for (const [cargo, cantidad] of Object.entries(data.por_cargo)) {
                const percentage = (cantidad / data.asistentes_hoy) * 100;
                cargoHtml += `
                    <div class="chart-item mb-2">
                        <div class="d-flex justify-content-between">
                            <span>${cargo}</span>
                            <span>${cantidad}</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-primary" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }
            cargoHtml += '</div>';
            adminElements.cargoChart.innerHTML = cargoHtml;
        }
        
        // Gráfico de rutas
        if (data.por_ruta && Object.keys(data.por_ruta).length > 0) {
            let rutaHtml = '<div class="chart-data">';
            for (const [ruta, cantidad] of Object.entries(data.por_ruta)) {
                const percentage = (cantidad / data.asistentes_hoy) * 100;
                rutaHtml += `
                    <div class="chart-item mb-2">
                        <div class="d-flex justify-content-between">
                            <span>${ruta}</span>
                            <span>${cantidad}</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-info" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }
            rutaHtml += '</div>';
            adminElements.rutaChart.innerHTML = rutaHtml;
        }
    },
    
    updateAsistentesTable: (data) => {
        if (!data.asistentes || data.asistentes.length === 0) {
            adminElements.tablaAsistentes.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No hay asistentes registrados</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        data.asistentes.forEach((asistente, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${asistente.nombres_apellidos}</td>
                    <td>${asistente.numero_documento}</td>
                    <td>${asistente.cargo}</td>
                    <td>${asistente.ruta}</td>
                    <td>${asistente.ciudad}</td>
                    <td>
                        ${asistente.firma_digital ? 
                            '<i class="fas fa-check text-success" title="Tiene firma"></i>' : 
                            '<i class="fas fa-times text-muted" title="Sin firma"></i>'
                        }
                    </td>
                </tr>
            `;
        });
        
        adminElements.tablaAsistentes.innerHTML = html;
        
        // Actualizar filtros
        adminUI.updateFilters(data);
    },
    
    updateFilters: (data) => {
        // Obtener cargos únicos
        const cargos = [...new Set(data.asistentes.map(a => a.cargo))];
        adminElements.filtroCargoAsistente.innerHTML = '<option value="">Todos los cargos</option>';
        cargos.forEach(cargo => {
            adminElements.filtroCargoAsistente.innerHTML += `<option value="${cargo}">${cargo}</option>`;
        });
        
        // Obtener rutas únicas
        const rutas = [...new Set(data.asistentes.map(a => a.ruta))];
        adminElements.filtroRutaAsistente.innerHTML = '<option value="">Todas las rutas</option>';
        rutas.forEach(ruta => {
            adminElements.filtroRutaAsistente.innerHTML += `<option value="${ruta}">${ruta}</option>`;
        });
    },
    
    loadConfigurationForm: (config) => {
        adminElements.configNombreCapacitacion.value = config.nombre_capacitacion || '';
        adminElements.configCiudadCapacitacion.value = config.ciudad_capacitacion || '';
        adminElements.configFechaCapacitacion.value = config.fecha_capacitacion || '';
        adminElements.configHoraInicio.value = config.hora_inicio || '';
        adminElements.configHoraFin.value = config.hora_fin || '';
        adminElements.configNombreInstructor.value = config.nombre_instructor || '';
        adminElements.configCargoInstructor.value = config.cargo_instructor || '';
        adminElements.configAsesorExterno.value = config.asesor_externo || '';
        adminElements.configFirmaDigital.value = config.firma_digital_cap || '';
        adminElements.configNombreEmpresa.value = config.nombre_empresa || '';
        adminElements.configDireccionEmpresa.value = config.direccion_empresa || '';
        adminElements.configTelefonoEmpresa.value = config.telefono_empresa || '';
        adminElements.configActivo.checked = config.activo || false;
        
        // Actualizar estado actual
        const estado = config.activo ? 'Sistema Activo' : 'Sistema Inactivo';
        adminElements.estadoActualInfo.innerHTML = `
            <span class="badge bg-${config.activo ? 'success' : 'danger'}">${estado}</span>
        `;
    }
};

// Manejadores de eventos para admin
const adminEventHandlers = {
    handleLogin: async (e) => {
        e.preventDefault();
        
        const usuario = adminElements.usuario.value.trim();
        const password = adminElements.password.value.trim();
        
        if (!usuario || !password) {
            adminUtils.showError('Por favor ingrese usuario y contraseña');
            return;
        }
        
        try {
            adminUtils.showLoading();
            adminUtils.hideError();
            
            adminElements.loginBtn.disabled = true;
            adminElements.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';
            
            const result = await adminApi.login(usuario, password);
            
            adminState.isAuthenticated = true;
            adminState.adminData = result.admin;
            
            adminElements.adminUsername.textContent = result.admin.usuario;
            
            adminUtils.hideLoading();
            adminUI.showDashboard();
            
            // Cargar datos iniciales
            await adminApp.loadInitialData();
            
        } catch (error) {
            adminUtils.hideLoading();
            adminUtils.showError(error.message);
            
            adminElements.loginBtn.disabled = false;
            adminElements.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
        }
    },
    
    handleConfigSubmit: async (e) => {
        e.preventDefault();
        
        const configData = {
            nombre_capacitacion: adminElements.configNombreCapacitacion.value,
            ciudad_capacitacion: adminElements.configCiudadCapacitacion.value,
            fecha_capacitacion: adminElements.configFechaCapacitacion.value,
            hora_inicio: adminElements.configHoraInicio.value,
            hora_fin: adminElements.configHoraFin.value,
            nombre_instructor: adminElements.configNombreInstructor.value,
            cargo_instructor: adminElements.configCargoInstructor.value,
            asesor_externo: adminElements.configAsesorExterno.value,
            nombre_empresa: adminElements.configNombreEmpresa.value,
            direccion_empresa: adminElements.configDireccionEmpresa.value,
            telefono_empresa: adminElements.configTelefonoEmpresa.value,
            activo: adminElements.configActivo.checked
        };

        
        try {
            adminUtils.showLoading();
            
            adminElements.saveConfigBtn.disabled = true;
            adminElements.saveConfigBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            
            await adminApi.actualizarConfiguracion(configData);
            
            adminUtils.hideLoading();
            adminUtils.showNotification('Configuración actualizada exitosamente');
            
            // Recargar configuración
            await adminApp.loadConfiguration();
            
        } catch (error) {
            adminUtils.hideLoading();
            adminUtils.showNotification(error.message, 'danger');
        } finally {
            adminElements.saveConfigBtn.disabled = false;
            adminElements.saveConfigBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Configuración';
        }
    }
};

// Funciones globales para admin
window.logout = async () => {
    try {
        await adminApi.logout();
        adminState.isAuthenticated = false;
        adminState.adminData = null;
        adminUI.showLoginSection();
        
        // Limpiar formulario
        adminElements.loginForm.reset();
        adminUtils.hideError();
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
};

window.filtrarAsistentes = async () => {
    const filtros = {
        fecha: adminElements.fechaFiltro.value,
        busqueda: adminElements.busquedaAsistente.value,
        cargo: adminElements.filtroCargoAsistente.value,
        ruta: adminElements.filtroRutaAsistente.value
    };
    
    try {
        adminUtils.showLoading();
        const data = await adminApi.obtenerAsistentes(filtros);
        adminUI.updateAsistentesTable(data);
        adminUtils.hideLoading();
    } catch (error) {
        adminUtils.hideLoading();
        adminUtils.showNotification(error.message, 'danger');
    }
};

window.generarPDF = async () => {
    const fecha = adminElements.fechaFiltro.value;
    
    try {
        adminUtils.showLoading();
        await adminApi.generarPDF(fecha);
        adminUtils.hideLoading();
        adminUtils.showNotification('PDF generado y descargado exitosamente');
    } catch (error) {
        adminUtils.hideLoading();
        adminUtils.showNotification(error.message, 'danger');
    }
};

// Aplicación principal de admin
const adminApp = {
    loadInitialData: async () => {
        try {
            // Cargar dashboard
            await adminApp.loadDashboard();
            
            // Cargar asistentes
            await adminApp.loadAsistentes();
            
            // Cargar configuración
            await adminApp.loadConfiguration();
            
        } catch (error) {
            console.error('Error al cargar datos iniciales:', error);
            adminUtils.showNotification('Error al cargar algunos datos', 'warning');
        }
    },
    
    loadDashboard: async () => {
        try {
            const data = await adminApi.obtenerDashboard();
            adminState.dashboardData = data;
            adminUI.updateDashboardStats(data);
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
        }
    },
    
    loadAsistentes: async () => {
        try {
            const fecha = new Date().toISOString().split('T')[0];
            adminElements.fechaFiltro.value = fecha;
            
            const data = await adminApi.obtenerAsistentes({ fecha });
            adminState.asistentesData = data;
            adminUI.updateAsistentesTable(data);
        } catch (error) {
            console.error('Error al cargar asistentes:', error);
        }
    },
    
    loadConfiguration: async () => {
        try {
            const config = await adminApi.obtenerConfiguracion();
            adminState.configData = config;
            adminUI.loadConfigurationForm(config);
        } catch (error) {
            console.error('Error al cargar configuración:', error);
        }
    },
    
    setupEventListeners: () => {
        // Login
        adminElements.loginForm.addEventListener('submit', adminEventHandlers.handleLogin);
        
        // Configuración
        adminElements.configForm.addEventListener('submit', adminEventHandlers.handleConfigSubmit);
        
        // Filtro de fecha
        adminElements.fechaFiltro.addEventListener('change', filtrarAsistentes);
        
        // Tabs
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const target = e.target.getAttribute('data-bs-target');
                if (target === '#asistentes') {
                    adminApp.loadAsistentes();
                } else if (target === '#dashboard') {
                    adminApp.loadDashboard();
                }
            });
        });
    },
    
    checkAuthentication: async () => {
        try {
            const sessionData = await adminApi.verificarSesion();
            
            if (sessionData && sessionData.autenticado) {
                adminState.isAuthenticated = true;
                adminState.adminData = sessionData.admin;
                adminElements.adminUsername.textContent = sessionData.admin.usuario;
                
                adminUI.showDashboard();
                await adminApp.loadInitialData();
            } else {
                adminUI.showLoginSection();
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            adminUI.showLoginSection();
        }
    },
    
    init: () => {
        console.log('Inicializando panel de administración...');
        adminApp.setupEventListeners();
        adminApp.checkAuthentication();
    }
};


document.getElementById("configFirmaDigital").addEventListener("change", async function () {
    const fileInput = this;
    if (fileInput.files.length > 0) {
        let formData = new FormData();
        formData.append("configFirmaDigital", fileInput.files[0]);

        try {
            let res = await fetch("/admin/subir_firma", {
                method: "POST",
                body: formData
            });
            let data = await res.json();
            if (res.ok) {
                console.log("✅ Firma guardada en:", data.url);
                document.getElementById("previewImg").src = data.url;
                document.getElementById("imagePreview").classList.remove("d-none");
            } else {
                console.error("❌ Error:", data.error);
            }
        } catch (err) {
            console.error("Error al subir la firma:", err);
        }
    }
});



// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', adminApp.init);

