/**
 * Servicio para generar la retícula de detalles internos utilizando flex wrap.
 */
class HtmlDetailService {
    /**
     * Construye el HTML con la lista de campos en formato flexible (wrap).
     * 
     * @param {Object} element - El objeto de datos (registro de la BD).
     * @param {Array} configuracionCampos - Array de objetos con { label, columna, formatter (opcional) }.
     * @returns {string} HTML con los bloques de detalle en wrap.
     */
    static renderizarCampos(element, configuracionCampos) {
        const camposHtml = configuracionCampos.map(campo => {
            let valor = element[campo.columna] !== undefined && element[campo.columna] !== null 
                        ? element[campo.columna] 
                        : '---';
            
            // Aplicar formato personalizado si la columna lo requiere
            if (campo.formatter && typeof campo.formatter === 'function') {
                valor = campo.formatter(valor, element);
            } else if (campo.columna === 'Habilitado' || campo.columna === 'estado') {
                valor = valor == 1 ? '<b class="text-success">ACTIVO</b>' : '<b class="text-danger">INACTIVO</b>';
            }
            
            // Estilo en línea o clase para asegurar el comportamiento en wrap (ej: ancho mínimo flexible)
            return `
                <div class="flex flex-column gap-1 p-2 border-bottom-light" style="flex: 1 1 220px; min-width: 200px;">
                    <label class="fs-1 fw-700 text-uppercase letter-spacing-1 text-brand-blue">${campo.label}</label>
                    <div class="fs-2 fw-600 word-break-all">
                        ${valor}
                    </div>
                </div>`;
        }).join('');

        // Contenedor principal con flex-wrap habilitado
        return `
            <div class="flex flex-wrap gap-2 w-p-100">
                ${camposHtml}
            </div>
        `;
    }
}