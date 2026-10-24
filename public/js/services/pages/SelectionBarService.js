/* =============================================
    SERVICIO: SELECTION BAR SERVICE (Ultra Simple)
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

        const $barra =$(barra);
        const $cont =$(contador);
        const $btnCont =$(contenedorBotones);

        // 1. Inyectar botones enviando JSON de forma directa
        if ($btnCont.length && Array.isArray(botones)) {$btnCont.html(
                botones.map(b => `
                    <button type="button" class="${b.class || 'btn btn-secondary rounded-md flex-center shrink-0 w-30 h-30 '}" id="${b.id || ''}" title="${b.title || ''}" onclick="${b.onclick || ''}">
                        <i class="icon ${b.icon || ''} fs-6"></i>
                    </button>
                `).join('')
            );
        }

        // 2. Escuchar cambios de selección automáticamente mediante callback integrado
        const refrescarUI = () => {
            const total = controller.total();
            console.log(total)
            if (total > 0) {
                $barra.removeClass('d-none').addClass('flex');
                if ($cont.length) {$cont.html(`
                        <span class="rounded-8 bg-brand-soft p-1 px-2 h-30 justify-center items-center text-brand-blue fw-600">
                            ${total} ${entidad}
                        </span>
                    `);
                }
            } else {
                $barra.removeClass('flex').addClass('d-none');
                if ($cont.length)$cont.empty();
            }
        };

        return refrescarUI;
    };

    return { conectar };
})();