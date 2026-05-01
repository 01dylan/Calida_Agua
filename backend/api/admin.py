from django.contrib import admin
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

admin.site.register(Comunidad)
admin.site.register(PuntoMonitoreo)
admin.site.register(Rol)
admin.site.register(Usuario)
admin.site.register(UsuarioRol)
admin.site.register(Actuador)
admin.site.register(Dispositivo)
admin.site.register(Sensor)
admin.site.register(LecturaSensor)
admin.site.register(EstadoActuador)
admin.site.register(ComandoRemoto)
admin.site.register(RespuestaComando)
admin.site.register(LogConexion)
admin.site.register(Notificacion)
admin.site.register(Auditoria)
admin.site.register(TipoVariable)
admin.site.register(UmbralCalidad)
admin.site.register(EstadoCalidadAgua)
admin.site.register(Alerta)