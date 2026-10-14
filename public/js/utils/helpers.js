/**
 * Traduce un ID de régimen fiscal a su respectiva descripción usando el array global.
 * 
 * @param {string|number} idRegimen - El ID del régimen a buscar (ej. "629" o 601).
 * @param {boolean} usarDescripcionCorta - Si es true, devuelve 'descripcionCorta'; si es false, la descripción completa.
 * @returns {string} La descripción del régimen o '---' si no se encuentra.
 */
function ObtenerNombreRegimenFiscal(idRegimen, usarDescripcionCorta = false) {
    // Asegurar que el array global exista
    const regimenes = window.regimenes || [];
    
    // Normalizar el ID a string para evitar problemas de comparación (ej: "629" vs 629)
    const idBuscado = String(idRegimen).trim();

    // Buscar el elemento que coincida con el ID
    const encontrado = regimenes.find(reg => String(reg.id).trim() === idBuscado);

    if (!encontrado) {
        return '---';
    }

    // Retornar la descripción corta o la completa según se solicite
    return usarDescripcionCorta ? (encontrado.descripcionCorta || encontrado.descripcion) : encontrado.descripcion;
}