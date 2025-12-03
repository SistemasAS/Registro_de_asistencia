import os
import sys
from datetime import date, time, datetime
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.asistencia import db, Configuracion, Administrador, Capacitador
from src.routes.asistencia import asistencia_bp
from src.routes.admin import admin_bp

# --- Configuración de zona horaria ---
COLOMBIA_TZ = ZoneInfo("America/Bogota")

def now_co():
    """Devuelve datetime.now() en zona horaria de Colombia (aware)."""
    return datetime.now(COLOMBIA_TZ)

def today_co():
    """Devuelve la fecha (date) actual en Colombia."""
    return now_co().date()

def current_time_co():
    """Devuelve solo la hora actual en Colombia como objeto time (naïve)."""
    return now_co().time()

# --- App Flask ---
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

CORS(app)

# Registrar blueprints
app.register_blueprint(asistencia_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/admin')

# ✅ CONFIGURACIÓN MEJORADA DE BASE DE DATOS
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    # PostgreSQL en producción (Supabase)
    # Supabase usa 'postgres://' pero SQLAlchemy necesita 'postgresql://'
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    # Agregar parámetros de conexión para mejorar compatibilidad
    if '?' not in DATABASE_URL:
        DATABASE_URL += '?'
    else:
        DATABASE_URL += '&'
    
    # Agregar opciones de conexión
    DATABASE_URL += 'connect_timeout=10'
    
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,  # Verifica conexiones antes de usarlas
        'pool_recycle': 300,    # Recicla conexiones cada 5 minutos
        'pool_size': 10,        # Tamaño del pool de conexiones
        'max_overflow': 20,     # Conexiones adicionales permitidas
        'connect_args': {
            'connect_timeout': 10,
            'keepalives': 1,
            'keepalives_idle': 30,
            'keepalives_interval': 10,
            'keepalives_count': 5,
        }
    }
    print("✅ Usando PostgreSQL (Supabase)")
else:
    # SQLite para desarrollo local
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
    print("✅ Usando SQLite (desarrollo local)")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Hacer disponibles las funciones de timezone
app.config['NOW_CO'] = now_co
app.config['TODAY_CO'] = today_co
app.config['CURRENT_TIME_CO'] = current_time_co
app.config['COLOMBIA_TZ'] = COLOMBIA_TZ

def crear_datos_iniciales():
    """Crea datos iniciales si no existen (usando fecha en Colombia)."""
    try:
        admin_existente = Administrador.query.filter_by(usuario='admin').first()
        if not admin_existente:
            admin = Administrador(usuario='admin')
            admin.set_password('admin123')
            db.session.add(admin)
        
        config_existente = Configuracion.query.first()
        if not config_existente:
            config = Configuracion(
                nombre_capacitacion='Capacitación de Seguridad',
                ciudad_capacitacion='Ciudad Capacitación',
                modalidad_capacitacion='Virtual / Presencial',
                hora_inicio=time(13, 0),
                hora_fin=time(15, 30),
                fecha_capacitacion=today_co(),
                asesor_externo=' ',
                nombre_empresa='AUTOSNACK SAS',
                direccion_empresa='Av. Boyacá #95 - 51',
                telefono_empresa='(601) 743 3904'
            )
            db.session.add(config)
        
        db.session.commit()
        print("✅ Datos iniciales creados/verificados correctamente")
    except Exception as e:
        print(f"⚠️ Error al crear datos iniciales: {e}")
        db.session.rollback()

# Inicializar base de datos con manejo de errores mejorado
try:
    with app.app_context():
        print("🔄 Intentando conectar a la base de datos...")
        db.create_all()
        print("✅ Tablas creadas/verificadas correctamente")
        crear_datos_iniciales()
except Exception as e:
    print(f"❌ Error al inicializar la base de datos: {e}")
    print("⚠️ La aplicación continuará, pero puede que necesites verificar la conexión")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)