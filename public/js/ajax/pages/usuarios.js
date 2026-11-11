$(document).ready(async function (e) {
    try {
        // Función auxiliar limpia y segura para evaluar permisos
        const verificarPermiso = (permiso) => {
            return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' ?
                PermisosService.tienePermiso(permiso) :
                true;
        };
    
        // Asignación de variables globales de permisos para el módulo de Usuarios
        window.permiso_ver = verificarPermiso('ver_usuarios');
        window.permiso_crear = verificarPermiso('crear_usuarios');
        window.permiso_editar = verificarPermiso('editar_usuarios');
        window.permiso_eliminar = verificarPermiso('eliminar_usuarios');
        window.permiso_exportar = verificarPermiso('exportar_usuarios');
        window.permiso_editar_permisos = verificarPermiso('editar_permisos_usuarios');

        if (!permiso_ver) {
            return window.location.href = '../../../pages/errores/no-permiso.php';
        }

        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información...', false);
        }

        // 🌟 Disparar evento de sucursales listas en lugar de localidades
        $(document).trigger('datosListos.usuarios');


    } catch (error) {
        console.error("Error crítico al inicializar las sucursales:", error);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar las sucursales.', false, false, false);
        }
    }
});

function Obtener_Usuarios_API(pagina = 1, registrosPorPagina = 25, filtros = {}, orden = {}) {
    // 1. Sincronizar y cifrar el estado actual en la URL del navegador fusionando con lo que ya existía
    if (window.UrlStateSyncService && typeof window.UrlStateSyncService.generarUrlConEstado === 'function') {
        // Recuperar parámetros anteriores si existen en la URL cifrada
        const paramsPrevios = (typeof window.UrlStateSyncService.obtenerParametros === 'function') 
            ? window.UrlStateSyncService.obtenerParametros() || {} 
            : {};

        window.UrlStateSyncService.generarUrlConEstado({
            ...paramsPrevios, // Mantiene cualquier otro parámetro previo de la sesión
            pagina: pagina,
            registros: registrosPorPagina,
            ...filtros,
            ...orden
        });
    }

    // 2. Usamos el método 'enviar' de nuestro AjaxService independiente
    return AjaxService.enviar(
        '../../../src/controllers/php/controllers/usuarios.php', // URL del endpoint
        {
            accion: 'obtener_usuarios_paginados',
            pagina: pagina,
            registros_por_p: registrosPorPagina,
            ...filtros, // Expande los filtros dinámicos del módulo
            ...orden    // Expande el ordenamiento
        },
        false // esFormData (false ya que enviamos un objeto plano)
    );
}

async function Solicitar_Correo_Reestablecimiento(id_usuario, tipo) {
    console.log("Iniciando solicitud para ID:", id_usuario, "Tipo:", tipo);
    
    try {
        const textoCarga = tipo === 'pin' ? 'Generando PIN y preparando correo...' : 'Generando contraseña y preparando correo...';
        MostrarCargando(textoCarga, false);
        
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
            accion: 'procesar_reset_administrador',
            usuario_id: id_usuario,
            tipo: tipo // 'password' o 'pin'
        });
        
        OcultarCargando();
        
        if (respuesta && respuesta.ok) {
            // Extraemos los pasos que devuelve el servidor en el objeto data
            const paso1 = respuesta.data?.paso_1 || "Código generado correctamente.";
            const paso2 = respuesta.data?.paso_2 || "Correo enviado exitosamente.";
            
            // Notificamos el paso 1 (Generado)
            MostrarMensaje(paso1, true, false, false);
            
            // Pausa breve y notificamos el paso 2 (Correo enviado)
            setTimeout(() => {
                MostrarMensaje(paso2, true, false, false);
                
                // Espera 100q0 ms adicionales y cierra el modal
                setTimeout(() => {
                    ModalAPI.cerrar();
                }, 1000);
            }, 1200);

            return true;
        }
        
        const mensajeAviso = respuesta?.mensaje || "No se pudo completar la solicitud.";
        MostrarAlerta(mensajeAviso, 250, true);
        setTimeout(() => {
            ModalAPI.cerrar();
        }, 1000);
        return false;

    } catch (error) {
        console.error("Error al solicitar el restablecimiento:", error);
        OcultarCargando();
        
        const mensajeError = error?.mensaje || "Ocurrió un error en el servidor.";
        MostrarAlerta(mensajeError, 250, true);
        setTimeout(() => {
            ModalAPI.cerrar();
        }, 1000);
        
        return false;
    }
}

async function Deshabilitar_Usuario_AJAX(id_usuario) {
    // Validar que el ID sea válido antes de enviar
    if (!id_usuario) {
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('ID de usuario no válido.',230, false);
        }
        return;
    }

    // Estructuramos los datos para que coincidan con lo que espera tu backend (acción y payload)
    const datosEnvio = {
        accion: 'deshabilitar_usuario',
        usuario_id: id_usuario // Aquí puedes cifrarlo en frontend si tu backend espera el ID cifrado
    };

    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Deshabilitando usuario...', false);
        }

        // Realizamos la petición AJAX con tu servicio centralizado
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', datosEnvio);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        // Verificamos tanto 'success' como 'ok' por compatibilidad con JsonResponse
        if (respuesta && (respuesta.success || respuesta.ok)) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta.mensaje || 'Usuario deshabilitado correctamente.', true, false, false);
            }

            // Opcional: Recargar la tabla o remover la fila del DOM dinámicamente si existe
            setTimeout(() => {
                ModalAPI.cerrar()
                CargarUsuarios()
            }, 1000);
        } else {
            if (typeof MostrarMensaje === 'function') {
                MostrarAlerta(respuesta?.mensaje || 'Error al deshabilitar el usuario.', 250, false);
            }
        }
    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error crítico al deshabilitar usuario:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarAlerta('Ocurrió un error inesperado en la red.', 250, false);
        }
    }
}

async function Eliminar_Usuario_Permanente_AJAX(id_usuario) {
    if (!id_usuario) {
        if (typeof MostrarMensaje === 'function') {
            MostrarAlerta('ID de usuario no válido.', 230, false);
        }
        return false;
    }

    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Eliminando usuario permanentemente...', false);
        }

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
            accion: 'eliminar_usuario_permanente',
            usuario_id: id_usuario
        });

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (respuesta && (respuesta.success || respuesta.ok)) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta.mensaje || 'Usuario eliminado correctamente.', true, false, false);
            }

            setTimeout(() => {
                ModalAPI.cerrar()
                CargarUsuarios()
            }, 1000);
        } else {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta?.mensaje || 'Error al eliminar el usuario.', false, false, false);
            }
        }
    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error crítico al eliminar usuario:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado en la red.', false, false, false);
        }
    }
}

async function Habilitar_Usuario_AJAX(id_usuario) {
    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Habilitando usuario...', false);
        }

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
            accion: 'habilitar_usuario',
            usuario_id: id_usuario
        });

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (respuesta && (respuesta.success || respuesta.ok)) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta.mensaje || 'Usuario habilitado correctamente.', true, false, false);
            }

            setTimeout(() => {
               ModalAPI.cerrar()
               CargarUsuarios()
            }, 1000);
        } else {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta?.mensaje || 'Error al habilitar el usuario.', false, false, false);
            }
        }
    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error crítico al habilitar usuario:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado en la red.', false, false, false);
        }
    }
}