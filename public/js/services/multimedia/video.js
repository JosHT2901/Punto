window.FileViewer.registerModule({
    name: 'VideoModule',
    shouldHandle: function(file) {
        return file.type.includes('video') || /\.(mp4|webm|ogg|mov)$/i.test(file.name);
    },
    
    init: function(file, $container, $toolbar,$headerActions, setRender) {
        // 1. Estilos unificados modernos (Inyectados una sola vez)
        if ($('#video-module-styles').length === 0) {
            $('head').append(`
                <style id="video-module-styles">
                    .yt-progress { 
                        -webkit-appearance: none; width: 100%; height: 4px; background: rgba(255, 255, 255, 0.2); 
                        border-radius: 2px; cursor: pointer; transition: height 0.2s ease; accent-color: #ef4444; 
                    }
                    .yt-progress:hover { height: 6px; }
                    .vol-slider { 
                        -webkit-appearance: none; width: 60px; height: 4px; background: #cbd5e1; 
                        border-radius: 2px; accent-color: #f8fafc; cursor: pointer; 
                    }
                    .video-time-text { font-weight: 600; font-size: 12px; color: #cbd5e1; min-width: 45px; text-align: center; }
                </style>
            `);
        }

        // Contenedor principal de video
        $container.css({ 
            'display': 'flex', 'justify-content': 'center', 'align-items': 'center',
            'padding': '0', 'overflow': 'hidden', 'background': '#0f172a', 'width': '100%', 'height': '100%'
        });

        $container.html(`
            <video id="viewer-video" autoplay style="max-width: 100%; max-height: 100%; object-fit: contain;">
                <source src="${file.url}" type="${file.type}">
                Tu navegador no soporta la reproducción de video.
            </video>
        `);

        const video = document.getElementById('viewer-video');
        if (!video) return;

        // Función de formato de tiempo (MM:SS)
        const formatTime = (seconds) => {
            if (isNaN(seconds)) return "0:00";
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        // 2. Toolbar apilada estilo YouTube corporativa
        $toolbar.empty().css({ 
            'display': 'flex', 'flex-direction': 'column', 'padding': '12px 24px', 'gap': '8px', 'background': '#0f172a', 'border-top': '1px solid rgba(255, 255, 255, 0.1)'
        });

        // Barra de tiempo horizontal
        const $barWrapper = $('<div>', { style: 'display:flex; align-items:center; gap:12px; width:100\%;' }).appendTo($toolbar);
        const $currentTime = $('<span>', { class: 'video-time-text', text: '0:00' }).appendTo($barWrapper);
        const $progress = $('<input>', { type: 'range', class: 'yt-progress', value: 0, min: 0, step: 0.1 }).appendTo($barWrapper);
        const $duration = $('<span>', { class: 'video-time-text', text: '0:00' }).appendTo($barWrapper);

        // 3. Fila de botones de control
        const $btnsRow = $('<div>', { style: 'display:flex; justify-content:space-between; align-items:center; width:100\%; margin-top:2px;' }).appendTo($toolbar);
        
        const $leftGroup = $('<div>', { style: 'display:flex; align-items:center; gap:10px;' }).appendTo($btnsRow);

        const createBtn = function(iconClass, title, action) {
            return $('<button>', { title: title, html: `<i class="${iconClass}"></i>`, class: 'btn btn-option border border-slate-200/80 shadow-2xs rounded-8 px-3 py-2 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1 fs-2' })
            .on('click', action);
        };

        createBtn('vf-ic_fluent_rewind_10_24_regular', 'Retroceder 10s', function() { video.currentTime = Math.max(0, video.currentTime - 10); }).appendTo($leftGroup);
        
        const $playBtn = createBtn('vf-ic_fluent_pause_24_filled', 'Reproducir / Pausa', function() {
            if (video.paused) {
                video.play();
                $playBtn.find('i').attr('class', 'vf-ic_fluent_pause_24_filled');
            } else {
                video.pause();
                $playBtn.find('i').attr('class', 'vf-ic_fluent_play_24_filled'); } }).appendTo($leftGroup);

        createBtn('vf-ic_fluent_forward_10_24_regular', 'Adelantar 10s', function() { video.currentTime = Math.min(video.duration || 0, video.currentTime + 10); }).appendTo($leftGroup);

        // Control de Volumen y Pantalla Completa (Grupo Derecho)
        const $rightGroup = $('<div>', { style: 'display:flex; align-items:center; gap:15px;' }).appendTo($btnsRow);
        
        const $volContainer =$('<div>', { style: 'display:flex; align-items:center; gap:8px; color: #cbd5e1;' }).appendTo($rightGroup);$volContainer.append('<i class="vf-ic_fluent_speaker_2_24_regular fs-5"></i>');
        
        $('<input>', { type: 'range', min: 0, max: 1, step: 0.05, value: video.volume, class: 'vol-slider' })
            .on('input', function(e) { video.volume = e.target.value; })
            .appendTo($volContainer);

        createBtn('vf-ic_fluent_full_screen_24_regular', 'Pantalla completa', function() {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
            }
        }).appendTo($rightGroup);

        // Eventos nativos del video
        video.addEventListener('loadedmetadata', function() { 
            $progress.attr('max', video.duration);$duration.text(formatTime(video.duration));
        });

        video.addEventListener('timeupdate', function() { 
            if (!video.seeking) {
                $progress.val(video.currentTime);$currentTime.text(formatTime(video.currentTime));
            }
        });

        video.addEventListener('ended', function() {
            $playBtn.find('i').attr('class', 'vf-ic_fluent_play_24_filled');
        });

        $progress.on('input', function(e) { 
            video.currentTime = e.target.value; 
            $currentTime.text(formatTime(video.currentTime));
        });

        // Limpieza automática robusta al cerrar el visor (Previene fugas de memoria y audio en segundo plano)
        setRender(function() {
            if (video) {
                video.pause();
                video.src = "";
                video.load();
                video.remove();
            }
        });
    }
});