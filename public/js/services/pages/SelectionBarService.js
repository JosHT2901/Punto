/* =============================================
    SERVICIO: SELECTION BAR SERVICE (Ultra Simple y Robusta)
============================================= */
window.SelectionBarService = (() => {

    const conectar = (controller, opciones = {}) => {
        const {
            entidad = 'elementos',
            barra = '#barra-seleccion',
            contador = '#contador-container',
            contenedorBotones = '#acciones-masivas-container',
            botones = []
        } = opciones;

        const $barra = $(barra);
        const $cont = $(contador);
        const $btnCont = $(contenedorBotones);

        // 1. Inyectar botones con soporte para permisos opcionales, iconos y etiquetas
        if ($btnCont.length && Array.isArray(botones)) {
            const botonesHtml = botones
                .filter(btn => {
                    if (!btn.permiso) return true;
                    return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' 
                        ? PermisosService.tienePermiso(btn.permiso) 
                        : true;
                })
                .map(b => `
                    <button type="button" class="${b.class || 'btn btn-secondary rounded-md flex-center shrink-0 w-30 h-30'}" id="${b.id || ''}" title="${b.title || ''}" onclick="${b.onclick || ''}">
                        ${b.icon ? `<i class="icon ${b.icon} fs-6"></i>` : ''}
                        ${b.label ? `<span>${b.label}</span>` : ''}
                    </button>
                `).join('');
            
            $btnCont.html(botonesHtml);
        }

        // 2. Función para refrescar la barra de selección y el contador
        const refrescarUI = () => {
            const idsSeleccionados = controller.getSeleccionados();
            
            const totalSeleccionados = idsSeleccionados.length;
            
            if (totalSeleccionados > 0) {
                $barra.removeClass('d-none').addClass('flex');
                if ($cont.length) {
                    $cont.html(`
                        <span class="rounded-8 bg-brand-soft p-1 px-2 h-30 justify-center items-center text-brand-blue fw-600">
                            ${totalSeleccionados} ${entidad}
                        </span>
                    `);
                }

                // 🌟 Lógica clave: Detectar si entre los elementos seleccionados hay alguno que sea la sucursal actual (identificado por la clase o atributo visual de la tarjeta)
                const contieneSucursalActual = idsSeleccionados.some(id => {
                    const $card = $(`#contenedor-tarjetas .card[data-id="${id}"]`);
                    // Verificamos si la tarjeta tiene la clase de sucursal actual
                    return $card.hasClass('card-sucursal-actual');
                });

                // Localizamos el botón de eliminación masiva en el contenedor de botones
                const $btnEliminarMasivo = $btnCont.find('#btn-eliminar-masivo, [onclick*="Eliminar_Masivo"]');
                
                if (contieneSucursalActual) {
                    // Ocultar completamente el botón de eliminar masivo si se seleccionó la sucursal actual
                    $btnEliminarMasivo.addClass('d-none');
                } else {
                    // Mostrarlo si ninguna de las seleccionadas es la sucursal actual
                    $btnEliminarMasivo.removeClass('d-none');
                }

            } else {
                $barra.removeClass('flex').addClass('d-none');
                if ($cont.length) {
                    $cont.empty();
                }
            }
        };

        // Sincronizar el estado inicial de la UI al conectar
        refrescarUI();

        return refrescarUI;
    };

    return { conectar };
})();