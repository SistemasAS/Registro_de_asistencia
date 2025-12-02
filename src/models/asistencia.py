from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date, time
from zoneinfo import ZoneInfo
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# ✅ Configuración de zona horaria de Colombia
COLOMBIA_TZ = ZoneInfo("America/Bogota")

def now_colombia():
    """Retorna datetime actual en zona horaria de Colombia"""
    return datetime.now(COLOMBIA_TZ)

def today_colombia():
    """Retorna la fecha actual en Colombia"""
    return now_colombia().date()

def current_time_colombia():
    """Retorna solo la hora actual en Colombia (sin fecha)"""
    return now_colombia().time()


class Configuracion(db.Model):
    __tablename__ = 'configuracion'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre_capacitacion = db.Column(db.String(200), nullable=False)
    ciudad_capacitacion = db.Column(db.String(100), nullable=False)
    modalidad_capacitacion = db.Column(db.String(100), nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fin = db.Column(db.Time, nullable=False)
    fecha_capacitacion = db.Column(db.Date, nullable=False)
    activo = db.Column(db.Boolean, default=True)
    asesor_externo = db.Column(db.String(100), nullable=False)
    
    # Datos fijos de la empresa
    nombre_empresa = db.Column(db.String(200), default="Mi Empresa")
    direccion_empresa = db.Column(db.String(300), default="Dirección de la empresa")
    telefono_empresa = db.Column(db.String(50), default="Teléfono de contacto")
    logo_empresa = db.Column(db.String(200))  # Ruta al archivo de logo
    
    # ✅ Relaciones definidas SOLO AQUÍ en Configuracion
    asistentes = db.relationship('Asistente', backref='configuracion', lazy=True)
    capacitadores = db.relationship('Capacitador', backref='configuracion', lazy=True)
    
    def __repr__(self):
        return f'<Configuracion {self.nombre_capacitacion}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre_capacitacion': self.nombre_capacitacion,
            'ciudad_capacitacion': self.ciudad_capacitacion,
            'modalidad_capacitacion': self.modalidad_capacitacion,
            'hora_inicio': self.hora_inicio.strftime('%H:%M') if self.hora_inicio else None,
            'hora_fin': self.hora_fin.strftime('%H:%M') if self.hora_fin else None,
            'fecha_capacitacion': self.fecha_capacitacion.strftime('%Y-%m-%d') if self.fecha_capacitacion else None,
            'activo': self.activo,
            'asesor_externo': self.asesor_externo,
            'nombre_empresa': self.nombre_empresa,
            'direccion_empresa': self.direccion_empresa,
            'telefono_empresa': self.telefono_empresa,
            'logo_empresa': self.logo_empresa,
        }
    
    @staticmethod
    def get_configuracion_activa():
        """Obtiene la configuración activa del día actual en Colombia"""
        # ✅ Usar hora de Colombia en lugar de datetime.now()
        fecha_hoy = today_colombia()
        hora_actual = current_time_colombia()
        
        # Buscar configuración activa para hoy en el horario correcto
        config = Configuracion.query.filter(
            Configuracion.activo == True,
            Configuracion.fecha_capacitacion == fecha_hoy,
            Configuracion.hora_inicio <= hora_actual,
            Configuracion.hora_fin >= hora_actual
        ).first()
        
        return config
    
    def esta_en_horario(self):
        """Verifica si el formulario está disponible según el horario configurado"""
        if not self.activo:
            return False
        
        # ✅ Usar hora de Colombia en lugar de datetime.now()
        fecha_hoy = today_colombia()
        hora_actual = current_time_colombia()
        
        # Verificar si es la fecha de la capacitación
        if fecha_hoy != self.fecha_capacitacion:
            return False
        
        # Verificar si está dentro del horario
        return self.hora_inicio <= hora_actual <= self.hora_fin


class Capacitador(db.Model):
    """Modelo para registrar información del capacitador"""
    __tablename__ = 'capacitadores'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(200), nullable=False)
    firma_digital = db.Column(db.String(500))
    fecha_registro = db.Column(db.Date, nullable=False)
    hora_registro = db.Column(db.Time, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: now_colombia())
    
    # ✅ Solo ForeignKey, sin backref (ya está definido en Configuracion)
    configuracion_id = db.Column(db.Integer, db.ForeignKey('configuracion.id'), nullable=False)
    
    def to_dict(self):
        """Convierte el objeto a diccionario"""
        return {
            'id': self.id,
            'nombre_completo': self.nombre_completo,
            'firma_digital': self.firma_digital,
            'fecha_registro': self.fecha_registro.strftime('%Y-%m-%d') if self.fecha_registro else None,
            'hora_registro': self.hora_registro.strftime('%H:%M:%S') if self.hora_registro else None,
        }
    
    def __repr__(self):
        return f'<Capacitador {self.nombre_completo}>'


class Asistente(db.Model):
    __tablename__ = 'asistentes'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombres_apellidos = db.Column(db.String(200), nullable=False)
    tipodocumento = db.Column(db.String(50), nullable=False)
    numero_documento = db.Column(db.String(50), nullable=False)
    cargo = db.Column(db.String(100), nullable=False)
    ruta = db.Column(db.String(100), nullable=False)
    hora_llegada = db.Column(db.DateTime, nullable=False, default=lambda: now_colombia())
    ciudad = db.Column(db.String(100))
    firma_digital = db.Column(db.String(200))  # Ruta al archivo de imagen
    fecha_registro = db.Column(db.Date, nullable=False, default=lambda: today_colombia())
    
    # ✅ Solo ForeignKey, sin backref (ya está definido en Configuracion)
    configuracion_id = db.Column(db.Integer, db.ForeignKey('configuracion.id'), nullable=False)

    def __repr__(self):
        return f'<Asistente {self.nombres_apellidos}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombres_apellidos': self.nombres_apellidos,
            'numero_documento': self.numero_documento,
            'tipodocumento': self.tipodocumento,
            'cargo': self.cargo,
            'ruta': self.ruta,
            'ciudad': self.ciudad,
            'hora_llegada': self.hora_llegada.strftime('%H:%M:%S') if self.hora_llegada else None,
            'fecha_registro': self.fecha_registro.strftime('%Y-%m-%d') if self.fecha_registro else None,
            'firma_digital': self.firma_digital,
            'configuracion_id': self.configuracion_id,
            'nombre_capacitacion': self.configuracion.nombre_capacitacion if self.configuracion else None
        }


class Administrador(db.Model):
    __tablename__ = 'administradores'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    
    def __repr__(self):
        return f'<Administrador {self.usuario}>'
    
    def set_password(self, password):
        """Establece la contraseña hasheada"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verifica la contraseña"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'usuario': self.usuario
        }