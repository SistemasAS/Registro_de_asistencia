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

# ✅ NUEVA CONFIGURACIÓN DE BASE DE DATOS
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    # PostgreSQL en producción (Supabase)
    # Supabase usa 'postgres://' pero SQLAlchemy necesita 'postgresql://'
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
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

with app.app_context():
    db.create_all()
    crear_datos_iniciales()

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