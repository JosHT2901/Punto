window.EmailService = (function (AjaxService) {
    const URL_DEFAULT = '../../../src/controllers/php/controllers/email.php';

    const enviar = async (config = {}) => {
        const payload = {
            ejecutar: 'enviar_correo',
            destinatario_email: config.email,
            destinatario_nombre: config.nombre || 'Usuario',
            asunto: config.asunto,
            cuerpo_html: config.html,
            variables: config.variables || {}
        };

        try {
            const servicioAjax = AjaxService || window.AjaxService;
            const respuesta = await servicioAjax.enviar(URL_DEFAULT, payload);
            return respuesta;
        } catch (error) {
            console.error("Error al enviar correo:", error);
            return { ok: false, mensaje: 'Error de red al intentar enviar el correo.' };
        }
    };

    return { enviar };
})(window.AjaxService);