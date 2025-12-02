from flask import Blueprint, request, jsonify, current_app
from src.models.asistencia import db, Asistente, Configuracion, Capacitador
from datetime import datetime, date
from io import BytesIO
from PIL import Image
import os
from werkzeug.utils import secure_filename
import uuid
import base64

# ✅ Crear el blueprint correctamente
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
        print("🔍 Solicitando estado del sistema...")
        
        # ✅ Buscar la configuración activa del día
        config = Configuracion.get_configuracion_activa()
        
        if not config:
            # Buscar si hay alguna configuración para hoy aunque no esté en horario
            config = Configuracion.query.filter(
                Configuracion.activo == True,
                Configuracion.fecha_capacitacion == date.today()
            ).first()
            
            if not config:
                print("❌ No hay capacitaciones programadas para hoy")
                return jsonify({
                    'disponible': False,
                    'mensaje': 'No hay capacitaciones programadas para hoy',
                    'configuracion': None
                }), 200  # ✅ Cambiar a 200 en lugar de 404
        
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
        
        print(f"✅ Estado enviado: {response_data}")
        return jsonify(response_data), 200
    
    except Exception as e:
        print(f"❌ Error en /api/estado: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'disponible': False}), 500

@asistencia_bp.route('/registrar', methods=['POST'])
def registrar_asistencia():
    """Registra la asistencia de un trabajador"""
    try:
        print("🔍 Intentando registrar asistencia...")
        
        # ✅ Obtener la configuración activa
        config = Configuracion.get_configuracion_activa()
        
        if not config or not config.esta_en_horario():
            return jsonify({
                'error': 'El formulario no está disponible en este momento'
            }), 403
        
        # Obtener datos del formulario
        nombres_apellidos = request.form.get('nombres_apellidos', '').strip()
        tipodocumento = request.form.get('tipodocumento', '').strip()
        numero_documento = request.form.get('numero_documento', '').strip()
        cargo = request.form.get('cargo', '').strip()
        ruta = request.form.get('ruta', '').strip()
        ciudad = request.form.get('ciudad', '').strip()
        
        # Validar campos obligatorios
        if not all([nombres_apellidos, tipodocumento, numero_documento, cargo, ruta, ciudad]):
            return jsonify({
                'error': 'Todos los campos son obligatorios'
            }), 400
        
        asistente_existente = Asistente.query.filter_by(
            numero_documento=numero_documento,
            configuracion_id=config.id  # Valida por capacitación específica
        ).first()
        
        if asistente_existente:
            return jsonify({
                'error': f'Ya está registrado en esta capacitación: {config.nombre_capacitacion}'
            }), 409
        
        # ✅ PROCESAR FIRMA DIGITAL (base64)
        firma_path = None
        firma_digital_data = request.form.get('firma_digital', '').strip()
        
        if firma_digital_data:
            try:
                # Crear directorio de uploads
                upload_dir = crear_directorio_uploads()

                # Generar nombre único
                unique_filename = f"{uuid.uuid4().hex}.png"
                file_path = os.path.join(upload_dir, unique_filename)

                # ✅ Decodificar base64 correctamente
                if firma_digital_data.startswith("data:image"):
                    # Remover el prefijo data:image/png;base64,
                    firma_digital_data = firma_digital_data.split(",", 1)[1]

                # Decodificar y guardar
                image_data = base64.b64decode(firma_digital_data)
                image = Image.open(BytesIO(image_data)).convert("RGBA")

                # Guardar como PNG (mantiene transparencia)
                image.save(file_path, format="PNG")

                # Guardar ruta relativa
                firma_path = f"uploads/firmas/{unique_filename}"
                
                print(f"✅ Firma guardada correctamente en: {file_path}")
                
            except Exception as e:
                print(f"❌ Error al guardar firma: {str(e)}")
                # No fallar el registro si hay error con la firma
                firma_path = None
        
        nuevo_asistente = Asistente(
            nombres_apellidos=nombres_apellidos,
            tipodocumento=tipodocumento,
            numero_documento=numero_documento,
            cargo=cargo,
            ruta=ruta,
            ciudad=ciudad,
            hora_llegada=datetime.now(),
            firma_digital=firma_path,
            fecha_registro=date.today(),
            configuracion_id=config.id  # Vincular con capacitación activa
        )
        
        db.session.add(nuevo_asistente)
        db.session.commit()
        
        print(f"✅ Asistente registrado: {nombres_apellidos}")
        
        return jsonify({
            'mensaje': 'Asistencia registrada exitosamente',
            'asistente': nuevo_asistente.to_dict(),
            'capacitacion': config.nombre_capacitacion
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en registro: {str(e)}")
        import traceback
        traceback.print_exc()
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

@asistencia_bp.route('/capacitador/registrar', methods=['POST'])
def registrar_capacitador():
    """Registra la información del capacitador para una capacitación específica"""
    try:
        print("🔍 Intentando registrar capacitador...")
        
        # ✅ Obtener la configuración activa
        config = Configuracion.get_configuracion_activa()
        
        if not config or not config.esta_en_horario():
            return jsonify({
                'error': 'El formulario no está disponible en este momento'
            }), 403
        
        # Obtener datos del formulario
        nombre_completo = request.form.get('nombre_completo', '').strip()
        firma_digital_data = request.form.get('firma_digital', '').strip()
        
        # Validar campos obligatorios
        if not nombre_completo:
            return jsonify({
                'error': 'El nombre es obligatorio'
            }), 400
        
        # ✅ Verificar si ya existe un capacitador para ESTA capacitación específica
        capacitador_existente = Capacitador.query.filter_by(
            configuracion_id=config.id
        ).first()
        
        if capacitador_existente:
            return jsonify({
                'error': f'Ya existe un capacitador registrado para esta capacitación: {config.nombre_capacitacion}'
            }), 409
        
        # Procesar firma digital
        firma_path = None
        if firma_digital_data:
            try:
                upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'firmas_capacitadores')
                os.makedirs(upload_dir, exist_ok=True)
                
                unique_filename = f"capacitador_{uuid.uuid4().hex}.png"
                file_path = os.path.join(upload_dir, unique_filename)
                
                if firma_digital_data.startswith("data:image"):
                    firma_digital_data = firma_digital_data.split(",")[1]
                
                image_data = base64.b64decode(firma_digital_data)
                image = Image.open(BytesIO(image_data)).convert("RGBA")
                image.save(file_path, format="PNG")
                
                firma_path = f"uploads/firmas_capacitadores/{unique_filename}"
                print(f"✅ Firma de capacitador guardada: {firma_path}")
            except Exception as e:
                print(f"❌ Error al guardar firma del capacitador: {str(e)}")
                firma_path = None
        
        # ✅ Crear nuevo registro vinculado a la capacitación activa
        nuevo_capacitador = Capacitador(
            nombre_completo=nombre_completo,
            firma_digital=firma_path,
            fecha_registro=date.today(),
            hora_registro=datetime.now().time(),
            configuracion_id=config.id  # ✅ Vincular con capacitación activa
        )
        
        db.session.add(nuevo_capacitador)
        db.session.commit()
        
        print(f"✅ Capacitador registrado: {nombre_completo}")
        
        return jsonify({
            'mensaje': 'Información del capacitador registrada exitosamente',
            'capacitador': nuevo_capacitador.to_dict(),
            'capacitacion': config.nombre_capacitacion
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al registrar capacitador: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ✅ RUTA DE PRUEBA para verificar que el blueprint funciona
@asistencia_bp.route('/test', methods=['GET'])
def test():
    """Ruta de prueba"""
    return jsonify({
        'mensaje': 'Blueprint de asistencia funcionando correctamente',
        'rutas_disponibles': [
            '/api/estado',
            '/api/registrar',
            '/api/asistentes',
            '/api/capacitador/registrar',
            '/api/test'
        ]
    }), 200