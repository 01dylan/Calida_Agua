from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import (
    Comunidad, PuntoMonitoreo,
    Rol, Usuario, UsuarioRol,
    Actuador, Dispositivo, Sensor,
    LecturaSensor, EstadoActuador,
    ComandoRemoto, RespuestaComando,
    LogConexion, Notificacion, Auditoria,
    TipoVariable, UmbralCalidad,
    EstadoCalidadAgua, Alerta,
)
import json


# =====================================================
#   PÁGINAS HTML
# =====================================================
def login_view(request):
    return render(request, "login.html")

def dashboard(request):
    return render(request, "dashboard.html")

def crud(request):
    return render(request, "crud.html")


# =====================================================
#   AUTH
# =====================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        "id":       request.user.id,
        "username": request.user.username,
        "email":    request.user.email,
        "is_staff": request.user.is_staff,
    })


#   COMUNIDADES
def get_comunidades(request):
    data = list(Comunidad.objects.values())
    return JsonResponse(data, safe=False)

@csrf_exempt
@csrf_exempt
def create_comunidad(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        obj  = Comunidad.objects.create(
            nombre       = data["nombre"],
            descripcion  = data.get("descripcion", ""),
            ubicacion    = data.get("ubicacion", ""),
            pais         = data.get("pais", "Colombia"),
            departamento = data.get("departamento", ""),
            municipio    = data.get("municipio", ""),
            latitud      = data.get("latitud"),
            longitud     = data.get("longitud"),
        )
        return JsonResponse({"ok": True, "id": obj.id})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_comunidad(request, pk):
    if request.method != "PUT":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        obj  = Comunidad.objects.get(id=pk)
        data = json.loads(request.body)
        obj.nombre       = data.get("nombre",       obj.nombre)
        obj.descripcion  = data.get("descripcion",  obj.descripcion)
        obj.ubicacion    = data.get("ubicacion",    obj.ubicacion)
        obj.pais         = data.get("pais",         obj.pais)
        obj.departamento = data.get("departamento", obj.departamento)
        obj.municipio    = data.get("municipio",    obj.municipio)
        obj.latitud      = data.get("latitud",      obj.latitud)
        obj.longitud     = data.get("longitud",     obj.longitud)
        obj.activo       = data.get("activo",       obj.activo)
        obj.save()
        return JsonResponse({"ok": True})
    except Comunidad.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_comunidad(request, pk):
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        Comunidad.objects.get(id=pk).delete()
        return JsonResponse({"ok": True})
    except Comunidad.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)



#   DISPOSITIVOS

def get_dispositivos(request):
    comunidad_id = request.GET.get("comunidad_id")
    qs = Dispositivo.objects.all()
    if comunidad_id:
        qs = qs.filter(comunidad_id=comunidad_id)
    return JsonResponse(list(qs.values()), safe=False)

@csrf_exempt
def create_dispositivo(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        obj  = Dispositivo.objects.create(
            comunidad_id = data["comunidad_id"],
            nombre       = data["nombre"],
            mac_address  = data.get("mac_address", ""),
            ip_address   = data.get("ip_address",  ""),
            ubicacion    = data.get("ubicacion",   ""),
            firmware     = data.get("firmware",    ""),
        )
        UmbralCalidad.objects.create(dispositivo=obj)
        return JsonResponse({"ok": True, "id": obj.id})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_dispositivo(request, pk):
    if request.method != "PUT":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        obj  = Dispositivo.objects.get(id=pk)
        data = json.loads(request.body)
        obj.nombre      = data.get("nombre",      obj.nombre)
        obj.mac_address = data.get("mac_address", obj.mac_address)
        obj.ip_address  = data.get("ip_address",  obj.ip_address)
        obj.ubicacion   = data.get("ubicacion",   obj.ubicacion)
        obj.activo      = data.get("activo",      obj.activo)
        obj.save()
        return JsonResponse({"ok": True})
    except Dispositivo.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_dispositivo(request, pk):
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        Dispositivo.objects.get(id=pk).delete()
        return JsonResponse({"ok": True})
    except Dispositivo.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)



#   SENSORES

def get_sensores(request):
    return JsonResponse(list(Sensor.objects.values()), safe=False)

@csrf_exempt
def create_sensor(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        obj  = Sensor.objects.create(
            dispositivo_id = data["dispositivo_id"],
            nombre         = data["nombre"],
            tipo           = data["tipo"],
            unidad         = data.get("unidad", ""),
        )
        return JsonResponse({"ok": True, "id": obj.id})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_sensor(request, pk):
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        Sensor.objects.get(id=pk).delete()
        return JsonResponse({"ok": True})
    except Sensor.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)




#   LECTURAS

def get_lecturas(request):
    dispositivo_id = request.GET.get("dispositivo_id")
    fuente         = request.GET.get("fuente")
    limit          = int(request.GET.get("limit", 50))
    qs             = LecturaSensor.objects.all()
    if dispositivo_id:
        qs = qs.filter(dispositivo_id=dispositivo_id)
    if fuente:
        qs = qs.filter(fuente=fuente)
    return JsonResponse(list(qs.values(
        "id", "dispositivo_id", "temperatura", "turbidez",
        "conductividad", "ph", "estado", "fuente",
        "registrado_por", "fecha"
    )[:limit]), safe=False)

def get_latest_lectura(request):
    dispositivo_id = request.GET.get("dispositivo_id")
    try:
        qs = LecturaSensor.objects.all()
        if dispositivo_id:
            qs = qs.filter(dispositivo_id=dispositivo_id)
        r = qs.latest("fecha")
        return JsonResponse({
            "id":            r.id,
            "dispositivo_id":r.dispositivo_id,
            "temperatura":   r.temperatura,
            "turbidez":      r.turbidez,
            "conductividad": r.conductividad,
            "ph":            r.ph,
            "estado":        r.estado,
            "fecha":         r.fecha.strftime("%Y-%m-%d %H:%M:%S"),
        })
    except LecturaSensor.DoesNotExist:
        return JsonResponse({"error": "Sin lecturas"}, status=404)

@csrf_exempt
def create_lectura(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        
        # Intentamos obtener el dispositivo por dispositivo_id o por mac_address
        dispositivo_id = data.get("dispositivo_id")
        mac = data.get("mac")
        
        dispositivo = None
        if dispositivo_id:
            try:
                dispositivo = Dispositivo.objects.get(id=dispositivo_id)
            except Dispositivo.DoesNotExist:
                return JsonResponse({"error": f"Dispositivo con ID {dispositivo_id} no existe"}, status=404)
        elif mac:
            dispositivo = Dispositivo.objects.filter(mac_address=mac).first()
            if not dispositivo:
                # Si no existe, creamos una comunidad por defecto y luego el dispositivo
                comunidad = Comunidad.objects.first()
                if not comunidad:
                    comunidad = Comunidad.objects.create(
                        nombre="Comunidad General",
                        descripcion="Creada automáticamente para recibir datos de ESP32",
                        ubicacion="Principal"
                    )
                
                dispositivo = Dispositivo.objects.create(
                    comunidad=comunidad,
                    nombre=f"ESP32 ({mac})",
                    mac_address=mac,
                    activo=True
                )
                # Creamos el umbral de calidad por defecto
                UmbralCalidad.objects.create(dispositivo=dispositivo)
        else:
            return JsonResponse({"error": "Debe proporcionar dispositivo_id o mac"}, status=400)

        # Buscar o crear sensor principal para el dispositivo
        sensor = Sensor.objects.filter(dispositivo=dispositivo).first()
        if not sensor:
            sensor = Sensor.objects.create(
                dispositivo=dispositivo,
                nombre='Sensor principal',
                tipo='PH',
                unidad='pH',
                activo=True
            )

        try:
            th = dispositivo.umbral
        except UmbralCalidad.DoesNotExist:
            th = UmbralCalidad.objects.create(
                dispositivo=dispositivo,
                temp_max_peligro=60,    temp_min_precaucion=10,
                turbidez_peligro=600,   turbidez_precaucion=300,
                conductividad_peligro=600, conductividad_precaucion=300,
                ph_min_peligro=4.0,     ph_max_peligro=10.0,
                ph_min_precaucion=6.0,  ph_max_precaucion=8.5,
            )

        temp = float(data.get("temperatura", 0.0))
        turb = int(data.get("turbidez", 0))
        cond = int(data.get("conductividad", data.get("tds", 0)))
        ph   = float(data.get("ph", 7.0))

        es_peligro = (
            temp >= th.temp_max_peligro or turb > th.turbidez_peligro or
            cond > th.conductividad_peligro or ph < th.ph_min_peligro or
            ph > th.ph_max_peligro
        )
        es_precaucion = (
            temp < th.temp_min_precaucion or turb > th.turbidez_precaucion or
            cond > th.conductividad_precaucion or ph < th.ph_min_precaucion or
            ph > th.ph_max_precaucion
        )

        if es_peligro:
            nivel, estado, detalle = "ROJO", "ADVERTENCIA", "AGUA PELIGROSA"
        elif es_precaucion:
            nivel, estado, detalle = "AMARILLO", "PRECAUCION", "Tenga cuidado"
        else:
            nivel, estado, detalle = "VERDE", "AGUA APTA", "Agua es segura"

        from django.utils import timezone
        from django.utils.dateparse import parse_datetime

        fecha_raw = data.get("fecha")
        if fecha_raw:
            fecha = parse_datetime(fecha_raw)
            if not fecha:
                fecha = timezone.now()
        else:
            fecha = timezone.now()

        fuente         = data.get("fuente", "ESP32")
        registrado_por = data.get("registrado_por", "")

        lectura = LecturaSensor.objects.create(
            dispositivo    = dispositivo,
            sensor         = sensor,
            temperatura    = temp,
            turbidez       = turb,
            conductividad  = cond,
            ph             = ph,
            estado         = estado,
            fecha          = fecha,
            fuente         = fuente,
            registrado_por = registrado_por,
        )

        Alerta.objects.create(
            comunidad       = dispositivo.comunidad,
            dispositivo     = dispositivo,
            lectura         = lectura,
            nivel_alerta    = nivel,
            mensaje_estado  = estado,
            mensaje_detalle = detalle,
        )
        EstadoCalidadAgua.objects.create(
            dispositivo     = dispositivo,
            lectura         = lectura,
            nivel           = nivel,
            mensaje_estado  = estado,
            mensaje_detalle = detalle,
        )

        return JsonResponse({
            "ok":     True,
            "id":     lectura.id,
            "estado": estado,
            "nivel":  nivel,
            "fuente": fuente,
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
@csrf_exempt
def delete_lectura(request, pk):
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        LecturaSensor.objects.get(id=pk).delete()
        return JsonResponse({"ok": True})
    except LecturaSensor.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)


#   ALERTAS

def get_alertas(request):
    dispositivo_id = request.GET.get("dispositivo_id")
    qs = Alerta.objects.all()
    if dispositivo_id:
        qs = qs.filter(dispositivo_id=dispositivo_id)
    return JsonResponse(list(qs.values()[:50]), safe=False)



#   UMBRALES

def get_umbral(request):
    dispositivo_id = request.GET.get("dispositivo_id")
    try:
        th = UmbralCalidad.objects.get(dispositivo_id=dispositivo_id)
        return JsonResponse({
            "temp_max_peligro":          th.temp_max_peligro,
            "temp_min_precaucion":       th.temp_min_precaucion,
            "turbidez_peligro":          th.turbidez_peligro,
            "turbidez_precaucion":       th.turbidez_precaucion,
            "conductividad_peligro":     th.conductividad_peligro,
            "conductividad_precaucion":  th.conductividad_precaucion,
            "ph_min_peligro":            th.ph_min_peligro,
            "ph_max_peligro":            th.ph_max_peligro,
            "ph_min_precaucion":         th.ph_min_precaucion,
            "ph_max_precaucion":         th.ph_max_precaucion,
        })
    except UmbralCalidad.DoesNotExist:
        return JsonResponse({"error": "Sin umbrales"}, status=404)

@csrf_exempt
def update_umbral(request, dispositivo_id):
    if request.method != "PUT":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        th   = UmbralCalidad.objects.get(dispositivo_id=dispositivo_id)
        data = json.loads(request.body)
        for campo in [
            "temp_max_peligro","temp_min_precaucion",
            "turbidez_peligro","turbidez_precaucion",
            "conductividad_peligro","conductividad_precaucion",
            "ph_min_peligro","ph_max_peligro",
            "ph_min_precaucion","ph_max_precaucion",
        ]:
            if campo in data:
                setattr(th, campo, data[campo])
        th.save()
        return JsonResponse({"ok": True})
    except UmbralCalidad.DoesNotExist:
        return JsonResponse({"error": "Sin umbrales"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)



#   COMANDOS

def get_comandos(request):
    return JsonResponse(list(ComandoRemoto.objects.values()[:50]), safe=False)

@csrf_exempt
def create_comando(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        obj  = ComandoRemoto.objects.create(
            dispositivo_id = data["dispositivo_id"],
            comando        = data["comando"],
        )
        return JsonResponse({"ok": True, "id": obj.id})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def get_latest_comando(request):
    dispositivo_id = request.GET.get("dispositivo_id")
    try:
        qs = ComandoRemoto.objects.filter(ejecutado=False)
        if dispositivo_id:
            qs = qs.filter(dispositivo_id=dispositivo_id)
        obj           = qs.latest("fecha")
        obj.ejecutado = True
        obj.save()
        return JsonResponse({"comando": obj.comando, "id": obj.id})
    except ComandoRemoto.DoesNotExist:
        return JsonResponse({"comando": None})



#   USUARIOS

def get_usuarios(request):
    return JsonResponse(list(Usuario.objects.values(
        "id","nombre","apellido","correo","telefono","activo","created_at"
    )), safe=False)

@csrf_exempt
def create_usuario(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        obj  = Usuario.objects.create(
            comunidad_id = data.get("comunidad_id"),
            nombre       = data["nombre"],
            apellido     = data.get("apellido", ""),
            correo       = data["correo"],
            contrasena   = data["contrasena"],
            telefono     = data.get("telefono", ""),
        )
        return JsonResponse({"ok": True, "id": obj.id})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_usuario(request, pk):
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        Usuario.objects.get(id=pk).delete()
        return JsonResponse({"ok": True})
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)



#   LOGS

@csrf_exempt
def create_log(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        obj  = LogConexion.objects.create(
            dispositivo_id = data["dispositivo_id"],
            evento         = data["evento"],
            ip_address     = data.get("ip_address", ""),
            detalle        = data.get("detalle", ""),
        )
        return JsonResponse({"ok": True, "id": obj.id})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

#   ROLES

def get_roles(request):
    return JsonResponse(list(Rol.objects.values(
        'id', 'nombre', 'descripcion', 'activo'
    )), safe=False)

@csrf_exempt
def create_rol(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        obj  = Rol.objects.create(
            nombre      = data["nombre"],
            descripcion = data.get("descripcion", ""),
            activo      = data.get("activo", True),
        )
        return JsonResponse({"ok": True, "id": obj.id, "nombre": obj.nombre,
                             "descripcion": obj.descripcion, "activo": obj.activo})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_rol(request, pk):
    if request.method != "PUT":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        obj  = Rol.objects.get(id=pk)
        data = json.loads(request.body)
        obj.nombre      = data.get("nombre",      obj.nombre)
        obj.descripcion = data.get("descripcion", obj.descripcion)
        obj.activo      = data.get("activo",      obj.activo)
        obj.save()
        return JsonResponse({"ok": True, "id": obj.id, "nombre": obj.nombre,
                             "descripcion": obj.descripcion, "activo": obj.activo})
    except Rol.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_rol(request, pk):
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        Rol.objects.get(id=pk).delete()
        return JsonResponse({"ok": True})
    except Rol.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)



#   USUARIOS ROLES

def get_usuarios_roles(request):
    return JsonResponse(list(UsuarioRol.objects.values(
        'id', 'usuario_id', 'rol_id'
    )), safe=False)

@csrf_exempt
def create_usuario_rol(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        obj  = UsuarioRol.objects.create(
            usuario_id = data["usuario"],
            rol_id     = data["rol"],
        )
        return JsonResponse({"ok": True, "id": obj.id,
                             "usuario": obj.usuario_id, "rol": obj.rol_id})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_usuario_rol(request, pk):
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        UsuarioRol.objects.get(id=pk).delete()
        return JsonResponse({"ok": True})
    except UsuarioRol.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)

# =====================================================
#   USUARIOS DJANGO (para gestión desde el frontend)
# =====================================================
def get_django_usuarios(request):
    from django.contrib.auth.models import User
    usuarios = User.objects.all().values(
        'id', 'username', 'email', 'first_name', 
        'last_name', 'is_staff', 'is_active', 'date_joined'
    )
    return JsonResponse(list(usuarios), safe=False)

@csrf_exempt
def create_django_usuario(request):
    from django.contrib.auth.models import User
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        if User.objects.filter(username=data["username"]).exists():
            return JsonResponse({"error": "El usuario ya existe"}, status=400)
        user = User.objects.create_user(
            username   = data["username"],
            password   = data["password"],
            email      = data.get("email", ""),
            first_name = data.get("nombre", ""),
            last_name  = data.get("apellido", ""),
            is_staff   = data.get("is_staff", False),
        )
        return JsonResponse({
            "ok": True,
            "id": user.id,
            "username": user.username,
            "is_staff": user.is_staff
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def update_django_usuario(request, pk):
    from django.contrib.auth.models import User
    if request.method != "PUT":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        user = User.objects.get(id=pk)
        data = json.loads(request.body)
        user.email      = data.get("email",     user.email)
        user.first_name = data.get("nombre",    user.first_name)
        user.last_name  = data.get("apellido",  user.last_name)
        user.is_staff   = data.get("is_staff",  user.is_staff)
        user.is_active  = data.get("is_active", user.is_active)
        if data.get("password"):
            user.set_password(data["password"])
        user.save()
        return JsonResponse({"ok": True})
    except User.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def delete_django_usuario(request, pk):
    from django.contrib.auth.models import User
    if request.method != "DELETE":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        User.objects.get(id=pk).delete()
        return JsonResponse({"ok": True})
    except User.DoesNotExist:
        return JsonResponse({"error": "No encontrado"}, status=404)