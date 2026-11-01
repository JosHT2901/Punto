window.FileViewer.registerModule({
    name: 'VideoModule',
    shouldHandle: (file) => (file.type && file.type.includes('video')) || /\.(mp4|webm|ogg|mov)$/i.test(file.name),
    
    init: async (file, $container, $toolbar, $headerActions, setRender) => {
        // 1. Estilos Material Design / Google Workspace con ancho completo
        if ($('#video-module-styles').length === 0) {
            $('head').append(`
                <style id="video-module-styles">
                    .google-progress { 
                        -webkit-appearance: none; width: 100%; height: 4px; background: rgba(255, 255, 255, 0.2); 
                        border-radius: 2px; cursor: pointer; transition: background 0.2s ease; outline: none;
                    }
                    .google-progress:hover { background: rgba(138, 180, 248, 0.5); }
                    .google-progress::-webkit-slider-thumb { 
                        -webkit-appearance: none; width: 12px; height: 12px; background: #8ab4f8; 
                        border-radius: 50%; opacity: 0; transition: opacity 0.2s ease;
                    }
                    .google-progress:hover::-webkit-slider-thumb { opacity: 1; }
                    .time-google { font-weight: 500; font-size: 12px; color: #e8eaed; min-width: 42px; text-align: center; font-variant-numeric: tabular-nums; }
                    .vol-google { -webkit-appearance: none; width: 90px; height: 4px; background: rgba(255, 255, 255, 0.2); border-radius: 2px; outline: none; cursor: pointer; }
                    .vol-google::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; background: #8ab4f8; border-radius: 50%; }
                    
                    /* Estilo Botones Google Material Design */
                    .btn-google { 
                        background: #3c4043; 
                        border: none; 
                        color: #e8eaed; 
                        cursor: pointer; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        height: 36px; 
                        padding: 0 16px; 
                        border-radius: 18px; 
                        font-size: 13px;
                        font-weight: 500;
                        gap: 8px;
                        transition: background 0.2s ease, box-shadow 0.2s ease;
                        box-shadow: 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15);
                    }
                    .btn-google:hover { 
                        background: #5f6368; 
                        box-shadow: 0 1px 3px 0 rgba(0,0,0,0.4), 0 4px 8px 3px rgba(0,0,0,0.15);
                    }
                    .btn-google-primary {
                        background: #8ab4f8;
                        color: #202124;
                    }
                    .btn-google-primary:hover {
                        background: #aecbfa;
                    }
                    .btn-google-icon {
                        width: 36px;
                        padding: 0;
                        border-radius: 50%;
                    }
                </style>
            `);
        }

        $container.css({ 
            'display': 'flex', 'justify-content': 'center', 'align-items': 'center',
            'padding': '0', 'overflow': 'hidden', 'background': '#000', 'width': '100%', 'height': '100%'
        });

        $container.html(`
            <video id="viewer-video" autoplay playsinline style="max-width: 100%; max-height: 100%; object-fit: contain;">
                <source src="${file.url}" type="${file.type || 'video/mp4'}">
                Tu navegador no soporta la reproducción de videos.
            </video>
        `);

        const video = document.getElementById('viewer-video');
        if (!video) return;

        const formatTime = (s) => {
            if (isNaN(s)) return "0:00";
            const mins = Math.floor(s / 60);
            const secs = Math.floor(s % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        };

        // 2. Toolbar inferior extendida al 100% de ancho del visor
        $toolbar.empty().css({ 
            'display': 'flex', 'flex-direction': 'column', 'padding': '14px 28px', 'width': '100%', 'box-sizing': 'border-box', 'gap': '10px', 'background': '#202124', 'border-top': '1px solid #3c4043'
        });

        // Barra de progreso ocupando todo el ancho
        const $barWrapper = $('<div>', { style: 'display:flex; align-items:center; gap:14px; width:100%;' }).appendTo($toolbar);
        const $currentTime = $('<span>', { class: 'time-google', text: '0:00' }).appendTo($barWrapper);
        const $progress = $('<input>', { type: 'range', class: 'google-progress', value: 0, min: 0, step: 0.1 }).appendTo($barWrapper);
        const $duration = $('<span>', { class: 'time-google', text: '0:00' }).appendTo($barWrapper);

        // Fila de controles alineada de extremo a extremo (Space Between)
        const $btnsRow = $('<div>', { style: 'display:flex; justify-content:space-between; align-items:center; width:100%;' }).appendTo($toolbar);
        const $leftControls = $('<div>', { style: 'display:flex; align-items:center; gap:12px;' }).appendTo($btnsRow);
        const $rightControls = $('<div>', { style: 'display:flex; align-items:center; gap:12px;' }).appendTo($btnsRow);

        const createGoogleBtn = (iconClass, text, action, isPrimary = false, isIconOnly = false) => {
            let className = isIconOnly ? 'btn-google btn-google-icon' : 'btn-google';
            if (isPrimary) className += ' btn-google-primary';

            const content = isIconOnly ? `<i class="icon fs-6 ${iconClass}"></i>` : `<i class="icon fs-6 ${iconClass}"></i><span>${text}</span>`;
            
            return $('<button>', { class: className, title: isIconOnly ? text : '' })
                .html(content)
                .on('click', action)
                .appendTo(isIconOnly ? $rightControls : $leftControls);
        };

        createGoogleBtn('vf-ic_fluent_previous_24_filled', '-10s', () => video.currentTime = Math.max(0, video.currentTime - 10));
        
        const $playBtn = $('<button>', { class: 'btn-google btn-google-primary btn-google-icon', title: 'Pausar' })
            .html(`<i class="icon fs-6 vf-ic_fluent_pause_24_filled"></i>`)
            .on('click', () => {
                if (video.paused) video.play();
                else video.pause();
            })
            .appendTo($leftControls);

        createGoogleBtn('vf-ic_fluent_next_24_filled', '+10s', () => video.currentTime = Math.min(video.duration, video.currentTime + 10));

        // Control de Volumen estilo Google
        const $volContainer = $('<div>', { style: 'display:flex; align-items:center; gap:10px; color: #e8eaed; background: #3c4043; padding: 0 16px; height: 36px; border-radius: 18px; margin-left: 6px;' }).appendTo($leftControls);
        $volContainer.append('<i class="icon fs-6 vf-ic_fluent_speaker_2_24_filled"></i>');
        
        $('<input>', { type: 'range', min: 0, max: 1, step: 0.05, value: 1, class: 'vol-google' })
            .on('input', (e) => {
                video.volume = e.target.value;
                video.muted = (e.target.value == 0);
            })
            .appendTo($volContainer);

        // Pantalla completa alineada a la derecha
        createGoogleBtn('vf-ic_fluent_arrow_expand_24_filled', 'Pantalla completa', () => {
            if (video.requestFullscreen) video.requestFullscreen();
            else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
        }, false, true);

        // Eventos del video
        video.addEventListener('play', () => {
            $playBtn.html(`<i class="icon fs-6 vf-ic_fluent_pause_24_filled"></i>`).attr('title', 'Pausar');
        });
        video.addEventListener('pause', () => {
            $playBtn.html(`<i class="icon fs-6 vf-ic_fluent_play_24_filled"></i>`).attr('title', 'Reproducir');
        });
        video.addEventListener('loadedmetadata', () => { 
            if ($progress.length) {
                $progress.attr('max', video.duration);
                $duration.text(formatTime(video.duration));
            }
        });
        video.addEventListener('timeupdate', () => { 
            if (!video.seeking && $progress.length) {
                $progress.val(video.currentTime); 
                $currentTime.text(formatTime(video.currentTime));
            }
        });
        $progress.on('input', (e) => { 
            video.currentTime = e.target.value; 
        });

        // 3. Limpieza estricta al cerrar
        const limpiarRecursos = () => {
            try {
                if (video) {
                    video.pause();
                    video.removeAttribute('src');
                    video.load();
                }
            } catch (e) {}
            
            if ($toolbar) $toolbar.empty().removeAttr("style");
            if ($container) $container.empty();
        };

        $('#close-file-viewer').off('click.videoCleanup').on('click.videoCleanup', limpiarRecursos);
        $(document).off('keydown.videoEscape').on('keydown.videoEscape', (e) => {
            if (e.key === 'Escape') limpiarRecursos();
        });

        setRender(() => {
            limpiarRecursos();
        }); 
    }
});