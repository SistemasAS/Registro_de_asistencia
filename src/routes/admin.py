from flask import Blueprint, request, jsonify, session, send_file, current_app
from src.models.asistencia import db, Administrador, Configuracion, Asistente
from datetime import datetime, date, time
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer 
from reportlab.platypus import Image 
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import tempfile
import os

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/login', methods=['POST'])
def login():
    """Autenticación de administrador"""
    try:
        data = request.get_json()
        usuario = data.get('usuario')
        password = data.get('password')
        
        if not usuario or not password:
            return jsonify({'error': 'Usuario y contraseña son requeridos'}), 400
        
        admin = Administrador.query.filter_by(usuario=usuario).first()
        
        if admin and admin.check_password(password):
            session['admin_id'] = admin.id
            session['admin_usuario'] = admin.usuario
            return jsonify({
                'mensaje': 'Login exitoso',
                'admin': admin.to_dict()
            })
        else:
            return jsonify({'error': 'Credenciales inválidas'}), 401
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/logout', methods=['POST'])
def logout():
    """Cerrar sesión de administrador"""
    session.pop('admin_id', None)
    session.pop('admin_usuario', None)
    return jsonify({'mensaje': 'Sesión cerrada'})

@admin_bp.route('/verificar-sesion', methods=['GET'])
def verificar_sesion():
    """Verifica si hay una sesión activa"""
    if 'admin_id' in session:
        admin = Administrador.query.get(session['admin_id'])
        if admin:
            return jsonify({
                'autenticado': True,
                'admin': admin.to_dict()
            })
    
    return jsonify({'autenticado': False}), 401

def requiere_autenticacion(f):
    """Decorador para rutas que requieren autenticación"""
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            return jsonify({'error': 'Autenticación requerida'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@admin_bp.route('/configuracion', methods=['GET'])
@requiere_autenticacion
def obtener_configuracion():
    """Obtiene la configuración actual"""
    try:
        config = Configuracion.query.first()
        if not config:
            return jsonify({'error': 'No hay configuración'}), 404
        
        return jsonify(config.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/configuracion', methods=['POST'])
@requiere_autenticacion
def actualizar_configuracion():
    """Actualiza la configuración del sistema"""
    try:
        data = request.get_json()
        
        config = Configuracion.query.first()
        if not config:
            return jsonify({'error': 'No hay configuración'}), 404
        
        # Actualizar campos si se proporcionan
        if 'nombre_capacitacion' in data:
            config.nombre_capacitacion = data['nombre_capacitacion']
        
        if 'ciudad_capacitacion' in data:
            config.ciudad_capacitacion = data['ciudad_capacitacion']
        
        if 'hora_inicio' in data:
            hora_inicio_str = data['hora_inicio']
            config.hora_inicio = datetime.strptime(hora_inicio_str, '%H:%M').time()
        
        if 'hora_fin' in data:
            hora_fin_str = data['hora_fin']
            config.hora_fin = datetime.strptime(hora_fin_str, '%H:%M').time()
        
        if 'fecha_capacitacion' in data:
            fecha_str = data['fecha_capacitacion']
            config.fecha_capacitacion = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        
        if 'activo' in data:
            config.activo = data['activo']
        
        if 'nombre_instructor' in data:
            config.nombre_instructor = data['nombre_instructor']

        if 'cargo_instructor' in data:
            config.cargo_instructor = data['cargo_instructor']
        
        if 'asesor_externo' in data:
            config.asesor_externo = data['asesor_externo']

        if 'nombre_empresa' in data:
            config.nombre_empresa = data['nombre_empresa']
        
        if 'direccion_empresa' in data:
            config.direccion_empresa = data['direccion_empresa']
            
        
        if 'telefono_empresa' in data:
            config.telefono_empresa = data['telefono_empresa']
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Configuración actualizada',
            'configuracion': config.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/asistentes', methods=['GET'])
@requiere_autenticacion
def listar_asistentes_admin():
    """Lista todos los asistentes con filtros"""
    try:
        fecha_filtro = request.args.get('fecha', date.today().strftime('%Y-%m-%d'))
        busqueda = request.args.get('busqueda', '')
        cargo_filtro = request.args.get('cargo', '')
        ruta_filtro = request.args.get('ruta', '')
        
        # Validar formato de fecha
        try:
            fecha_obj = datetime.strptime(fecha_filtro, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de fecha inválido, use YYYY-MM-DD'}), 400
        
        query = Asistente.query.filter_by(fecha_registro=fecha_obj)
        
        # Aplicar filtros
        if busqueda:
            query = query.filter(
                (Asistente.nombres_apellidos.contains(busqueda)) |
                (Asistente.numero_documento.contains(busqueda))
            )
        
        if cargo_filtro:
            query = query.filter(Asistente.cargo.contains(cargo_filtro))
        
        if ruta_filtro:
            query = query.filter(Asistente.ruta.contains(ruta_filtro))

        # Ejecutar consulta
        asistentes = query.all()

        # Obtener estadísticas
        total_asistentes = len(asistentes)
        cargos_unicos = list(set([a.cargo for a in asistentes]))
        rutas_unicas = list(set([a.ruta for a in asistentes]))
        
        return jsonify({
            'asistentes': [asistente.to_dict() for asistente in asistentes],
            'estadisticas': {
                'total': total_asistentes,
                'cargos': cargos_unicos,
                'rutas': rutas_unicas
            },
            'fecha': fecha_filtro
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/generar-pdf', methods=['GET'])
@requiere_autenticacion
def generar_pdf():
    """Genera un PDF con la lista de asistencia"""
    try:
        fecha_filtro = request.args.get('fecha', date.today().strftime('%Y-%m-%d'))
        fecha_obj = datetime.strptime(fecha_filtro, '%Y-%m-%d').date()
        
        # Obtener configuración y asistentes
        config = Configuracion.query.first()
        asistentes = Asistente.query.filter_by(fecha_registro=fecha_obj).order_by(Asistente.hora_llegada).all()
        
        if not config:
            return jsonify({'error': 'No hay configuración'}), 404
        
        # Crear archivo temporal
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_path = temp_file.name
        temp_file.close()
        
        # Crear documento PDF
        doc = SimpleDocTemplate(temp_path, pagesize=A4)
        story = []
        styles = getSampleStyleSheet()
        
        # ======== Encabezado con 3 columnas alineadas ========

        # Columna izquierda → Logo (ajuste proporcional)
        logo_path = os.path.join(current_app.root_path, 'static', 'logotipo.png')
        if os.path.exists(logo_path):
            # Tamaño máximo del logo
            max_width = 1.4 * inch
            max_height = 1.4 * inch
            logo = Image(logo_path)
            logo._restrictSize(max_width, max_height)
        else:
            logo = Paragraph("SIN LOGO", styles['Normal'])

        # Columna central → Títulos
        titulo_centro = [
            Paragraph(
                "<b>Gestión de Talento Humano</b>",
                ParagraphStyle(name='SmallTitle', fontSize=12, alignment=TA_CENTER, spaceAfter=5)
            ),
            Paragraph(
                "<b>Registro de Asistencia</b>",
                ParagraphStyle(name='MainTitle', fontSize=16, alignment=TA_CENTER)
            )
        ]

        # Columna derecha → Código, Versión y Fecha de actualización
        info_derecha = [
            Paragraph(f"<b>Código: FR-TH-01</b> {getattr(config, 'codigo', '')}", styles['Normal']),
            Paragraph(f"<b>Versión: 03</b> {getattr(config, 'version', '')}", styles['Normal']),
            Paragraph(
                f"<b>Fecha de actualización: 11-10-2024</b> {getattr(config, 'fecha_actualizacion', '').strftime('%d/%m/%Y') if getattr(config, 'fecha_actualizacion', None) else ''}",
                styles['Normal']
            )
        ]

        # Crear tabla del encabezado
        encabezado_data = [
            [logo, titulo_centro, info_derecha]
        ]
        encabezado_table = Table(encabezado_data, colWidths=[2*inch, 3.5*inch, 2.4*inch])
        encabezado_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 0), (1, 0), 'CENTER'),
            ('ALIGN', (2, 0), (2, 0), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        story.append(encabezado_table)
        story.append(Spacer(1, 12))

        # ======== Tabla con información general ========
        info_general = [
            ['Tema', getattr(config, 'nombre_capacitacion', '')],
            ['Ciudad', getattr(config, 'ciudad_capacitacion', ''), 'Fecha', fecha_obj.strftime('%d/%m/%Y')],
            ['Nombre del Instructor', getattr(config, 'nombre_instructor', ''), 'Cargo', getattr(config, 'cargo_instructor', '')],
            ['Firma del Capacitador', '', 'Asesor Externo', getattr(config, 'asesor_externo', '')]
        ]
        tabla_info = Table(info_general, colWidths=[1.5*inch, 2.5*inch, 1.4*inch, 2.5*inch])
        tabla_info.setStyle(TableStyle([
            ('SPAN', (1, 0), (3, 0)),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        story.append(tabla_info)
        story.append(Spacer(1, 20))

        
        # Tabla de asistentes
        if asistentes:
            # Encabezados de la tabla
            data = [['#', 'Nombres y Apellidos', 'Documento', 'Cargo', 'Ruta', 'Ciudad', 'Firma']]
            
            # Agregar datos de asistentes
            for i, asistente in enumerate(asistentes, 1):
                firma_path = ""
                if asistente.firma_digital:
                    firma_absoluta = os.path.join(current_app.root_path, 'static', asistente.firma_digital)
                    if os.path.exists(firma_absoluta):
                        firma_path = Image(firma_absoluta, width=0.8*inch, height=0.4*inch)
                    else:
                        firma_path = "Sin firma"
                else:
                    firma_path = "Sin firma"

                data.append([
                    str(i),
                    asistente.nombres_apellidos,
                    asistente.numero_documento,
                    asistente.cargo,
                    asistente.ruta,
                    asistente.ciudad,
                    firma_path
                ])
            
            # Crear tabla
            table = Table(data, colWidths=[0.5*inch, 1.6*inch, 1.2*inch, 1.4*inch, 0.6*inch, 1*inch, 1.6*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(table)
            story.append(Spacer(1, 20))
            story.append(Paragraph(f"<b>Total de asistentes:</b> {len(asistentes)}", styles['Normal']))
        else:
            story.append(Paragraph("No hay asistentes registrados para esta fecha.", styles['Normal']))
        
        # Generar PDF
        doc.build(story)
        
        # Enviar archivo
        return send_file(
            temp_path,
            as_attachment=True,
            download_name=f"lista_asistencia_{fecha_filtro}.pdf",
            mimetype='application/pdf'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/dashboard', methods=['GET'])
@requiere_autenticacion
def dashboard():
    """Obtiene estadísticas para el dashboard"""
    try:
        fecha_hoy = date.today()
        
        # Asistentes de hoy
        asistentes_hoy = Asistente.query.filter_by(fecha_registro=fecha_hoy).count()
        
        # Asistentes por cargo
        asistentes_por_cargo = db.session.query(
            Asistente.cargo, 
            db.func.count(Asistente.id)
        ).filter_by(fecha_registro=fecha_hoy).group_by(Asistente.cargo).all()
        
        # Asistentes por ruta
        asistentes_por_ruta = db.session.query(
            Asistente.ruta, 
            db.func.count(Asistente.id)
        ).filter_by(fecha_registro=fecha_hoy).group_by(Asistente.ruta).all()
        
        # Configuración actual
        config = Configuracion.query.first()
        
        return jsonify({
            'asistentes_hoy': asistentes_hoy,
            'por_cargo': dict(asistentes_por_cargo),
            'por_ruta': dict(asistentes_por_ruta),
            'sistema_activo': config.esta_en_horario() if config else False,
            'fecha': fecha_hoy.strftime('%Y-%m-%d')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

