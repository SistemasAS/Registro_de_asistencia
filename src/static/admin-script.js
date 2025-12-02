// Estado global del admin
let adminState = {
    capacitacionesData: {},
    isAuthenticated: false,
    adminData: null,
    currentTab: 'dashboard',
    asistentesData: [],
    configData: null,
    dashboardData: null
};

// ✅ FUNCIÓN ACTUALIZADA - Ahora acepta fecha
async function cargarCapacitaciones(fecha = null) {
    try {
        // Si no se pasa fecha, usar la del filtro o la de hoy
        if (!fecha) {
            fecha = adminElements.fechaFiltro?.value || new Date().toISOString().split('T')[0];
        }

        const response = await fetch(`/admin/configuraciones/listar?fecha=${fecha}`);
        const data = await response.json();

        const select = document.getElementById('filtroCapacitacion');
        if (!select) return;

        // Limpiar select
        select.innerHTML = '<option value="">Todas las capacitaciones</option>';
        adminState.capacitacionesData = {}; // Limpiar también el estado

        if (data.configuraciones && data.configuraciones.length > 0) {
            data.configuraciones.forEach(config => {
                // ✅ Guardar en adminState
                adminState.capacitacionesData[config.id] = config.nombre_capacitacion;

                const option = document.createElement('option');
                option.value = config.id;
                option.textContent = `${config.nombre_capacitacion} - ${config.hora_inicio} a ${config.hora_fin}`;
                select.appendChild(option);
            });

            console.log(`✅ ${data.configuraciones.length} capacitaciones cargadas para ${fecha}`);
        } else {
            console.log(`⚠️ No hay capacitaciones para ${fecha}`);
            // Agregar opción indicando que no hay capacitaciones
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No hay capacitaciones para esta fecha';
            option.disabled = true;
            select.appendChild(option);
        }
    } catch (error) {
        console.error('Error al cargar capacitaciones:', error);
    }
}

// Función para obtener elementos del DOM de forma segura
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`⚠️ Elemento no encontrado: ${id}`);
    }
    return element;
}

// Elementos del DOM con getters para cargar dinámicamente
const adminElements = {
    // Login
    get loginSection() { return getElement('loginSection'); },
    get adminDashboard() { return getElement('adminDashboard'); },
    get loginForm() { return getElement('loginForm'); },
    get loginBtn() { return getElement('loginBtn'); },
    get loginError() { return getElement('loginError'); },
    get usuario() { return getElement('usuario'); },
    get password() { return getElement('password'); },

    // Navigation
    get adminUsername() { return getElement('adminUsername'); },

    // Loading
    get loadingSpinner() { return getElement('loadingSpinner'); },

    // Dashboard Stats
    get totalAsistentes() { return getElement('totalAsistentes'); },
    get sistemaEstado() { return getElement('sistemaEstado'); },
    get totalCargos() { return getElement('totalCargos'); },
    get cargoChart() { return getElement('cargoChart'); },

    // Asistentes
    get fechaFiltro() { return getElement('fechaFiltro'); },
    get busquedaAsistente() { return getElement('busquedaAsistente'); },
    get filtroCargoAsistente() { return getElement('filtroCargoAsistente'); },
    get filtroRutaAsistente() { return getElement('filtroRutaAsistente'); },
    get tablaAsistentes() { return getElement('tablaAsistentes'); },

    // Configuración
    get configForm() { return getElement('configForm'); },
    get saveConfigBtn() { return getElement('saveConfigBtn'); },
    get configNombreCapacitacion() { return getElement('configNombreCapacitacion'); },
    get configCiudadCapacitacion() { return getElement('configCiudadCapacitacion'); },
    get configModalidadCapacitacion() { return getElement('configModalidadCapacitacion'); },
    get configFechaCapacitacion() { return getElement('configFechaCapacitacion'); },
    get configHoraInicio() { return getElement('configHoraInicio'); },
    get configHoraFin() { return getElement('configHoraFin'); },
    get configAsesorExterno() { return getElement('configAsesorExterno'); },
    get configNombreEmpresa() { return getElement('configNombreEmpresa'); },
    get configDireccionEmpresa() { return getElement('configDireccionEmpresa'); },
    get configTelefonoEmpresa() { return getElement('configTelefonoEmpresa'); },
    get configActivo() { return getElement('configActivo'); }
};

// Utilidades
const adminUtils = {
    showLoading: () => {
        if (adminElements.loadingSpinner) {
            adminElements.loadingSpinner.classList.remove('d-none');
        }
    },

    hideLoading: () => {
        if (adminElements.loadingSpinner) {
            adminElements.loadingSpinner.classList.add('d-none');
        }
    },

    showError: (message) => {
        if (adminElements.loginError) {
            adminElements.loginError.textContent = message;
            adminElements.loginError.classList.remove('d-none');
        }
    },

    hideError: () => {
        if (adminElements.loginError) {
            adminElements.loginError.classList.add('d-none');
        }
    },

    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    },

    formatTime: (timeString) => {
        return timeString.substring(0, 5);
    },

    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
            ${message}
        `;

        document.body.appendChild(notification);

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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al generar PDF');
        }

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
        if (adminElements.loginSection) adminElements.loginSection.classList.remove('d-none');
        if (adminElements.adminDashboard) adminElements.adminDashboard.classList.add('d-none');
    },

    showDashboard: () => {
        if (adminElements.loginSection) adminElements.loginSection.classList.add('d-none');
        if (adminElements.adminDashboard) {
            adminElements.adminDashboard.classList.remove('d-none');
            adminElements.adminDashboard.classList.add('fade-in');
        }
    },

    updateDashboardStats: (data) => {
        if (adminElements.totalAsistentes) {
            adminElements.totalAsistentes.textContent = data.asistentes_hoy || 0;
        }
        if (adminElements.sistemaEstado) {
            adminElements.sistemaEstado.textContent = data.sistema_activo ? 'Activo' : 'Inactivo';
        }
        if (adminElements.totalCargos) {
            adminElements.totalCargos.textContent = Object.keys(data.por_cargo || {}).length;
        }

        adminUI.updateCharts(data);
    },

    updateCharts: (data) => {
        if (!adminElements.cargoChart) return;

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
        } else {
            adminElements.cargoChart.innerHTML = '<p class="text-muted">No hay datos disponibles</p>';
        }
    },

    updateAsistentesTable: (data) => {
        if (!adminElements.tablaAsistentes) return;

        if (!data.asistentes || data.asistentes.length === 0) {
            adminElements.tablaAsistentes.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">No hay asistentes registrados</td>
            </tr>
        `;
            return;
        }

        let html = '';
        data.asistentes.forEach((asistente, index) => {
            const nombreCapacitacion = asistente.nombre_capacitacion ||
                adminState.capacitacionesData[asistente.configuracion_id] ||
                'Sin capacitación';

            html += `
            <tr>
                <td>${index + 1}</td>
                <td>${asistente.nombres_apellidos}</td>
                <td>${asistente.tipodocumento}</td>
                <td>${asistente.numero_documento}</td>
                <td>${asistente.cargo}</td>
                <td>${asistente.ruta}</td>
                <td>${asistente.ciudad}</td>
                <td>
                    <span class="badge bg-primary">${nombreCapacitacion}</span>
                </td>
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
        adminUI.updateFilters(data);
    },

    updateFilters: (data) => {
        if (adminElements.filtroCargoAsistente) {
            const cargos = [...new Set(data.asistentes.map(a => a.cargo))];
            adminElements.filtroCargoAsistente.innerHTML = '<option value="">Todos los cargos</option>';
            cargos.forEach(cargo => {
                adminElements.filtroCargoAsistente.innerHTML += `<option value="${cargo}">${cargo}</option>`;
            });
        }

        if (adminElements.filtroRutaAsistente) {
            const rutas = [...new Set(data.asistentes.map(a => a.ruta))];
            adminElements.filtroRutaAsistente.innerHTML = '<option value="">Todas las rutas</option>';
            rutas.forEach(ruta => {
                adminElements.filtroRutaAsistente.innerHTML += `<option value="${ruta}">${ruta}</option>`;
            });
        }
    },

    loadConfigurationForm: (config) => {
        if (adminElements.configNombreCapacitacion) {
            adminElements.configNombreCapacitacion.value = config.nombre_capacitacion || '';
        }
        if (adminElements.configCiudadCapacitacion) {
            adminElements.configCiudadCapacitacion.value = config.ciudad_capacitacion || '';
        }
        if (adminElements.configModalidadCapacitacion) {
            adminElements.configModalidadCapacitacion.value = config.modalidad_capacitacion || '';
        }
        if (adminElements.configFechaCapacitacion) {
            adminElements.configFechaCapacitacion.value = config.fecha_capacitacion || '';
        }
        if (adminElements.configHoraInicio) {
            adminElements.configHoraInicio.value = config.hora_inicio || '';
        }
        if (adminElements.configHoraFin) {
            adminElements.configHoraFin.value = config.hora_fin || '';
        }
        if (adminElements.configAsesorExterno) {
            adminElements.configAsesorExterno.value = config.asesor_externo || '';
        }
        if (adminElements.configNombreEmpresa) {
            adminElements.configNombreEmpresa.value = config.nombre_empresa || '';
        }
        if (adminElements.configDireccionEmpresa) {
            adminElements.configDireccionEmpresa.value = config.direccion_empresa || '';
        }
        if (adminElements.configTelefonoEmpresa) {
            adminElements.configTelefonoEmpresa.value = config.telefono_empresa || '';
        }
        if (adminElements.configActivo) {
            adminElements.configActivo.checked = config.activo || false;
        }
    }
};

// Manejadores de eventos para admin
const adminEventHandlers = {
    handleLogin: async (e) => {
        e.preventDefault();

        const usuario = adminElements.usuario?.value.trim();
        const password = adminElements.password?.value.trim();

        if (!usuario || !password) {
            adminUtils.showError('Por favor ingrese usuario y contraseña');
            return;
        }

        try {
            adminUtils.showLoading();
            adminUtils.hideError();

            if (adminElements.loginBtn) {
                adminElements.loginBtn.disabled = true;
                adminElements.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';
            }

            const result = await adminApi.login(usuario, password);

            adminState.isAuthenticated = true;
            adminState.adminData = result.admin;

            if (adminElements.adminUsername) {
                adminElements.adminUsername.textContent = result.admin.usuario;
            }

            adminUtils.hideLoading();
            adminUI.showDashboard();

            await adminApp.loadInitialData();

        } catch (error) {
            adminUtils.hideLoading();
            adminUtils.showError(error.message);

            if (adminElements.loginBtn) {
                adminElements.loginBtn.disabled = false;
                adminElements.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
            }
        }
    },

    handleConfigSubmit: async (e) => {
        e.preventDefault();

        // ✅ VALIDAR QUE TODOS LOS ELEMENTOS EXISTEN
        const requiredFields = {
            configNombreCapacitacion: 'Nombre de capacitación',
            configCiudadCapacitacion: 'Ciudad',
            configModalidadCapacitacion: 'Modalidad',
            configFechaCapacitacion: 'Fecha',
            configHoraInicio: 'Hora de inicio',
            configHoraFin: 'Hora de fin',
            configAsesorExterno: 'Asesor externo',
            configNombreEmpresa: 'Nombre empresa',
            configDireccionEmpresa: 'Dirección empresa',
            configTelefonoEmpresa: 'Teléfono empresa',
            configActivo: 'Estado activo'
        };

        for (const [field, label] of Object.entries(requiredFields)) {
            if (!adminElements[field]) {
                console.error(`❌ Elemento no encontrado: ${field}`);
                adminUtils.showNotification(`Error: No se encuentra el campo "${label}"`, 'danger');
                return;
            }
        }

        try {
            adminUtils.showLoading();

            if (adminElements.saveConfigBtn) {
                adminElements.saveConfigBtn.disabled = true;
                adminElements.saveConfigBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando...';
            }

            const configData = {
                nombre_capacitacion: adminElements.configNombreCapacitacion.value,
                ciudad_capacitacion: adminElements.configCiudadCapacitacion.value,
                modalidad_capacitacion: adminElements.configModalidadCapacitacion.value,
                fecha_capacitacion: adminElements.configFechaCapacitacion.value,
                hora_inicio: adminElements.configHoraInicio.value,
                hora_fin: adminElements.configHoraFin.value,
                asesor_externo: adminElements.configAsesorExterno.value,
                nombre_empresa: adminElements.configNombreEmpresa.value,
                direccion_empresa: adminElements.configDireccionEmpresa.value,
                telefono_empresa: adminElements.configTelefonoEmpresa.value,
                activo: adminElements.configActivo.checked
            };

            await adminApi.actualizarConfiguracion(configData);

            adminUtils.hideLoading();
            adminUtils.showNotification('✅ Nueva capacitación creada exitosamente');

            // ✅ Recargar con la fecha de la configuración creada
            const fechaCreada = configData.fecha_capacitacion;

            // Si estamos en la pestaña de asistentes, actualizar
            if (adminElements.fechaFiltro) {
                adminElements.fechaFiltro.value = fechaCreada;
            }

            await cargarCapacitaciones(fechaCreada);
            await adminApp.loadConfiguration();

        } catch (error) {
            console.error("❌ Error:", error);
            adminUtils.hideLoading();
            adminUtils.showNotification(error.message, 'danger');
        } finally {
            if (adminElements.saveConfigBtn) {
                adminElements.saveConfigBtn.disabled = false;
                adminElements.saveConfigBtn.innerHTML = '<i class="fas fa-plus me-2"></i>Crear Nueva Capacitación';
            }
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

        if (adminElements.loginForm) {
            adminElements.loginForm.reset();
        }
        adminUtils.hideError();

    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
};

window.filtrarAsistentes = async () => {
    const filtros = {
        fecha: adminElements.fechaFiltro?.value || '',
        capacitacion_id: document.getElementById('filtroCapacitacion')?.value || '',  // ✅ Agregar
        busqueda: adminElements.busquedaAsistente?.value || '',
        cargo: adminElements.filtroCargoAsistente?.value || '',
        ruta: adminElements.filtroRutaAsistente?.value || ''
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
    const fecha = adminElements.fechaFiltro?.value;
    const capacitacionId = document.getElementById('filtroCapacitacion')?.value;  // ✅ Obtener capacitación

    if (!fecha) {
        adminUtils.showNotification('Por favor seleccione una fecha', 'warning');
        return;
    }

    try {
        adminUtils.showLoading();

        // ✅ Construir URL con parámetros
        let url = `/admin/generar-pdf?fecha=${fecha}`;
        if (capacitacionId) {
            url += `&capacitacion_id=${capacitacionId}`;
        }

        // ✅ Hacer fetch con los parámetros
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al generar PDF');
        }

        const blob = await response.blob();
        const urlBlob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlBlob;

        // ✅ Nombre personalizado según filtro
        let nombreArchivo = `lista_asistencia_${fecha}`;
        if (capacitacionId && adminState.capacitacionesData[capacitacionId]) {
            const nombreCap = adminState.capacitacionesData[capacitacionId].replace(/\s/g, '_');
            nombreArchivo = `lista_${nombreCap}_${fecha}`;
        }
        a.download = `${nombreArchivo}.pdf`;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(urlBlob);
        document.body.removeChild(a);

        adminUtils.hideLoading();
        adminUtils.showNotification('PDF generado y descargado exitosamente');
    } catch (error) {
        adminUtils.hideLoading();
        console.error('Error al generar PDF:', error);
        adminUtils.showNotification(error.message, 'danger');
    }
};

// Aplicación principal de admin
const adminApp = {
    loadInitialData: async () => {
        try {
            const fecha = new Date().toISOString().split('T')[0];
            await cargarCapacitaciones(fecha);  // ✅ Pasar fecha inicial
            await adminApp.loadDashboard();
            await adminApp.loadAsistentes();
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
            if (adminElements.fechaFiltro) {
                adminElements.fechaFiltro.value = fecha;
            }

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
            adminUtils.showNotification('Error al cargar configuración', 'warning');
        }
    },

    setupEventListeners: () => {
        if (adminElements.loginForm) {
            adminElements.loginForm.addEventListener('submit', adminEventHandlers.handleLogin);
        }

        if (adminElements.configForm) {
            adminElements.configForm.addEventListener('submit', adminEventHandlers.handleConfigSubmit);
        }

        if (adminElements.fechaFiltro) {
            // ✅ ACTUALIZADO: Al cambiar fecha, recargar capacitaciones y asistentes
            adminElements.fechaFiltro.addEventListener('change', async () => {
                const fecha = adminElements.fechaFiltro.value;
                await cargarCapacitaciones(fecha);  // Recargar capacitaciones de esa fecha
                await filtrarAsistentes();          // Recargar asistentes
            });
        }

        // Listener para el select de capacitación
        const filtroCapacitacion = document.getElementById('filtroCapacitacion');
        if (filtroCapacitacion) {
            filtroCapacitacion.addEventListener('change', filtrarAsistentes);
        }

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

                if (adminElements.adminUsername) {
                    adminElements.adminUsername.textContent = sessionData.admin.usuario;
                }

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

document.addEventListener('DOMContentLoaded', adminApp.init);