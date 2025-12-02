import os
import sys
from datetime import date, time, datetime
from zoneinfo import ZoneInfo  # stdlib (Python 3.9+)

# DON'T CHANGE THIS !!!
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

# --- App Flask ---
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Habilitar CORS para todas las rutas
CORS(app)

# Registrar blueprints
app.register_blueprint(asistencia_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/admin')

# Configuración de base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def crear_datos_iniciales():
    """Crea datos iniciales si no existen (usando fecha en Colombia)."""
    # Crear administrador por defecto
    admin_existente = Administrador.query.filter_by(usuario='admin').first()
    if not admin_existente:
        admin = Administrador(usuario='admin')
        admin.set_password('admin123')  # Contraseña por defecto
        db.session.add(admin)
    
    # Crear configuración por defecto
    config_existente = Configuracion.query.first()
    if not config_existente:
        config = Configuracion(
            nombre_capacitacion='Capacitación de Seguridad',
            ciudad_capacitacion='Ciudad Capacitación',
            modalidad_capacitacion='Virtual / Presencial',
            hora_inicio=time(8, 0),  # 8:00 AM (naïve time)
            hora_fin=time(17, 0),    # 5:00 PM (naïve time)
            fecha_capacitacion=today_co(),  # <-- fecha en zona America/Bogota
            asesor_externo=' ',  # o None si no es obligatoria
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
    # En Render no ejecutes con debug True; aquí es solo para local
    app.run(host='0.0.0.0', port=5001, debug=True)
