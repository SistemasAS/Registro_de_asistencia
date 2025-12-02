from flask import Blueprint, request, jsonify, session, send_file, current_app
from src.models.asistencia import db, Administrador, Configuracion, Asistente, Capacitador
from datetime import datetime, date
import os
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from werkzeug.utils import secure_filename
from reportlab.lib.utils import ImageReader
from functools import wraps
import tempfile

admin_bp = Blueprint('admin', __name__)

UPLOAD_FOLDER = "static/firmas"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

# Crear carpeta si no existe
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def requiere_autenticacion(f):
    """Decorador para rutas que requieren autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            return jsonify({'error': 'Autenticación requerida'}), 401
        return f(*args, **kwargs)
    return decorated_function


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


@admin_bp.route('/configuracion', methods=['GET'])
@requiere_autenticacion
def obtener_configuracion():
    """Obtiene la configuración ACTIVA actual"""
    try:
        print("🔍 Buscando configuración activa...")
        
        # ✅ Buscar la configuración activa
        config = Configuracion.query.filter_by(activo=True).first()
        
        # Si no hay activa, obtener la más reciente
        if not config:
            config = Configuracion.query.order_by(Configuracion.id.desc()).first()
        
        if not config:
            print("❌ No se encontró ninguna configuración")
            return jsonify({'error': 'No hay configuración'}), 404
        
        print(f"✅ Configuración encontrada: ID={config.id}, Nombre={config.nombre_capacitacion}")
        
        result = config.to_dict()
        return jsonify(result)
    
    except Exception as e:
        import traceback
        print("❌ ERROR en /admin/configuracion:")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/configuracion', methods=['POST'])
@requiere_autenticacion
def crear_nueva_configuracion():
    """Crea una NUEVA configuración en lugar de actualizar la existente"""
    try:
        data = request.get_json()
        print("🔍 Datos recibidos para nueva configuración:")
        print(data)
        
        # ✅ CREAR una nueva configuración en lugar de actualizar
        nueva_config = Configuracion(
            nombre_capacitacion=data.get('nombre_capacitacion'),
            ciudad_capacitacion=data.get('ciudad_capacitacion'),
            modalidad_capacitacion=data.get('modalidad_capacitacion'),
            hora_inicio=datetime.strptime(data.get('hora_inicio'), '%H:%M').time() if data.get('hora_inicio') else None,
            hora_fin=datetime.strptime(data.get('hora_fin'), '%H:%M').time() if data.get('hora_fin') else None,
            fecha_capacitacion=datetime.strptime(data.get('fecha_capacitacion'), '%Y-%m-%d').date() if data.get('fecha_capacitacion') else None,
            activo=data.get('activo', True),
            asesor_externo=data.get('asesor_externo'),
            nombre_empresa=data.get('nombre_empresa', 'AUTOSNACK SAS'),
            direccion_empresa=data.get('direccion_empresa', 'Av. boyacá #95-51'),
            telefono_empresa=data.get('telefono_empresa', '(601) 743 3904'),
            logo_empresa='logotipo.png'
        )
        
        # ✅ DESACTIVAR todas las demás configuraciones
        Configuracion.query.update({Configuracion.activo: False})
        
        db.session.add(nueva_config)
        db.session.commit()
        
        print(f"✅ Nueva configuración creada con ID: {nueva_config.id}")
        
        return jsonify({
            'mensaje': 'Nueva configuración creada exitosamente',
            'configuracion': nueva_config.to_dict()
        })
    
    except Exception as e:
        import traceback
        db.session.rollback()
        print("❌ ERROR al crear configuración:")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/asistentes', methods=['GET'])
@requiere_autenticacion
def listar_asistentes_admin():
    """Lista todos los asistentes con filtros"""
    try:
        fecha_filtro = request.args.get('fecha', '')
        capacitacion_id = request.args.get('capacitacion_id', '')
        busqueda = request.args.get('busqueda', '')
        cargo_filtro = request.args.get('cargo', '')
        ruta_filtro = request.args.get('ruta', '')
        
        # Construir query base
        query = Asistente.query
        
        # ✅ Filtro por capacitación (PRIORITARIO)
        if capacitacion_id:
            query = query.filter_by(configuracion_id=int(capacitacion_id))
        
        # Filtro por fecha (opcional)
        if fecha_filtro:
            try:
                fecha_obj = datetime.strptime(fecha_filtro, '%Y-%m-%d').date()
                query = query.filter_by(fecha_registro=fecha_obj)
            except ValueError:
                return jsonify({'error': 'Formato de fecha inválido'}), 400
        
        # Otros filtros
        if busqueda:
            query = query.filter(
                (Asistente.nombres_apellidos.contains(busqueda)) |
                (Asistente.numero_documento.contains(busqueda))
            )
        
        if cargo_filtro:
            query = query.filter(Asistente.cargo.contains(cargo_filtro))
        
        if ruta_filtro:
            query = query.filter(Asistente.ruta.contains(ruta_filtro))

        # Ejecutar consulta con orden por hora de llegada
        asistentes = query.order_by(Asistente.hora_llegada).all()

        # Obtener estadísticas
        total_asistentes = len(asistentes)
        cargos_unicos = list(set([a.cargo for a in asistentes]))
        rutas_unicas = list(set([a.ruta for a in asistentes]))

        asistentes_con_info = []
        for asistente in asistentes:
            asistente_dict = asistente.to_dict()
            asistentes_con_info.append(asistente_dict)
        
        return jsonify({
            'asistentes': [asistente.to_dict() for asistente in asistentes],
            'estadisticas': {
                'total': total_asistentes,
                'cargos': cargos_unicos,
                'rutas': rutas_unicas
            },
            'filtros_aplicados': {
                'fecha': fecha_filtro,
                'capacitacion_id': capacitacion_id
            }
        })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
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


def ajustar_firma(ruta_firma, es_capacitador=False):
    """
    Ajusta la imagen de la firma para que se vea bien sin deformar la celda.
    - es_capacitador: True para firmas de capacitadores
    """
    try:
        firma_reader = ImageReader(ruta_firma)
        
        # Tamaños equilibrados
        if es_capacitador:
            max_width = 70
            max_height = 25
        else:
            max_width = 75
            max_height = 25

        width, height = firma_reader.getSize()
        aspect = height / float(width)

        # Escalado proporcional
        if width > max_width:
            width = max_width
            height = width * aspect
        if height > max_height:
            height = max_height
            width = height / aspect

        return Image(ruta_firma, width=width, height=height)
    except Exception as e:
        print(f"⚠️ Error ajustando firma: {e}")
        return ""


@admin_bp.route('/generar-pdf', methods=['GET'])
@requiere_autenticacion
def generar_pdf():
    """Genera un PDF con la lista de asistencia (una o todas las capacitaciones)"""
    try:
        fecha_filtro = request.args.get('fecha', date.today().strftime('%Y-%m-%d'))
        capacitacion_id = request.args.get('capacitacion_id', None)

        try:
            fecha_obj = datetime.strptime(fecha_filtro, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}), 400

        # Construir query según filtro
        query = Asistente.query.filter_by(fecha_registro=fecha_obj)
        
        if capacitacion_id:
            query = query.filter_by(configuracion_id=int(capacitacion_id))
            capacitaciones = [Configuracion.query.get(int(capacitacion_id))]
            
            if not capacitaciones[0]:
                return jsonify({'error': 'Capacitación no encontrada'}), 404
        else:
            asistentes_temp = query.all()
            if not asistentes_temp:
                return jsonify({'error': 'No hay asistentes registrados para esta fecha'}), 404
                
            capacitaciones_ids = list(set([a.configuracion_id for a in asistentes_temp]))
            capacitaciones = Configuracion.query.filter(Configuracion.id.in_(capacitaciones_ids)).all()

        asistentes = query.order_by(Asistente.hora_llegada).all()

        if not asistentes:
            return jsonify({'error': 'No hay asistentes registrados para los filtros seleccionados'}), 404

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_path = temp_file.name
        temp_file.close()

        doc = SimpleDocTemplate(temp_path, pagesize=A4)
        story = []
        styles = getSampleStyleSheet()

        # Iterar por cada capacitación
        for idx, config in enumerate(capacitaciones):
            asistentes_capacitacion = [a for a in asistentes if a.configuracion_id == config.id]
            
            if not asistentes_capacitacion:
                continue

            # ✅ Buscar capacitador de ESTA capacitación específica
            capacitador = Capacitador.query.filter_by(
                configuracion_id=config.id  # ← CAMBIO PRINCIPAL
            ).first()

            # ======== Encabezado Superior ========
            logo_path = os.path.join(current_app.root_path, 'static', 'logotipo.png')
            if os.path.exists(logo_path):
                logo = Image(logo_path)
                logo._restrictSize(1.5*inch, 1.5*inch)
            else:
                logo = Paragraph("LOGO", styles['Normal'])

            titulo_centro = [
                Paragraph("<b>GESTIÓN DEL TALENTO HUMANO</b>",
                          ParagraphStyle(name='SmallTitle', fontSize=12, alignment=TA_CENTER)),
                Spacer(1, 4),
                Paragraph("<b>REGISTRO DE ASISTENCIA</b>",
                          ParagraphStyle(name='MainTitle', fontSize=16, alignment=TA_CENTER))
            ]

            info_derecha = [
                Paragraph("<b>Código: FR-TH-01</b>", 
                          ParagraphStyle(name='InfoStyle', fontSize=9, alignment=TA_CENTER)),
                Paragraph("<b>Versión: 04</b>", 
                          ParagraphStyle(name='InfoStyle', fontSize=9, alignment=TA_CENTER)),
                Paragraph("<b>Fecha de actualización:</b><br/>12/Nov/2025", 
                          ParagraphStyle(name='InfoStyle', fontSize=9, alignment=TA_CENTER))
            ]

            encabezado_data = [[logo, titulo_centro, info_derecha]]
            encabezado_table = Table(encabezado_data, colWidths=[1.8*inch, 4.4*inch, 1.8*inch])
            encabezado_table.setStyle(TableStyle([ 
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'CENTER'),
                ('ALIGN', (2, 0), (2, 0), 'CENTER'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))

            story.append(encabezado_table)
            story.append(Spacer(1, 6))

            # ======== Información del capacitador de ESTA capacitación ========
            nombre_instructor = ""
            firma_img = Paragraph("", styles['Normal'])
            
            if capacitador:
                print(f"✅ Capacitador de '{config.nombre_capacitacion}': {capacitador.nombre_completo}")
                nombre_instructor = capacitador.nombre_completo

                if capacitador.firma_digital:
                    ruta_firma = os.path.join(current_app.root_path, 'static', capacitador.firma_digital)
                    if os.path.exists(ruta_firma):
                        firma_img = ajustar_firma(ruta_firma, es_capacitador=True)
            else:
                print(f"⚠️ No hay capacitador registrado para '{config.nombre_capacitacion}'")

            # ... (resto del código del PDF sin cambios) ...
            
            intensidad_horaria = ""
            if config.hora_inicio and config.hora_fin:
                intensidad_horaria = f"{config.hora_inicio.strftime('%H:%M')} - {config.hora_fin.strftime('%H:%M')}"

            style_label = ParagraphStyle(
                name='Label',
                fontSize=7,
                fontName='Helvetica-Bold',
                alignment=TA_CENTER
            )
            
            style_value = ParagraphStyle(
                name='Value',
                fontSize=7,
                fontName='Helvetica',
                alignment=TA_CENTER
            )

            col_width = 8*inch / 6
            
            info_general = [
                [Paragraph('<b>TEMA:</b>', style_label), 
                Paragraph(config.nombre_capacitacion or '', style_value), 
                '', '', '', ''],
                
                [Paragraph('<b>CIUDAD:</b>', style_label),
                Paragraph(config.ciudad_capacitacion or '', style_value),
                Paragraph('<b>MODALIDAD:</b>', style_label),
                Paragraph(config.modalidad_capacitacion or '', style_value),
                Paragraph('<b>FECHA:</b>', style_label),
                Paragraph(fecha_obj.strftime('%d/%m/%Y'), style_value)],
                
                [Paragraph('<b>INTENSIDAD HORARIA:</b>', style_label),
                Paragraph(intensidad_horaria, style_value),
                Paragraph('<b>ENTIDAD CAPACITADORA:</b>', style_label),
                '',
                Paragraph(config.asesor_externo or config.nombre_empresa or '', style_value),
                ''],
                
                [Paragraph('<b>NOMBRE DEL CAPACITADOR:</b>', style_label),
                '',
                Paragraph(nombre_instructor, style_value),
                Paragraph('<b>FIRMA DEL CAPACITADOR:</b>', style_label),
                '',
                firma_img]
            ]

            col_widths = [col_width] * 6

            tabla_info = Table(info_general, colWidths=col_widths)
            tabla_info.setStyle(TableStyle([
                ('SPAN', (1, 0), (5, 0)),
                ('SPAN', (2, 2), (3, 2)),
                ('SPAN', (4, 2), (5, 2)),
                ('SPAN', (0, 3), (1, 3)),
                ('SPAN', (3, 3), (4, 3)),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('LEFTPADDING', (0, 0), (-1, -1), 2),
                ('RIGHTPADDING', (0, 0), (-1, -1), 2),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))

            story.append(tabla_info)
            story.append(Spacer(1, 12))

            # ======== Tabla de asistentes ========
            style_header = ParagraphStyle(
                name='Header',
                fontSize=7,
                fontName='Helvetica-Bold',
                alignment=TA_CENTER,
                leading=8
            )
            
            style_data = ParagraphStyle(
                name='Data',
                fontSize=8,
                fontName='Helvetica',
                alignment=TA_CENTER,
                leading=7
            )
            
            data = [[
                Paragraph('<b>N°</b>', style_header),
                Paragraph('<b>Tipo de documento</b>', style_header),
                Paragraph('<b>Número de documento</b>', style_header),
                Paragraph('<b>Nombre y apellidos completos</b>', style_header),
                Paragraph('<b>Cargo</b>', style_header),
                Paragraph('<b>Ciudad</b>', style_header),
                Paragraph('<b>Firma</b>', style_header),
                Paragraph('<b>N° Ruta</b>', style_header)
            ]]

            for i, asistente in enumerate(asistentes_capacitacion, 1):
                firma_asistente = Paragraph("", styles['Normal'])
                if asistente.firma_digital:
                    firma_path = os.path.join(current_app.root_path, 'static', asistente.firma_digital)
                    if os.path.exists(firma_path):
                        firma_asistente = ajustar_firma(firma_path, es_capacitador=False)

                data.append([
                    Paragraph(str(i), style_data),
                    Paragraph(asistente.tipodocumento or 'CC', style_data),
                    Paragraph(asistente.numero_documento, style_data),
                    Paragraph(asistente.nombres_apellidos, style_data),
                    Paragraph(asistente.cargo, style_data),
                    Paragraph(asistente.ciudad, style_data),
                    firma_asistente,
                    Paragraph(asistente.ruta, style_data)
                ])

            row_heights = [28] + [23] * len(asistentes_capacitacion)
            
            table = Table(data, 
                         colWidths=[
                             0.3*inch, 0.7*inch, 0.9*inch, 2.2*inch,
                             1.3*inch, 0.8*inch, 1.2*inch, 0.6*inch   
                         ],
                         rowHeights=row_heights)
            
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 7),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 5),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            
            story.append(table)
            story.append(Spacer(1, 15))
            story.append(Paragraph(
                f"<b>Total de asistentes:</b> {len(asistentes_capacitacion)}", 
                styles['Normal']
            ))
            
            if len(capacitaciones) > 1 and idx < len(capacitaciones) - 1:
                story.append(Spacer(1, 0.5*inch))
                story.append(Paragraph("<br/><hr/><br/>", styles['Normal']))

        if len(capacitaciones) > 1:
            story.append(Spacer(1, 20))
            story.append(Paragraph(
                f"<b>Total general de asistentes:</b> {len(asistentes)}", 
                ParagraphStyle(name='TotalGeneral', fontSize=12, fontName='Helvetica-Bold')
            ))

        doc.build(story)

        print(f"✅ PDF generado exitosamente: {temp_path}")

        if capacitacion_id and len(capacitaciones) == 1:
            nombre_cap = capacitaciones[0].nombre_capacitacion.replace(" ", "_")[:30]
            nombre_archivo = f"Lista_{nombre_cap}_{fecha_filtro}.pdf"
        else:
            nombres_caps = "_".join([cap.nombre_capacitacion.replace(" ", "_")[:15] for cap in capacitaciones])
            nombre_archivo = f"Lista_{nombres_caps}_{fecha_filtro}.pdf"

        return send_file(
            temp_path,
            as_attachment=True,
            download_name=nombre_archivo,
            mimetype='application/pdf'
        )

    except Exception as e:
        print(f"❌ Error al generar PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error al generar PDF: {str(e)}'}), 500
    

@admin_bp.route('/configuraciones/listar', methods=['GET'])
@requiere_autenticacion
def listar_configuraciones():
    """Lista las configuraciones, opcionalmente filtradas por fecha"""
    try:
        fecha_filtro = request.args.get('fecha', None)
        
        # ✅ Construir query
        query = Configuracion.query
        
        # ✅ Si hay filtro de fecha, aplicarlo
        if fecha_filtro:
            try:
                fecha_obj = datetime.strptime(fecha_filtro, '%Y-%m-%d').date()
                query = query.filter_by(fecha_capacitacion=fecha_obj)
            except ValueError:
                return jsonify({'error': 'Formato de fecha inválido'}), 400
        
        configuraciones = query.order_by(Configuracion.fecha_capacitacion.desc()).all()
        
        return jsonify({
            'configuraciones': [config.to_dict() for config in configuraciones],
            'total': len(configuraciones),
            'fecha': fecha_filtro
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@admin_bp.route('/configuracion/<int:config_id>/toggle', methods=['POST'])
@requiere_autenticacion
def toggle_configuracion(config_id):
    """Activa/desactiva una configuración específica"""
    try:
        config = Configuracion.query.get(config_id)
        if not config:
            return jsonify({'error': 'Configuración no encontrada'}), 404
        
        # Si se va a activar, desactivar las demás
        if not config.activo:
            Configuracion.query.update({Configuracion.activo: False})
        
        config.activo = not config.activo
        db.session.commit()
        
        return jsonify({
            'mensaje': f'Configuración {"activada" if config.activo else "desactivada"}',
            'configuracion': config.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500