/* =============================================
    SERVICIO: SELECTION BAR SERVICE (Reutilizable y Agnóstico)
============================================= */
window.SelectionBarService = (() => {

    const conectar = (controller, opciones = {}) => {
        const {
            entidad = 'elementos',
            barra = '#barra-seleccion',
            contador = '#contador-container',
            contenedorBotones = '#acciones-masivas-container',
            // Ahora aceptamos un arreglo estático o una función callback que devuelva los botones en tiempo real
            botones = [] 
        } = opciones;

        const $barra = $(barra);
        const $cont = $(contador);
        const $btnCont = $(contenedorBotones);

        // Función interna para resolver y renderizar los botones actuales
        const renderizarBotonesDinamicos = () => {
            if (!$btnCont.length) return;

            // Si "botones" es una función (ej. () => obtenerBotonesSegunEstado()), la ejecutamos para obtenerlos dinámicamente; si es un arreglo, lo usamos directamente.
            const listaBotones = typeof botones === 'function' ? botones() : botones;

            if (!Array.isArray(listaBotones)) return;

            const botonesHtml = listaBotones
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
        };

        // Renderizamos los botones al conectar inicialmente
        renderizarBotonesDinamicos();

        // Función para refrescar la barra de selección y el contador
        const refrescarUI = () => {
            // Aseguramos que los botones se revalúen por si el estado del módulo cambió antes de refrescar
            renderizarBotonesDinamicos();

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

                // Detección genérica de elemento actual (si el módulo usa la clase card-actual / card-sucursal-actual)
                const contieneElementoActual = idsSeleccionados.some(id => {
                    const $card = $(`#contenedor-tarjetas .card[data-id="${id}"]`);
                    return $card.hasClass('card-actual') || $card.hasClass('card-sucursal-actual');
                });

                const listaBotones = typeof botones === 'function' ? botones() : botones;
                const tienePermisoEliminar = listaBotones.some(b => b.permiso?.includes('eliminar') && window.PermisosService?.tienePermiso(b.permiso)) 
                    || !listaBotones.some(b => b.permiso?.includes('eliminar'));

                const $btnEliminarMasivo = $btnCont.find('#btn-eliminar-masivo, [onclick*="Eliminar"]');
                
                if (contieneElementoActual || !tienePermisoEliminar) {
                    $btnEliminarMasivo.addClass('d-none');
                } else {
                    $btnEliminarMasivo.removeClass('d-none');
                }

            } else {
                $barra.removeClass('flex').addClass('d-none');
                if ($cont.length) {
                    $cont.empty();
                }
            }
        };

        refrescarUI();
        return refrescarUI;
    };

    return { conectar };
})();