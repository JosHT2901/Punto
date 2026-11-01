/**
 * Servicio de Validaciones (CURP, RFC, Correo)
 */
const ValidacionService = {
    
    /**
     * Valida la estructura oficial de un CURP (México)
     * @param {string} curp 
     * @returns {boolean}
     */
    validarCURP(curp) {
        if (!curp) return false;
        const regexCURP = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
        return regexCURP.test(curp.trim().toUpperCase());
    },

    /**
     * Valida la estructura de un RFC (Persona Física o Moral con homoclave)
     * @param {string} rfc 
     * @returns {boolean}
     */
    validarRFC(rfc) {
        if (!rfc) return false;
        // Acepta 12 caracteres (Moral) o 13 caracteres (Física)
        const regexRFC = /^([A-ZÑ&]{3,4})([0-9]{2})(0[1-9]|1[0-2])([0-2][1-9]|3[0-1])([A-Z\d]{3})$/;
        return regexRFC.test(rfc.trim().toUpperCase());
    },

    /**
     * Valida la estructura estándar de un Correo Electrónico
     * @param {string} correo 
     * @returns {boolean}
     */
    validarCorreo(correo) {
        if (!correo) return false;
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regexEmail.test(correo.trim());
    },
    /**
     * Valida la estructura de un Sitio Web / URL
     * @param {string} url 
     * @returns {boolean}
     */
    validarSitioWeb(url) {
        if (!url) return false;
        // Expresión regular que acepta URLs con http(s):// o directamente dominios (ej. ejemplo.com, www.sitio.com.mx/path)
        const regexWeb = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\w\-.,@?^=%&amp;:/~+#]*[\w\-@?^=%&amp;/~+#])?$/i;
        return regexWeb.test(url.trim());
    }
};