from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date, time
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Configuracion(db.Model):
    __tablename__ = 'configuracion'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre_capacitacion = db.Column(db.String(200), nullable=False)
    ciudad_capacitacion = db.Column(db.String(100), nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fin = db.Column(db.Time, nullable=False)
    fecha_capacitacion = db.Column(db.Date, nullable=False)
    activo = db.Column(db.Boolean, default=True)
    nombre_instructor = db.Column(db.String(200), nullable=False)
    cargo_instructor = db.Column(db.String(100), nullable=False)
    asesor_externo = db.Column(db.String(100), nullable=False)
    firma_digital_cap = db.Column(db.String(255))
    
    # Datos fijos de la empresa
    nombre_empresa = db.Column(db.String(200), default="Mi Empresa")
    direccion_empresa = db.Column(db.String(300), default="Dirección de la empresa")
    telefono_empresa = db.Column(db.String(50), default="Teléfono de contacto")
    logo_empresa = db.Column(db.String(200))  # Ruta al archivo de logo
    
    def __repr__(self):
        return f'<Configuracion {self.nombre_capacitacion}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre_capacitacion': self.nombre_capacitacion,
            'ciudad_capacitacion': self.ciudad_capacitacion,
            'hora_inicio': self.hora_inicio.strftime('%H:%M') if self.hora_inicio else None,
            'hora_fin': self.hora_fin.strftime('%H:%M') if self.hora_fin else None,
            'fecha_capacitacion': self.fecha_capacitacion.strftime('%Y-%m-%d') if self.fecha_capacitacion else None,
            'activo': self.activo,
            'nombre_instructor': self.nombre_instructor,
            'cargo_instructor': self.cargo_instructor,
            'asesor_externo': self.asesor_externo,
            'firma_digital_cap': self.firma_digital_cap,
            'nombre_empresa': self.nombre_empresa,
            'direccion_empresa': self.direccion_empresa,
            'telefono_empresa': self.telefono_empresa,
            'logo_empresa': self.logo_empresa,
            'firma_digital_cap': self.firma_digital_cap
        }
    
    def esta_en_horario(self):
        """Verifica si el formulario está disponible según el horario configurado"""
        if not self.activo:
            return False
        
        ahora = datetime.now()
        fecha_hoy = ahora.date()
        hora_actual = ahora.time()
        
        # Verificar si es la fecha de la capacitación
        if fecha_hoy != self.fecha_capacitacion:
            return False
        
        # Verificar si está dentro del horario
        return self.hora_inicio <= hora_actual <= self.hora_fin

class Asistente(db.Model):
    __tablename__ = 'asistentes'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombres_apellidos = db.Column(db.String(200), nullable=False)
    numero_documento = db.Column(db.String(50), unique=True, nullable=False)
    cargo = db.Column(db.String(100), nullable=False)
    ruta = db.Column(db.String(100), nullable=False)
    hora_llegada = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    ciudad = db.Column(db.String(100))  # Nueva columna
    firma_digital = db.Column(db.String(200))  # Ruta al archivo de imagen
    fecha_registro = db.Column(db.Date, nullable=False, default=date.today)
    
    def __repr__(self):
        return f'<Asistente {self.nombres_apellidos}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombres_apellidos': self.nombres_apellidos,
            'numero_documento': self.numero_documento,
            'cargo': self.cargo,
            'ruta': self.ruta,
            'ciudad': self.ciudad,
            'hora_llegada': self.hora_llegada.strftime('%H:%M:%S') if self.hora_llegada else None,
            'fecha_registro': self.fecha_registro.strftime('%Y-%m-%d') if self.fecha_registro else None,
            'firma_digital': self.firma_digital
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

