import pymysql
pymysql.install_as_MySQLdb()

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager



#   GESTIÓN DE BARRIOS


class Comunidad(models.Model):
    nombre      = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    ubicacion   = models.CharField(max_length=200, blank=True)
    latitud     = models.FloatField(null=True, blank=True)
    longitud    = models.FloatField(null=True, blank=True)
    activo      = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Comunidad"
        verbose_name_plural = "Comunidades"

    def __str__(self):
        return self.nombre


class PuntoMonitoreo(models.Model):
    comunidad   = models.ForeignKey(Comunidad, on_delete=models.CASCADE, related_name="puntos")
    nombre      = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    latitud     = models.FloatField(null=True, blank=True)
    longitud    = models.FloatField(null=True, blank=True)
    activo      = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Punto de monitoreo"
        verbose_name_plural = "Puntos de monitoreo"

    def __str__(self):
        return f"{self.comunidad} — {self.nombre}"



#   GESTIÓN DE USUARIOS


class Rol(models.Model):
    nombre      = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)
    activo      = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Rol"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.nombre


class Usuario(models.Model):
    comunidad   = models.ForeignKey(Comunidad, on_delete=models.SET_NULL, null=True, blank=True, related_name="usuarios")
    nombre      = models.CharField(max_length=100)
    apellido    = models.CharField(max_length=100, blank=True)
    correo      = models.EmailField(unique=True)
    contrasena  = models.CharField(max_length=255)
    telefono    = models.CharField(max_length=20, blank=True)
    activo      = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.nombre} {self.apellido}"


class UsuarioRol(models.Model):
    usuario    = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="roles")
    rol        = models.ForeignKey(Rol,     on_delete=models.CASCADE, related_name="usuarios")
    asignado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Usuario-Rol"
        verbose_name_plural = "Usuarios-Roles"
        unique_together     = ("usuario", "rol")

    def __str__(self):
        return f"{self.usuario} → {self.rol}"


# =====================================================
#   GESTIÓN DE DISPOSITIVOS
# =====================================================

class Actuador(models.Model):
    TIPOS = [
        ("BOMBA",    "Bomba de agua"),
        ("FILTRO",   "Filtro"),
        ("ALARMA",   "Alarma"),
        ("VALVULA",  "Válvula"),
        ("OTRO",     "Otro"),
    ]

    comunidad   = models.ForeignKey(Comunidad, on_delete=models.CASCADE, related_name="actuadores")
    nombre      = models.CharField(max_length=100)
    tipo        = models.CharField(max_length=50, choices=TIPOS)
    descripcion = models.TextField(blank=True)
    activo      = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Actuador"
        verbose_name_plural = "Actuadores"

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"


class Dispositivo(models.Model):
    comunidad   = models.ForeignKey(Comunidad, on_delete=models.CASCADE, related_name="dispositivos")
    actuador    = models.ForeignKey(Actuador,  on_delete=models.SET_NULL, null=True, blank=True, related_name="dispositivos")
    nombre      = models.CharField(max_length=100)
    mac_address = models.CharField(max_length=50, unique=True, blank=True)
    ip_address  = models.CharField(max_length=50, blank=True)
    ubicacion   = models.CharField(max_length=200, blank=True)
    firmware    = models.CharField(max_length=50, blank=True)
    activo      = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "Dispositivo"
        verbose_name_plural = "Dispositivos"

    def __str__(self):
        return self.nombre


class Sensor(models.Model):
    TIPOS = [
        ("TEMPERATURA",   "Temperatura"),
        ("TURBIDEZ",      "Turbidez"),
        ("CONDUCTIVIDAD", "Conductividad"),
        ("PH",            "pH"),
        ("OTRO",          "Otro"),
    ]

    dispositivo = models.ForeignKey(Dispositivo, on_delete=models.CASCADE, related_name="sensores")
    nombre      = models.CharField(max_length=100)
    tipo        = models.CharField(max_length=50, choices=TIPOS)
    unidad      = models.CharField(max_length=20, blank=True)
    activo      = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Sensor"
        verbose_name_plural = "Sensores"

    def __str__(self):
        return f"{self.dispositivo} — {self.nombre}"


class LecturaSensor(models.Model):
    dispositivo   = models.ForeignKey(Dispositivo, on_delete=models.CASCADE, related_name="lecturas")
    sensor        = models.ForeignKey(Sensor,      on_delete=models.CASCADE, related_name="lecturas")
    temperatura   = models.FloatField()
    turbidez      = models.IntegerField()
    conductividad = models.IntegerField()
    ph            = models.FloatField()
    estado        = models.CharField(max_length=50)
    fecha         = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Lectura de sensor"
        verbose_name_plural = "Lecturas de sensores"
        ordering            = ["-fecha"]

    def __str__(self):
        return f"{self.dispositivo} | {self.temperatura}°C | {self.fecha:%Y-%m-%d %H:%M}"


class EstadoActuador(models.Model):
    ESTADOS = [
        ("ENCENDIDO", "Encendido"),
        ("APAGADO",   "Apagado"),
        ("ERROR",     "Error"),
    ]

    actuador   = models.ForeignKey(Actuador,    on_delete=models.CASCADE, related_name="estados")
    dispositivo= models.ForeignKey(Dispositivo, on_delete=models.CASCADE, related_name="estados_actuador")
    estado     = models.CharField(max_length=20, choices=ESTADOS, default="APAGADO")
    observacion= models.TextField(blank=True)
    fecha      = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Estado de actuador"
        verbose_name_plural = "Estados de actuadores"
        ordering            = ["-fecha"]

    def __str__(self):
        return f"{self.actuador} → {self.estado}"


class ComandoRemoto(models.Model):
    COMANDOS = [
        ("SINCRONIZAR",       "Sincronizar"),
        ("ACTIVAR_ALARMA",    "Activar alarma"),
        ("DESACTIVAR_ALARMA", "Desactivar alarma"),
        ("ENCENDER_FILTRADO", "Encender filtrado"),
        ("APAGAR_FILTRADO",   "Apagar filtrado"),
        ("REINICIAR",         "Reiniciar dispositivo"),
    ]

    dispositivo = models.ForeignKey(Dispositivo, on_delete=models.CASCADE, related_name="comandos")
    usuario     = models.ForeignKey(Usuario,     on_delete=models.SET_NULL, null=True, blank=True)
    comando     = models.CharField(max_length=100, choices=COMANDOS)
    ejecutado   = models.BooleanField(default=False)
    fecha       = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Comando remoto"
        verbose_name_plural = "Comandos remotos"
        ordering            = ["-fecha"]

    def __str__(self):
        return f"{self.dispositivo} → {self.comando}"


class RespuestaComando(models.Model):
    comando    = models.OneToOneField(ComandoRemoto, on_delete=models.CASCADE, related_name="respuesta")
    exitoso    = models.BooleanField(default=False)
    mensaje    = models.TextField(blank=True)
    fecha      = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Respuesta de comando"
        verbose_name_plural = "Respuestas de comandos"

    def __str__(self):
        return f"{self.comando} → {'OK' if self.exitoso else 'ERROR'}"


class LogConexion(models.Model):
    EVENTOS = [
        ("CONECTADO",    "Conectado"),
        ("DESCONECTADO", "Desconectado"),
        ("ERROR",        "Error"),
    ]

    dispositivo = models.ForeignKey(Dispositivo, on_delete=models.CASCADE, related_name="logs")
    evento      = models.CharField(max_length=50, choices=EVENTOS)
    ip_address  = models.CharField(max_length=50, blank=True)
    detalle     = models.TextField(blank=True)
    fecha       = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Log de conexión"
        verbose_name_plural = "Logs de conexión"
        ordering            = ["-fecha"]

    def __str__(self):
        return f"{self.dispositivo} | {self.evento} | {self.fecha:%Y-%m-%d %H:%M}"


class Notificacion(models.Model):
    TIPOS = [
        ("ALERTA",    "Alerta"),
        ("INFO",      "Información"),
        ("ERROR",     "Error"),
    ]

    dispositivo = models.ForeignKey(Dispositivo, on_delete=models.CASCADE, related_name="notificaciones")
    usuario     = models.ForeignKey(Usuario,     on_delete=models.SET_NULL, null=True, blank=True)
    tipo        = models.CharField(max_length=20, choices=TIPOS)
    titulo      = models.CharField(max_length=100)
    mensaje     = models.TextField()
    leida       = models.BooleanField(default=False)
    fecha       = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering            = ["-fecha"]

    def __str__(self):
        return f"{self.titulo} — {self.tipo}"


class Auditoria(models.Model):
    dispositivo = models.ForeignKey(Dispositivo, on_delete=models.CASCADE, related_name="auditorias")
    usuario     = models.ForeignKey(Usuario,     on_delete=models.SET_NULL, null=True, blank=True)
    accion      = models.CharField(max_length=100)
    detalle     = models.TextField(blank=True)
    ip_address  = models.CharField(max_length=50, blank=True)
    fecha       = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Auditoría"
        verbose_name_plural = "Auditorías"
        ordering            = ["-fecha"]

    def __str__(self):
        return f"{self.accion} | {self.fecha:%Y-%m-%d %H:%M}"



#   GESTIÓN DE CALIDAD


class TipoVariable(models.Model):
    nombre      = models.CharField(max_length=50)
    unidad      = models.CharField(max_length=20)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name        = "Tipo de variable"
        verbose_name_plural = "Tipos de variables"

    def __str__(self):
        return f"{self.nombre} ({self.unidad})"


class UmbralCalidad(models.Model):
    dispositivo              = models.OneToOneField(Dispositivo, on_delete=models.CASCADE, related_name="umbral")
    tipo_variable            = models.ForeignKey(TipoVariable,  on_delete=models.SET_NULL, null=True, blank=True)

    temp_max_peligro         = models.FloatField(default=60.0)
    temp_min_precaucion      = models.FloatField(default=10.0)

    turbidez_peligro         = models.IntegerField(default=600)
    turbidez_precaucion      = models.IntegerField(default=300)

    conductividad_peligro    = models.IntegerField(default=600)
    conductividad_precaucion = models.IntegerField(default=300)

    ph_min_peligro           = models.FloatField(default=4.0)
    ph_max_peligro           = models.FloatField(default=10.0)
    ph_min_precaucion        = models.FloatField(default=6.0)
    ph_max_precaucion        = models.FloatField(default=8.5)

    class Meta:
        verbose_name        = "Umbral de calidad"
        verbose_name_plural = "Umbrales de calidad"

    def __str__(self):
        return f"Umbrales de {self.dispositivo}"


class EstadoCalidadAgua(models.Model):
    NIVELES = [
        ("VERDE",    "Agua apta"),
        ("AMARILLO", "Precaución"),
        ("ROJO",     "Peligro"),
    ]

    dispositivo     = models.ForeignKey(Dispositivo,   on_delete=models.CASCADE, related_name="estados_calidad")
    lectura         = models.ForeignKey(LecturaSensor, on_delete=models.CASCADE, related_name="estados_calidad")
    nivel           = models.CharField(max_length=20,  choices=NIVELES)
    mensaje_estado  = models.CharField(max_length=100)
    mensaje_detalle = models.CharField(max_length=200)
    fecha           = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Estado de calidad del agua"
        verbose_name_plural = "Estados de calidad del agua"
        ordering            = ["-fecha"]

    def __str__(self):
        return f"{self.dispositivo} | {self.nivel} | {self.fecha:%Y-%m-%d %H:%M}"


class Alerta(models.Model):
    NIVELES = [
        ("VERDE",    "Verde"),
        ("AMARILLO", "Amarillo"),
        ("ROJO",     "Rojo"),
    ]

    comunidad       = models.ForeignKey(Comunidad,        on_delete=models.CASCADE, related_name="alertas")
    dispositivo     = models.ForeignKey(Dispositivo,      on_delete=models.CASCADE, related_name="alertas")
    lectura         = models.ForeignKey(LecturaSensor,    on_delete=models.CASCADE, related_name="alertas")
    nivel_alerta    = models.CharField(max_length=20,     choices=NIVELES)
    mensaje_estado  = models.CharField(max_length=100)
    mensaje_detalle = models.CharField(max_length=200)
    resuelta        = models.BooleanField(default=False)
    fecha           = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Alerta"
        verbose_name_plural = "Alertas"
        ordering            = ["-fecha"]

    def __str__(self):
        return f"{self.dispositivo} | {self.nivel_alerta} | {self.fecha:%Y-%m-%d %H:%M}"