from django.urls import path
from . import views

urlpatterns = [
    # Páginas HTML
    path('',           views.login_view, name='login'),     
    path('dashboard/', views.dashboard,  name='dashboard'),
    path('crud/',      views.crud,       name='crud'),

    # Comunidades
    path('api/comunidades',                        views.get_comunidades,    name='get_comunidades'),
    path('api/comunidades/create',                 views.create_comunidad,   name='create_comunidad'),
    path('api/comunidades/<int:pk>/update',        views.update_comunidad,   name='update_comunidad'),
    path('api/comunidades/<int:pk>/delete',        views.delete_comunidad,   name='delete_comunidad'),

    # Dispositivos
    path('api/dispositivos',                       views.get_dispositivos,   name='get_dispositivos'),
    path('api/dispositivos/create',                views.create_dispositivo, name='create_dispositivo'),
    path('api/dispositivos/<int:pk>/update',       views.update_dispositivo, name='update_dispositivo'),
    path('api/dispositivos/<int:pk>/delete',       views.delete_dispositivo, name='delete_dispositivo'),

    # Sensores
    path('api/sensores',                           views.get_sensores,       name='get_sensores'),
    path('api/sensores/create',                    views.create_sensor,      name='create_sensor'),
    path('api/sensores/<int:pk>/delete',           views.delete_sensor,      name='delete_sensor'),

    # Lecturas
    path('api/lecturas',                           views.get_lecturas,       name='get_lecturas'),
    path('api/lecturas/latest',                    views.get_latest_lectura, name='latest_lectura'),
    path('api/lecturas/create',                    views.create_lectura,     name='create_lectura'),
    path('api/lecturas/<int:pk>/delete',           views.delete_lectura,     name='delete_lectura'),

    # Alertas
    path('api/alertas',                            views.get_alertas,        name='get_alertas'),

    # Umbrales
    path('api/umbrales',                           views.get_umbral,         name='get_umbral'),
    path('api/umbrales/<int:dispositivo_id>/update', views.update_umbral,    name='update_umbral'),

    # Comandos
    path('api/comandos',                           views.get_comandos,       name='get_comandos'),
    path('api/comandos/create',                    views.create_comando,     name='create_comando'),
    path('api/comandos/latest',                    views.get_latest_comando, name='latest_comando'),

    # Usuarios
    path('api/usuarios',                           views.get_usuarios,       name='get_usuarios'),
    path('api/usuarios/create',                    views.create_usuario,     name='create_usuario'),
    path('api/usuarios/<int:pk>/delete',           views.delete_usuario,     name='delete_usuario'),

    # Logs
    path('api/logs/create',                        views.create_log,         name='create_log'),

    # Auth
    path('api/me/',                                views.me,                 name='me'),
]