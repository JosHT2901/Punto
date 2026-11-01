<!-- Plantilla estática HTML para la información del documento (Oculta en el DOM) -->
<div id="plantilla-info-documento-html" class="d-none">
    <div class="flex flex-column gap-3 py-2">
        
        <!-- Tarjeta: Nombre y Extensión -->
        <div class="p-3 rounded-8" style="background: #f8fafc; border: 1px solid #e2e8f0;">
            <div class="flex items-center justify-between gap-2 mb-1">
                <span class="fs-2 fw-600 text-slate-500 uppercase tracking-wider">Nombre del archivo</span>
                <span class="js-info-doc-extension-badge badge rounded-4 px-2 py-1 fs-1 fw-700 uppercase" style="background: rgba(66, 133, 244, 0.1); color: #2563eb; border: 1px solid rgba(66, 133, 244, 0.2);">
                    -
                </span>
            </div>
            <span class="js-info-doc-nombre fs-3 fw-600 text-slate-900 d-block text-truncate" title="">-</span>
        </div>

        <!-- Grid de Métricas (Tamaño y Tipo) -->
        <div class="grid grid-2 gap-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="p-3 rounded-8" style="background: #f8fafc; border: 1px solid #e2e8f0;">
                <div class="flex items-center gap-2 mb-1 text-slate-500">
                    <span class="fs-2 fw-600 uppercase tracking-wider">Tamaño</span>
                </div>
                <span class="js-info-doc-tamano fs-3 fw-700" style="color: #2563eb;">-</span>
            </div>

            <div class="p-3 rounded-8" style="background: #f8fafc; border: 1px solid #e2e8f0;">
                <div class="flex items-center gap-2 mb-1 text-slate-500">
                    <span class="fs-2 fw-600 uppercase tracking-wider">Extensión</span>
                </div>
                <span class="js-info-doc-extension fs-3 fw-700 text-slate-700 uppercase">-</span>
            </div>
        </div>

        <!-- Tarjeta: Fechas de Auditoría y Lectura -->
        <div class="p-3 rounded-8 flex flex-column gap-2" style="background: #f8fafc; border: 1px solid #e2e8f0;">
            <div class="flex items-center justify-between pb-2" style="border-bottom: 1px dashed #cbd5e1;">
                <div class="flex items-center gap-2 text-slate-500">
                    <span class="fs-2 fw-600 uppercase tracking-wider">Fecha de Carga</span>
                </div>
                <span class="js-info-doc-creacion fs-2 fw-600 text-slate-700">-</span>
            </div>

            <div class="flex items-center justify-between pb-2" style="border-bottom: 1px dashed #cbd5e1;">
                <div class="flex items-center gap-2 text-slate-500">
                    <span class="fs-2 fw-600 uppercase tracking-wider">Última Modificación</span>
                </div>
                <span class="js-info-doc-actualizacion fs-2 fw-600 text-slate-700">-</span>
            </div>

            <div class="flex items-center justify-between pt-1">
                <div class="flex items-center gap-2 text-slate-500">
                    <span class="fs-2 fw-600 uppercase tracking-wider">Última vez abierto</span>
                </div>
                <span class="js-info-doc-lectura fs-2 fw-600 text-blue-600" style="color: #2563eb;">-</span>
            </div>
        </div>

    </div>
</div>