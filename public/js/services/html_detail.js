/* =============================================
    SERVICIO: HTML DETAIL SERVICE (Estilo Limpio & Simplificado)
============================================= */
window.HtmlDetailService = (() => {

    const inyectarEstilosDetalle = () => {
        if ($("#html-detail-simple-styles").length) return;
        const css = `
            .detail-simple-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 12px 16px;
                width: 100%;
                padding: 4px 0;
            }
            .detail-simple-item {
                display: flex;
                flex-direction: column;
                gap: 2px;
                background: #fdfdfd;
                border: 1px solid #f1f5f9;
                border-radius: 6px;
                padding: 8px 12px;
            }
            .detail-simple-label {
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #94a3b8;
            }
            .detail-simple-value {
                font-size: 13px;
                font-weight: 500;
                color: #334155;
                word-break: break-word;
            }
            .detail-simple-status {
                font-size: 11px;
                font-weight: 700;
            }
            .detail-simple-active { color: #10b981; }
            .detail-simple-inactive { color: #ef4444; }
        `;
        $('<style>').attr("id", "html-detail-simple-styles").html(css).appendTo('head');
    };

    const renderizarCampos = (element, configuracionCampos) => {
        if (!element || !Array.isArray(configuracionCampos)) return '';

        inyectarEstilosDetalle();

        const camposHtml = configuracionCampos.map(campo => {
            let valor = undefined;

            if (campo.columna && element[campo.columna] !== undefined && element[campo.columna] !== null) {
                valor = element[campo.columna];
            } else if (campo.columna === 'Fecha_Registro_Fmt') {
                valor = element.Fecha_Registro || element.fecha_registro;
            } else if (campo.columna === 'Ultima_Actualizacion_Fmt') {
                valor = element.Ultima_Actualizacion || element.ultima_actualizacion;
            } else if (campo.columna) {
                const keyEncontrada = Object.keys(element).find(k => k.toLowerCase() === campo.columna.toLowerCase());
                if (keyEncontrada) valor = element[keyEncontrada];
            }

            if (valor === undefined || valor === null || valor === '') {
                valor = '<span class="text-slate-300">---</span>';
            }

            if (campo.formatter && typeof campo.formatter === 'function') {
                valor = campo.formatter(valor, element);
            } else if (campo.columna === 'Habilitado' || campo.columna === 'estado') {
                valor = valor == 1 
                    ? '<span class="detail-simple-status detail-simple-active">● ACTIVO</span>' 
                    : '<span class="detail-simple-status detail-simple-inactive">● INACTIVO</span>';
            }

            return `
                <div class="detail-simple-item">
                    <span class="detail-simple-label">${campo.label}</span>
                    <div class="detail-simple-value">${valor}</div>
                </div>`;
        }).join('');

        return `
            <div class="detail-simple-grid">
                ${camposHtml}
            </div>
        `;
    };

    return {
        renderizarCampos
    };
})();