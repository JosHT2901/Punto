/* =============================================
    SERVICIO: AUTH SERVICE (Reutilizable)
============================================= */
window.AuthService = (function (AjaxService) {

    // URL por defecto de tu backend
    const URL_DEFAULT = '../../../src/controllers/php/controllers/auth.php'; 

    /**
     * Verifica las credenciales del usuario de forma genérica.
     * @param {Object} payload - Objeto con los datos (ej: { password, pin, usuario, id_usuario, modo_auth })
     * @param {String} urlPersonalizada - (Opcional) Si necesitas apuntar a otro endpoint
     */
    const verificar = async (payload = {}, urlPersonalizada = null) => {
        const urlFinal = urlPersonalizada || URL_DEFAULT;

        // 🌟 CORREGIDO: Usamos 'ejecutar' en lugar de 'accion' para que coincida con tu backend PHP
        const payloadFinal = {
            accion: 'verificar_credenciales_usuario',
            ...payload
        };

        try {
            const servicioAjax = AjaxService || window.AjaxService;
            const respuesta = await servicioAjax.enviar(urlFinal, payloadFinal);
            
            console.log("Respuesta del servidor:", respuesta);

            // 🌟 VALIDACIÓN CLAVE: Si el backend responde HTTP 200 pero con ok: false
            if (respuesta && respuesta.ok === false) {
                return {
                    ok: false,
                    status: 200,
                    mensaje: respuesta.mensaje || 'Credenciales incorrectas',
                    data: respuesta.data || null
                };
            }
            
            return {
                ok: true,
                data: respuesta,
                mensaje: respuesta.mensaje || 'Verificación exitosa'
            };
        } catch (error) {
            console.log("Error en petición:", error);
            return {
                ok: false,
                status: error.status || 500,
                mensaje: error.mensaje || 'Ocurrió un error al verificar las credenciales',
                data: error.data || null
            };
        }
    };

    /**
     * Método rápido para validar solo contraseña (tomando el usuario de sesión en el backend)
     */
    const verificarPasswordActual = async (password) => {
        return await verificar({
            modo_auth: 'solo_password',
            password: password
        });
    };

    /**
     * Método rápido para validar solo PIN (tomando el usuario de sesión en el backend)
     */
    const verificarPinActual = async (pin) => {
        return await verificar({
            modo_auth: 'solo_pin',
            pin: pin
        });
    };

    /**
     * Método para validar tanto contraseña como PIN a la vez
     */
    const verificarAmbos = async (password, pin) => {
        return await verificar({
            modo_auth: 'ambos',
            password: password,
            pin: pin
        });
    };

    // Exponemos las funciones públicas
    return {
        verificar,
        verificarPasswordActual,
        verificarPinActual,
        verificarAmbos
    };

})(window.AjaxService);