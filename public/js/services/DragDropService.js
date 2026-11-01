/* =============================================
    SERVICIO: DRAG & DROP SERVICE (Motor Limpio con Advertencia y Control Multiple)
============================================= */
window.DragDropService = (function ($) {
    const inyectarEstilos = () => {
        if ($("#dds-styles").length) return;
        const css = `
            .dds-container-base {
                position: relative;
                box-sizing: border-box;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                flex: 1;
            }
            .dds-placeholder-wrapper {
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 2px dashed #0284c7;
                border-radius: 16px;
                background: rgba(248, 250, 252, 0.96);
                color: #0284c7;
                z-index: 100;
                pointer-events: none;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(4px);
            }
        `;
        $('<style>').attr("id", "dds-styles").html(css).appendTo('head');
    };

    function inicializar(elemento, opciones) {
        const $destino =$(elemento);
        if (!$destino.length) return;

        inyectarEstilos();

        const config = $.extend({ 
            tipo: 'archivo', 
            formatos: '*', 
            multiple: false, 
            onDrop: function(archivos) {} 
        }, opciones);

        const acceptAttr = (config.tipo === 'imagen' && config.formatos === '*') ? 'image/*' : config.formatos;
        
        if ($destino.css('position') === 'static') {$destino.css('position', 'relative');
        }

        $destino.find('.dds-placeholder-wrapper, .dds-input-oculto').remove();$destino.addClass('dds-container-base');

        const multipleAttr = config.multiple ? 'multiple' : '';

        const htmlSistema = `
            <div class="dds-placeholder-wrapper">
                <i class="icon vf-ic_fluent_arrow_download_24_filled" style="font-size: 44px; margin-bottom: 10px;"></i>
                <span class="fw-600 fs-4" style="user-select: none;">Suelta para cargar</span>
            </div>
            <input type="file" class="dds-input-oculto" style="display:none;" accept="${acceptAttr}" ${multipleAttr}>
        `;
        
        $destino.append(htmlSistema);

        const $wrapper =$destino.find('.dds-placeholder-wrapper');
        const $input =$destino.find('.dds-input-oculto');

        $wrapper.hide();

        // Método público para abrir el explorador desde código
        $destino.data('abrirExplorador', function() {$input[0].click();
        });

        $input.off('click').on('click', e => e.stopPropagation());$destino.off('.dragDropSystem');

        const validarExtension = (archivo) => {
            if (config.formatos === '*' || config.formatos === 'image/*') return true;
            const nombreArchivo = archivo.name.toLowerCase();
            const extensionesPermitidas = config.formatos.toLowerCase().split(',').map(ext => ext.trim());
            
            return extensionesPermitidas.some(ext => {
                if (ext.startsWith('.')) return nombreArchivo.endsWith(ext);
                if (ext.includes('/')) return archivo.type.match(new RegExp(ext.replace('*', '.*')));
                return false;
            });
        };

        const procesarArchivos = (files) => {
            if (!files || files.length === 0) return;
            
            const todosLosArchivos = Array.from(files);
            const filtrados = [];

            // Evaluamos archivo por archivo
            todosLosArchivos.forEach(archivo => {
                if (validarExtension(archivo)) {
                    filtrados.push(archivo);
                } else {
                    console.warn(`⚠️ Archivo no permitido rechazado: "${archivo.name}" (Formato no soportado por el sistema).`);
                    if (typeof MostrarAlerta === 'function') {
                        MostrarAlerta('Archivo no permitido', 230, true);
                    }
                }
            });
            
            if (filtrados.length > 0) {
                // CORRECCIÓN: Si multiple es false, garantizamos mandar exclusivamente un único archivo (el primero)
                const resultadoFinal = config.multiple ? filtrados : filtrados[0];
                config.onDrop(resultadoFinal);
            }
        };

        let dragCounter = 0;

        $destino.on('dragenter.dragDropSystem', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dragCounter++;
            if (dragCounter === 1) {
                $wrapper.css('display', 'flex');
            }
        }).on('dragover.dragDropSystem', function(e) {
            e.preventDefault();
            e.stopPropagation();
        }).on('dragleave.dragDropSystem', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                $wrapper.hide();
            }
        }).on('drop.dragDropSystem', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dragCounter = 0;
            $wrapper.hide();
            
            const files = e.originalEvent.dataTransfer.files;
            procesarArchivos(files);
        });

        $input.off('change').on('change', function() {
            procesarArchivos(this.files);
            $(this).val(''); 
        });

        return $destino;
    }

    return {
        init: inicializar
    };

})(jQuery);

$.fn.GenerarAreaDragDrop = function(opciones) {
    return this.each(function() {
        window.DragDropService.init(this, opciones);
    });
};