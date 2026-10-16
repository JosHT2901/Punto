$.messenger.on('informacion', function(response) {
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
                const etiquetaSecundaria = (typeof item === 'object' && item !== null && (item.sku || item.codigo)) ? `SKU: ${item.sku || item.codigo}` : `ID: ${idItem}`;

                const htmlExito = `
                <div class="w-p-100 bg-white p-3 my-2 rounded-12 border border-slate-200 shadow-sm flex items-center justify-between gap-3 transition-all">
                    <!-- Columna Izquierda: Información principal -->
                    <div class="flex-1 flex items-center gap-3 min-w-140">
                        <div class="w-40 h-40 rounded-8 bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
                            <i class="vf-ic_fluent_checkmark_circle_24_filled fs-6"></i>
                        </div>
                        <div class="flex flex-column justify-center">
                            <span class="fw-700 text-slate-900 fs-2 mb-0.5">${nombreItem}</span>
                            <span class="fw-500 text-slate-500 fs-1">${etiquetaSecundaria}</span>
                        </div>
                    </div>
                    <!-- Columna Derecha: Estado o fecha -->
                    <div class="flex-1 flex items-center justify-end gap-2 text-right">
                        <span class="badge-estado rounded-full py-1 px-3 fs-1 fw-600 bg-emerald-50 text-emerald-700 border border-emerald-200/60">Procesado</span>
                    </div>
                </div>`;
                $contenedorProcesados.append(htmlExito);
            });
        } else {
            $contenedorProcesados.html(`
                <div class="w-p-100 py-3 text-center text-slate-400 fs-1 italic">
                    No hay elementos procesados exitosamente.
                </div>
            `);
        }

        // --- 4. RENDERIZAR FALLIDOS / ERRORES (Con tu estilo exacto solicitado) ---
        if (failed.length > 0) {
            $.each(failed, function (index, item) {
                const idItem = (typeof item === 'object' && item !== null) ? (item.id || item.codigo || '---') : item;
                const nombreItem = (typeof item === 'object' && item !== null) ? (item.nombre || item.titulo || `Elemento #${idItem}`) : `Elemento #${item}`;
                const motivoError = (typeof item === 'object' && item !== null && item.reason) ? item.reason : 'Motivo de falla';

                const htmlError = `
                <div class="w-p-100 bg-white p-3 my-2 rounded-12 border border-slate-200 shadow-sm flex items-center justify-between gap-3 transition-all">
                    <!-- Columna Izquierda: Información principal -->
                    <div class="flex-1 flex items-center gap-3 min-w-140">
                        <div class="w-40 h-40 rounded-8 bg-red-50 flex items-center justify-center shrink-0 text-red-600">
                            <i class="vf-ic_fluent_warning_24_filled fs-6"></i>
                        </div>
                        <div class="flex flex-column justify-center">
                            <span class="fw-700 text-slate-900 fs-2 mb-0.5">${nombreItem}</span>
                            <span class="fw-500 text-red-600 fs-1 reason-error">${motivoError}</span>
                        </div>
                    </div>
                    <!-- Columna Derecha: Estado o fecha -->
                    <div class="flex-1 flex items-center justify-end gap-2 text-right">
                        <span class="badge-estado rounded-full py-1 px-3 fs-1 fw-600 bg-red-50 text-red-700 border border-red-200/60">Error</span>
                    </div>
                </div>`;
                $contenedorErrores.append(htmlError);
            });
        } else {
            $contenedorErrores.html(`
                <div class="w-p-100 py-3 text-center text-slate-400 fs-1 italic">
                    Sin errores registrados en este proceso.
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
            MostrarMensaje('Ocurrió un error al procesar el resumen en pantalla.', false, false, false);
        }
    }
}