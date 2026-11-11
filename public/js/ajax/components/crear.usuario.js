window.usuarios=[]
$(document).ready(async function () {
    try {
        MostrarCargando('Obteniendo información...', false);

        let respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
            accion: 'obtener_usuarios'
        });

        OcultarCargando();
        if (respuesta && respuesta.ok) {
           window.usuarios=respuesta.data
        }

    } catch (error) {
        OcultarCargando();
        console.error("Error en la petición AJAX:", error);
        
        // 4. Error de red, 404, 500, etc.
        MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, false, false);
    }
});

$("#crear-usuario-boton-generar-usuario").on('click', async function(e) {
    e.preventDefault();

    const nombre = $("#crear-usuario-input-nombre").val().trim();
    const apellidoPaterno = $("#crear-usuario-input-apellido-paterno").val().trim();
    const apellidoMaterno = $("#crear-usuario-input-apellido-materno").val().trim();
    const fecha_nacimiento = window.calendario ? window.calendario.getValor() : '';

    // Validar campos mínimos antes de hacer la petición
    if (!nombre || !fecha_nacimiento) {
        MostrarMensaje('Por favor, ingresa al menos el nombre y selecciona la fecha de nacimiento.', false, false, false);
        return;
    }

    MostrarCargando('Generando nombre de usuario...', false);

    const datosEnvio = {
        nombre: nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
        fecha_nacimiento: fecha_nacimiento.fecha
    };

    try {
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
            accion: 'generar_nombre_usuario',
            data: datosEnvio
        });
        OcultarCargando();
        if (respuesta.ok && respuesta.data) {
            const nombreUsuarioGenerado = respuesta.data;
            // Asignamos el valor al input y disparamos el evento para validar disponibilidad
            $('#crear-usuario-input-usuario').val(nombreUsuarioGenerado).trigger('input');
        } else {
            MostrarMensaje(respuesta.mensaje || 'No se pudo generar el nombre de usuario.', false, false, false);
        }

    } catch (error) {
        console.error("Error al generar el nombre de usuario:", error.mensaje || error);
        OcultarCargando();
        MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, false, false);
    }
});
async function Guardar_Informacion_Usuario() {
    // 1. Obtener y limpiar valores del formulario
    const nombre = $("#crear-usuario-input-nombre").val().trim().toUpperCase();
    const apellido_paterno = $("#crear-usuario-input-apellido-paterno").val().trim().toUpperCase();
    const apellido_materno = $("#crear-usuario-input-apellido-materno").val().trim().toUpperCase(); // 👈 Corregido el selector ID
    
    // Extracción segura del valor del calendario (compatible con formato single o rango)
    const valorCalendario = window.calendario ? window.calendario.getValor() : null;
    const fecha_nacimiento = valorCalendario ? (valorCalendario.fecha || valorCalendario.inicio || '') : '';

    const curp = $("#crear-usuario-input-curp").val().trim().toUpperCase();
    const rfc = $("#crear-usuario-input-rfc").val().trim().toUpperCase();
    const telefono = TelefonosUI.getValor("#crear-usuario-input-telefono");
    const correo = $("#crear-usuario-input-correo").val().trim(); // Se respeta minúsculas/mayúsculas del correo
    const usuario = $("#crear-usuario-input-usuario").val().trim().toUpperCase();
    const password = $("#crear-usuario-input-password").val().trim();
    const confirmar_password = $("#crear-usuario-input-confirm-password").val().trim();
    
    // Obtener PINs usando el validador
    const pin = window.PinValidador ? window.PinValidador.obtener() : '';
    const confirmar_pin = window.PinValidador ? window.PinValidador.obtenerConfirmacion() : '';

    const accion = 'crear_usuario' ;

    // 2. Consolidar datos de envío hacia PHP
    const datosEnvio = {
        ejecutar: accion,
        nombre,
        apellido_paterno,
        apellido_materno,
        fecha_nacimiento,
        curp,
        rfc,
        telefono,
        correo,
        usuario,
        password,
        confirmar_password,
        pin,
        confirmar_pin,
        id: window.id_usuario // 👈 Aquí se envía null si es crear, o el ID correspondiente si es editar
    };

    try {
        MostrarCargando('Procesando información...', false); 

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
            accion: 'gestionar_usuario',
            data: datosEnvio
        });

        OcultarCargando();

        if (respuesta.ok) {
            MostrarMensaje(respuesta.mensaje || 'Información guardada correctamente.', true, false,false);
            
            let notificacion=window.accion === 'crear'?'usuario_creado':'usuario_editado'
            $.messenger.send(
                window.parent,                // Ventana padre
                notificacion,         // Nombre de la acción
                { status: 'success', mensaje: 'Proceso completado', accion: window.accion },
                '*'
            );
        } else {
            MostrarMensaje(respuesta.mensaje || 'No se pudo completar la operación.', false, false, false);
        }

    } catch (error) {
        OcultarCargando();
        console.error("Error al guardar la información del usuario:", error.mensaje || error);
        MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, false, false);
    }
}