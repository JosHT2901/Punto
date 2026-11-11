// ==========================================
// CONTROLADOR AJAX / VISTA: VERIFICACIÓN DE CORREO
// ==========================================

/**
 * Función centralizada para solicitar el token al backend mediante AjaxService
 */
async function Solicitar_Token_Verificacion() {
    try {
        MostrarCargando('Obteniendo código...',false);
        
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/verificar.correo.php', {
            accion: 'solicitar_token_verificacion_correo'
        });
        
        console.log(respuesta);
        OcultarCargando();
        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje, true, false, false);
            return true;
        }
        
        MostrarMensaje(respuesta?.mensaje || "No se pudo procesar la solicitud.", false, true, false);
        setTimeout(() => {
            ModalAPI.cerrar()
        }, 1000);
        return false;

    } catch (error) {
        console.error("Error al solicitar el token de verificación:", error);
        OcultarCargando();
        
        // Capturamos el mensaje de error que envía el servidor
        const mensajeError = error?.responseJSON?.mensaje || error?.mensaje || "Ocurrió un error al procesar la solicitud.";
        console.log(mensajeError)
        if (mensajeError === 'Tu correo electrónico ya se encuentra verificado.') { 
            MostrarMensaje(mensajeError, false, false, false);
            setTimeout(() => {
                window.location.href = '../../index.php';
            }, 1000);
            return false; // Salimos de inmediato de la función para evitar que muestre la alerta genérica
        }
        
        MostrarAlerta(mensajeError, 250, true);
        return false;
    }
}

async function Enviar_Token_Correo() {
    try {
        MostrarCargando('Enviando código al correo...',false);
        
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/verificar.correo.php', {
            accion: 'enviar_correo_token_verificacion_correo' // Debe coincidir con el if($_POST['accion'] === 'enviar_correo_verificacion') en PHP
        });
        
        OcultarCargando()
        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje, true, false, true); // O tu función de alerta/mensaje existente
            setTimeout(() => {
                ModalAPI.cerrar()
            }, 1000);
            return true;
        }

        // Por si el servidor responde con ok: false sin lanzar excepción
        const mensajeAviso = respuesta?.mensaje || "No se pudo enviar el correo de verificación.";
        MostrarAlerta(mensajeAviso, 250, true);
        setTimeout(() => {
            ModalAPI.cerrar()
        }, 1000);
        return false;

    } catch (error) {
        console.error("Error al enviar el token de verificación por correo:", error);
        
        OcultarCargando()
        const mensajeError = error?.responseJSON?.mensaje || error?.mensaje || "Ocurrió un error al procesar la solicitud.";
        MostrarAlerta(mensajeError, 250, true);
        
        return false;
    } 
}

async function Verificar_Codigo(codigo) {
    try {
        MostrarCargando('Verificando...',false);
        
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/verificar.correo.php', {
            accion: 'verificar_token_verificacion_correo',
            codigo: codigo
        });
        
        OcultarCargando();
        
        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje, true, false, true);
            setTimeout(() => {
                ModalAPI.cerrar();
            }, 1000);
            return true;
        }

        // Por si el servidor responde con ok: false controlado
        const mensajeAviso = respuesta?.mensaje || "El código ingresado no es válido o ya expiró.";
        MostrarAlerta(mensajeAviso, 250, true);
        return false;

    } catch (error) {
        console.error("Error al verificar el código de correo:", error);
        
        OcultarCargando();
        
        // Extracción robusta del mensaje de error del servidor o de la excepción
        const mensajeError = error?.responseJSON?.mensaje || error?.mensaje || "Ocurrió un error al procesar la solicitud.";
        MostrarAlerta(mensajeError, 250, true);
        
        return false;
    } 
}

async function Solicitar_Correo_Reestablecimiento(id,seccion)
{
    try {
        MostrarCargando('Enviando código al correo...',false);
        
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/verificar.correo.php', {
            accion: 'enviar_correo_token_verificacion_correo' // Debe coincidir con el if($_POST['accion'] === 'enviar_correo_verificacion') en PHP
        });
        
        OcultarCargando()
        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje, true, false, true); // O tu función de alerta/mensaje existente
            setTimeout(() => {
                ModalAPI.cerrar()
            }, 1000);
            return true;
        }

        // Por si el servidor responde con ok: false sin lanzar excepción
        const mensajeAviso = respuesta?.mensaje || "No se pudo enviar el correo de verificación.";
        MostrarAlerta(mensajeAviso, 250, true);
        setTimeout(() => {
            ModalAPI.cerrar()
        }, 1000);
        return false;

    } catch (error) {
        console.error("Error al enviar el token de verificación por correo:", error);
        
        OcultarCargando()
        const mensajeError = error?.responseJSON?.mensaje || error?.mensaje || "Ocurrió un error al procesar la solicitud.";
        MostrarAlerta(mensajeError, 250, true);
        
        return false;
    } 
}