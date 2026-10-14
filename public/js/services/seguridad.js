/**
 * Alterna la visibilidad de la contraseña y actualiza el icono correspondiente.
 * 
 * @param {jQuery} $input El campo de texto (password)
 * @param {jQuery} $boton El botón que activa el cambio
 */
function TogglePassword($input, $boton) {
    if (!$input.length || !$boton.length) return;

    const esPassword = $input.prop('type') === 'password';
    const $icon = $boton.find('i');

    // 1. Cambiar tipo de input usando .prop() (estándar recomendado en jQuery)
    $input.prop('type', esPassword ? 'text' : 'password');

    // 2. Definir iconos (Fluent UI)
    const iconOpen = 'vf-ic_fluent_eye_24_filled';
    const iconClosed = 'vf-ic_fluent_eye_off_24_filled';

    // 3. Alternar clases y atributos de accesibilidad
    if (esPassword) {
        $icon.removeClass(iconOpen).addClass(iconClosed);
        $boton.attr('aria-label', 'Ocultar contraseña');
    } else {
        $icon.removeClass(iconClosed).addClass(iconOpen);
        $boton.attr('aria-label', 'Ver contraseña');
    }
}

/**
 * Calcula el hash SHA-256 de una cadena de texto usando la Web Crypto API nativa.
 * 
 * @param {string} texto Texto a hashear
 * @returns {Promise<string>} Hash en formato hexadecimal de 64 caracteres
 */
async function sha256(texto) {
    if (typeof texto !== 'string') {
        texto = String(texto || '');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}