$(document).ready(async function () {
    try {
        await esperarDatosIniciales;
        MostrarCargando('Obteniendo información...', false);

        const [listaUsuarios,informacion] = await Promise.all([
            window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
                accion: 'obtener_usuarios'
            }),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
                accion: 'obtener_informacion_usuario',
                id:id_usuario
            })
        ]);

        window.usuarios = (listaUsuarios && Array.isArray(listaUsuarios.data)) ? listaUsuarios.data : [];
        window.informacion=informacion.data
        OcultarCargando();
        $(document).trigger('datosListos');

    } catch (error) {
        console.error("Error crítico al inicializar los datos:", error);

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar la información inicial.', false, false, false);
        }
    } 
});

async function Guardar_Edicion_Usuario(payload)
{
    try {
        MostrarCargando('Procesando información...', false); 

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
            accion: 'gestionar_usuario',
            data: payload
        });

        OcultarCargando();

        if (respuesta.ok) {
            MostrarMensaje(respuesta.mensaje || 'Información guardada correctamente.', true, false,false);
            setTimeout(() => {
                $.messenger.send(
                    window.parent,                // Ventana padre
                    'usuario_editado',         // Nombre de la acción
                    { status: 'success', mensaje: 'Proceso completado', accion: window.accion },
                    '*'
                );
            }, 1000);
         
        } else {
            MostrarMensaje(respuesta.mensaje || 'No se pudo completar la operación.', false, false, false);
        }

    } catch (error) {
        OcultarCargando();
        console.error("Error al guardar la información del usuario:", error.mensaje || error);
        MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, false, false);
    }
}