window.FileViewer.registerModule({
    name: 'ImageModule',
    shouldHandle: (file) => file.type.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name),
    
    init: async (file, $container, $toolbar,$headerActions, setRender) => {
        let zoom = 1;
        
        // Contenedor principal con fondo oscuro y centrado perfecto
        $container.css({ 
            'display': 'flex', 'justify-content': 'center', 'align-items': 'center',
            'padding': '0', 'overflow': 'hidden', 'background': '#0f172a', 'width': '100%', 'height': '100%'
        });

        // Renderizado de la imagen con soporte para transiciones suaves
        $container.html(`
            <img id="viewer-img" src="${file.url}" style="max-width: 100%; max-height: 100%; transition: transform 0.15s ease; cursor: grab; object-fit: contain;">
        `);

        const img = document.getElementById('viewer-img');

        // Función para actualizar la escala de zoom
        const updateZoom = () => {
            img.style.transform = `scale(${zoom})`;
        };

        // --- Toolbar con diseño corporativo y Fluent Icons ---
        $toolbar.empty().css({ 
            'display': 'flex', 'justify-content': 'center', 'align-items': 'center',
            'gap': '8px', 'padding': '12px 24px',
        });

        const createBtn = (iconClass, title, action) => 
            $('<button>', { title: title, html: `<i class="${iconClass}"></i>`, class: 'btn btn-option border border-slate-200/80 shadow-2xs rounded-8 px-3 py-2 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1 fs-2 fw-600' })
            .on('click', action);

        // Grupo de controles de Zoom
        const $zoomGroup = $('<div>', { style: 'display: flex; gap: 8px; align-items: center;' }).appendTo($toolbar);

        createBtn('vf-ic_fluent_zoom_out_24_regular', 'Alejar Zoom', () => {
            zoom = Math.max(0.5, zoom - 0.2);
            updateZoom();
        }).appendTo($zoomGroup);
        
        createBtn('vf-ic_fluent_arrow_clockwise_24_regular', 'Restaurar Zoom', () => {
            zoom = 1;
            updateZoom();
        }).appendTo($zoomGroup);

        createBtn('vf-ic_fluent_zoom_in_24_regular', 'Acercar Zoom', () => {
            zoom = Math.min(3, zoom + 0.2);
            updateZoom();
        }).appendTo($zoomGroup);

        // Limpieza automática al cerrar el visor
        setRender(() => {
            if (img) {
                img.src = "";
                img.remove();
            }
        }); 
    }
});