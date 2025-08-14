from flask import Blueprint, request, jsonify, current_app
from src.models.asistencia import db, Asistente, Configuracion
from datetime import datetime, date
import os
from werkzeug.utils import secure_filename
import uuid

asistencia_bp = Blueprint('asistencia', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    """Verifica si el archivo tiene una extensión permitida"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def crear_directorio_uploads():
    """Crea el directorio de uploads si no existe"""
    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'firmas')
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir

@asistencia_bp.route('/estado', methods=['GET'])
def obtener_estado():
    """Obtiene el estado actual del sistema"""
    try:
        config = Configuracion.query.first()
        if not config:
            return jsonify({
                'disponible': False,
                'mensaje': 'Sistema no configurado'
            }), 404
        
        disponible = config.esta_en_horario()
        
        response_data = {
            'disponible': disponible,
            'configuracion': config.to_dict()
        }
        
        if not disponible:
            if not config.activo:
                response_data['mensaje'] = 'El formulario está desactivado'
            elif date.today() != config.fecha_capacitacion:
                response_data['mensaje'] = f'La capacitación está programada para {config.fecha_capacitacion.strftime("%d/%m/%Y")}'
            else:
                response_data['mensaje'] = f'El formulario está disponible de {config.hora_inicio.strftime("%H:%M")} a {config.hora_fin.strftime("%H:%M")}'
        else:
            response_data['mensaje'] = 'Formulario disponible'
        
        return jsonify(response_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@asistencia_bp.route('/registrar', methods=['POST'])
def registrar_asistencia():
    """Registra la asistencia de un trabajador"""
    try:
        # Verificar estado del sistema
        config = Configuracion.query.first()
        if not config or not config.esta_en_horario():
            return jsonify({
                'error': 'El formulario no está disponible en este momento'
            }), 403
        
        # Obtener datos del formulario
        nombres_apellidos = request.form.get('nombres_apellidos', '').strip()
        numero_documento = request.form.get('numero_documento', '').strip()
        cargo = request.form.get('cargo', '').strip()
        ruta = request.form.get('ruta', '').strip()
        
        # Validar campos obligatorios
        if not all([nombres_apellidos, numero_documento, cargo, ruta]):
            return jsonify({
                'error': 'Todos los campos son obligatorios'
            }), 400
        
        # Verificar si ya existe un registro con el mismo documento
        asistente_existente = Asistente.query.filter_by(
            numero_documento=numero_documento,
            fecha_registro=date.today()
        ).first()
        
        if asistente_existente:
            return jsonify({
                'error': 'Ya existe un registro con este número de documento para hoy'
            }), 409
        
        # Procesar firma digital si se proporciona
        firma_path = None
        if 'firma_digital' in request.files:
            file = request.files['firma_digital']
            if file and file.filename != '' and allowed_file(file.filename):
                # Crear directorio de uploads
                upload_dir = crear_directorio_uploads()
                
                # Generar nombre único para el archivo
                file_extension = file.filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
                
                # Guardar archivo
                file_path = os.path.join(upload_dir, unique_filename)
                file.save(file_path)
                
                # Guardar ruta relativa
                firma_path = f"uploads/firmas/{unique_filename}"
        
        # Crear nuevo registro de asistencia
        nuevo_asistente = Asistente(
            nombres_apellidos=nombres_apellidos,
            numero_documento=numero_documento,
            cargo=cargo,
            ruta=ruta,
            hora_llegada=datetime.now(),
            firma_digital=firma_path,
            fecha_registro=date.today()
        )
        
        db.session.add(nuevo_asistente)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Asistencia registrada exitosamente',
            'asistente': nuevo_asistente.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@asistencia_bp.route('/asistentes', methods=['GET'])
def listar_asistentes():
    """Lista todos los asistentes registrados (solo para uso interno)"""
    try:
        fecha_filtro = request.args.get('fecha', date.today().strftime('%Y-%m-%d'))
        fecha_obj = datetime.strptime(fecha_filtro, '%Y-%m-%d').date()
        
        asistentes = Asistente.query.filter_by(fecha_registro=fecha_obj).all()
        
        return jsonify({
            'asistentes': [asistente.to_dict() for asistente in asistentes],
            'total': len(asistentes),
            'fecha': fecha_filtro
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

