window.FileViewer.registerModule({
    name: 'ImageModule',
    shouldHandle: (file) => (file.type && file.type.includes('image')) || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name),
    
    init: async (file, $container, $toolbar, $headerActions, setRender) => {
        let zoom = 1;
        
        // 1. Estilos Material Design / Google Workspace
        if ($('#image-module-styles').length === 0) {
            $('head').append(`
                <style id="image-module-styles">
                    .btn-google { 
                        background: #3c4043; border: none; color: #e8eaed; cursor: pointer; display: flex; 
                        align-items: center; justify-content: center; height: 36px; padding: 0 16px; border-radius: 18px; 
                        font-size: 13px; font-weight: 500; gap: 8px; transition: background 0.2s ease, box-shadow 0.2s ease;
                        box-shadow: 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15);
                    }
                    .btn-google:hover { background: #5f6368; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.4), 0 4px 8px 3px rgba(0,0,0,0.15); }
                    .btn-google-primary { background: #8ab4f8; color: #202124; }
                    .btn-google-primary:hover { background: #aecbfa; }
                    .btn-google-icon { width: 36px; padding: 0; border-radius: 50%; }
                </style>
            `);
        }

        // Contenedor principal con fondo oscuro y centrado perfecto
        $container.css({ 
            'display': 'flex', 'justify-content': 'center', 'align-items': 'center',
            'padding': '0', 'overflow': 'hidden', 'background': '#0f172a', 'width': '100%', 'height': '100%'
        }).html(`
            <img id="viewer-img" src="${file.url}" style="max-width: 100%; max-height: 100%; transition: transform 0.1s ease-out; cursor: grab; object-fit: contain; transform-origin: center center;">
        `);

        const img = document.getElementById('viewer-img');
        if (!img) return;

        // Función para actualizar la escala de zoom
        const updateZoom = () => {
            img.style.transform = `scale(${zoom})`;
        };

        // 2. Soporte para zoom con la ruedita del mouse (Wheel)
        const handleWheel = (e) => {
            e.preventDefault(); // Evita el scroll por defecto del contenedor
            
            const zoomStep = 0.15;
            if (e.deltaY < 0) {
                // Rueda hacia arriba -> Acercar (Máximo 4x)
                zoom = Math.min(4, zoom + zoomStep);
            } else {
                // Rueda hacia abajo -> Alejar (Mínimo 0.5x)
                zoom = Math.max(0.5, zoom - zoomStep);
            }
            updateZoom();
        };

        img.addEventListener('wheel', handleWheel, { passive: false });

        // --- Toolbar inferior extendida al 100% con estilo Google ---
        $toolbar.empty().css({ 
            'display': 'flex', 'justify-content': 'center', 'align-items': 'center',
            'padding': '14px 28px', 'width': '100%', 'box-sizing': 'border-box', 'gap': '12px', 'background': '#202124', 'border-top': '1px solid #3c4043'
        });

        const createGoogleBtn = (iconClass, text, action, isPrimary = false, isIconOnly = false) => {
            let className = isIconOnly ? 'btn-google btn-google-icon' : 'btn-google';
            if (isPrimary) className += ' btn-google-primary';
            const content = isIconOnly ? `<i class="icon fs-6 ${iconClass}"></i>` : `<i class="icon fs-6 ${iconClass}"></i><span>${text}</span>`;
            
            return $('<button>', { class: className, title: isIconOnly ? text : '' })
                .html(content)
                .on('click', action)
                .appendTo($toolbar);
        };

        // Controles de zoom con botones
        createGoogleBtn('vf-ic_fluent_zoom_out_24_filled', 'Alejar', () => {
            zoom = Math.max(0.5, zoom - 0.2);
            updateZoom();
        }, false, true);

        createGoogleBtn('vf-ic_fluent_arrow_clockwise_24_filled', 'Restaurar', () => {
            zoom = 1;
            updateZoom();
        }, true);

        createGoogleBtn('vf-ic_fluent_zoom_in_24_filled', 'Acercar', () => {
            zoom = Math.min(4, zoom + 0.2);
            updateZoom();
        }, false, true);

        // Limpieza estricta al cerrar el visor (remueve eventos y referencias)
        const limpiarRecursos = () => {
            try {
                if (img) {
                    img.removeEventListener('wheel', handleWheel);
                    img.src = "";
                    img.remove();
                }
            } catch (e) {}

            if ($toolbar) $toolbar.empty().removeAttr("style");
            if ($container) $container.empty();
        };

        $('#close-file-viewer').off('click.imageCleanup').on('click.imageCleanup', limpiarRecursos);
        $(document).off('keydown.imageEscape').on('keydown.imageEscape', (e) => {
            if (e.key === 'Escape') limpiarRecursos();
        });

        setRender(() => {
            limpiarRecursos();
        }); 
    }
});