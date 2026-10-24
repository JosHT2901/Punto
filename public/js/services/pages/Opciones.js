/**
 * Abre un menú flotante de opciones utilizando VerticalSubmenuNav a partir de un JSON
 * @param {Event|HTMLElement} origen 'event' o 'this' del click
 * @param {Array} opciones Array de opciones [{ id, texto, icono, clase, callback, subopciones }, ...]
 */
function Abrir_Menu_Opciones_Global(origen, opciones = []) {
    if (!origen) return;
    
    // Normalizamos el evento y el botón de origen
    const e = origen.preventDefault ? origen : null;
    if (e) e.stopPropagation();

    const $btn = $(e ? (e.currentTarget || e.target) : origen);
    const id = $btn.data('id') || $btn.closest('[data-id]').data('id');

    // Mapeamos a la estructura que espera VerticalSubmenuNav
    const items = opciones.map(opt => ({
        id: opt.id || opt.texto,
        texto: opt.texto,
        icono: opt.icono || '',
        clase: opt.clase || '',
        onClick: () => opt.callback && opt.callback(id, $btn[0]),
        subopciones: opt.subopciones ? opt.subopciones.map(sub => ({
            id: sub.id || sub.texto,
            texto: sub.texto,
            onClick: () => sub.callback && sub.callback(id, $btn[0])
        })) : undefined
    }));

    // Abrimos utilizando el nuevo servicio independiente
    if (window.VerticalSubmenuNav) {
        VerticalSubmenuNav.abrir($btn[0], items);
    } else {
        console.warn("El servicio VerticalSubmenuNav no se encuentra cargado en el sistema.");
    }
}