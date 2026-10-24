
$.messenger.on('informacion', function(response) {
    console.log(response)
    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información del proceso...', false);
        }
        
        // Extraer los datos reales manejando posibles envoltorios de la API/Messenger
        const data = (response && response.data) ? response.data : response;
        
        Procesar_Resumen(data);
        
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error en listener de información:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('No se pudo cargar la información del proceso.', false, false, false);
        }
    }
});
function Procesar_Resumen(data) {
    try {
        const payload = data || {};

        // 1. Obtener estadísticas de manera segura
        const stats = payload.stats || {};
        const success = stats.success ?? 0;
        const error = stats.error ?? 0;
        const total = stats.total ?? 0;

        // 2. Desestructuración de los resultados
        const results = payload.results || {};
        const processed = results.processed || [];
        const failed = results.failed || [];

        console.log("Stats Proceso Masivo -> Éxito:", success, "Error:", error, "Total:", total);

        // Actualizar contadores globales en la interfaz
        $("#span-procesadas").text(success);
        $("#span-no-procesadas").text(error);
        $("#span-total").text(total);

        // Seleccionar los contenedores dinámicos del DOM
        const $contenedorProcesados =$("#procesados-lista");
        const $contenedorErrores =$("#errores-lista");

        $contenedorProcesados.empty();$contenedorErrores.empty();

        // --- 3. RENDERIZAR ÉXITOS ---
        if (processed.length > 0) {
            $.each(processed, function (index, item) {
                const idItem = (typeof item === 'object' && item !== null) ? (item.id || item.codigo || '---') : item;
                const nombreItem = (typeof item === 'object' && item !== null) ? (item.nombre || item.titulo || item.descripcion || `Elemento #${idItem}`) : `Elemento #${item}`;
                const etiquetaSecundaria = (typeof item === 'object' && item !== null && (item.sku || item.codigo)) ? `SKU: ${item.sku || item.codigo}` : `CÓDIGO: ${idItem}`;

                const htmlExito = `
                <div class="w-p-100 bg-white p-4 my-3 rounded-16 border border-slate-100 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-3 relative overflow-hidden">
                        <div class="flex flex-column justify-center">
                            <span class="fw-700 text-brand-blue fs-2 mb-1">${nombreItem}</span>
                            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-6 bg-slate-100 text-slate-600 fs-1 fw-600 w-fit">
                                <i class="vf-ic_fluent_tag_24_regular fs-1 text-slate-400"></i> ${etiquetaSecundaria}
                            </span>
                        </div>
                </div>`;
                $contenedorProcesados.append(htmlExito);
            });
        } else {
            $contenedorProcesados.html(`
                <div class="w-p-100 py-5 text-center text-slate-400 fs-1 italic bg-slate-50/70 rounded-14 border border-dashed border-slate-200">
                    no hay elementos procesados exitosamente.
                </div>
            `);
        }

        // --- 4. RENDERIZAR FALLIDOS / ERRORES (Sin la etiqueta estricta de "Error") ---
        if (failed.length > 0) {
            $.each(failed, function (index, item) {
                const idItem = (typeof item === 'object' && item !== null) ? (item.id || item.codigo || '---') : item;
                const nombreItem = (typeof item === 'object' && item !== null) ? (item.nombre || item.titulo || `Elemento #${idItem}`) : `Elemento #${item}`;
                const motivoError = (typeof item === 'object' && item !== null && item.reason) ? item.reason : 'motivo de falla';

                const htmlError = `
                <div class="w-p-100 bg-white p-4 my-3 rounded-16 border border-slate-100 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-3 relative overflow-hidden">
                        <div class="flex flex-column justify-center w-p-100">
                            <span class="fw-700 text-brand-blue fs-2 mb-1">${nombreItem}</span>
                            <span class="fw-500 text-red-600 fs-1 reason-error leading-relaxed bg-red-50/40 px-2.5 py-1 rounded-8 border border-red-100/60 flex items-center gap-1.5 w-fit">
                                <i class="vf-ic_fluent_info_24_regular text-red-500"></i> ${motivoError}
                            </span>
                        </div>
                </div>`;
                $contenedorErrores.append(htmlError);
            });
        } else {
            $contenedorErrores.html(`
                <div class="w-p-100 py-5 text-center text-slate-400 fs-1 italic bg-slate-50/70 rounded-14 border border-dashed border-slate-200">
                    sin errores registrados en este proceso.
                </div>
            `);
        }

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error al procesar resumen masivo:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('ocurrió un error al procesar el resumen en pantalla.', false, false, false);
        }
    }
}