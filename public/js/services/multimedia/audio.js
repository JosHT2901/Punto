window.FileViewer.registerModule({
    name: 'AudioModule',
    shouldHandle: (file) => file.type.includes('audio') || /\.(mp3|wav|ogg|m4a)$/i.test(file.name),
    
    init: async (file, $container, $toolbar,$headerActions, setRender) => {
        // Estilos limpios y autocontenidos
        if ($('#audio-styles').length === 0) {
            $('head').append(`
                <style id="audio-styles">
                    .yt-progress { -webkit-appearance: none; width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; cursor: pointer; accent-color: #ef4444; }
                    .vol-slider { -webkit-appearance: none; width: 60px; height: 4px; background: #d1d5db; border-radius: 2px; accent-color: #374151; cursor: pointer; }
                    .time-text { font-size: 12px; color: #64748b; min-width: 40px; font-weight: 600; }
                </style>
            `);
        }

        // Renderizado principal del visor
        $container.css({ 
            'display': 'flex', 'flex-direction': 'column', 'justify-content': 'center', 
            'align-items': 'center', 'padding': '40px', 'width': '100%', 'height': '100%', 'background': '#0f172a'
        }).html(`
            <div style="text-align: center;">
                <div class="w-80 h-80 rounded-20 bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-4 shadow-inner text-slate-300">
                    <i class="vf-ic_fluent_music_note_1_24_filled fs-9"></i>
                </div>
                <h3 style="font-family: inherit; color: #f8fafc; font-size: 16px; font-weight: 700; max-width: 400px;" class="texto-truncado">${file.name}</h3>
                <audio id="viewer-audio" src="${file.url}" preload="metadata" autoplay></audio>
            </div>
        `);

        const audio = document.getElementById('viewer-audio');

        // Formato de tiempo (MM:SS) optimizado
        const formatTime = (seconds) => {
            if (isNaN(seconds)) return "0:00";
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        // Toolbar al estilo reproductor moderno
        $toolbar.empty().css({ 
            'display': 'flex', 'flex-direction': 'column', 'padding': '12px 24px', 'gap': '8px'
        });

        // 1. Barra de progreso horizontal
        const $barWrapper = $('<div>', { style: 'display:flex; align-items:center; gap:12px; width:100\%;' }).appendTo($toolbar);
        const $currentTime = $('<span>', { class: 'time-text', text: '0:00' }).appendTo($barWrapper);
        const $progress = $('<input>', { type: 'range', class: 'yt-progress', value: 0, min: 0, step: 0.1 }).appendTo($barWrapper);
        const $duration = $('<span>', { class: 'time-text', text: '0:00' }).appendTo($barWrapper);

        // 2. Botones de control y Volumen
        const $btns = $('<div>', { style: 'display:flex; justify-content:space-between; align-items:center; width:100\%; margin-top:4px;' }).appendTo($toolbar);
        
        const $leftControls = $('<div>', { style: 'display:flex; gap:12px; align-items:center;' }).appendTo($btns);
        
        const createBtn = (iconClass, action) => 
            $('<button>', { html: `<i class="${iconClass}"></i>`, class: 'btn btn-option border border-slate-200/80 shadow-2xs rounded-8 p-2 text-slate-700 bg-white hover:bg-slate-50' })
            .on('click', action).appendTo($leftControls);

        createBtn('vf-ic_fluent_rewind_10_24_regular', () => audio.currentTime = Math.max(0, audio.currentTime - 10));
        
        const $playBtn = createBtn('vf-ic_fluent_pause_24_filled', () => {
            if (audio.paused) {
                audio.play();
                $playBtn.find('i').attr('class', 'vf-ic_fluent_pause_24_filled');
            } else {
                audio.pause();
                $playBtn.find('i').attr('class', 'vf-ic_fluent_play_24_filled');
            }
        });

        createBtn('vf-ic_fluent_forward_10_24_regular', () => audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10));

        // Control de Volumen
        const $volContainer =$('<div>', { style: 'display:flex; align-items:center; gap:8px; color: #64748b;' }).appendTo($btns);$volContainer.append('<i class="vf-ic_fluent_speaker_2_24_regular fs-5"></i>');
        $('<input>', { type: 'range', min: 0, max: 1, step: 0.05, value: audio.volume, class: 'vol-slider' })
            .on('input', (e) => audio.volume = e.target.value)
            .appendTo($volContainer);

        // Eventos nativos del elemento de audio
        audio.addEventListener('loadedmetadata', () => { 
            $progress.attr('max', audio.duration);$duration.text(formatTime(audio.duration));
        });

        audio.addEventListener('timeupdate', () => { 
            if (!audio.seeking) {
                $progress.val(audio.currentTime);$currentTime.text(formatTime(audio.currentTime));
            }
        });

        audio.addEventListener('ended', () => {
            $playBtn.find('i').attr('class', 'vf-ic_fluent_play_24_filled');
        });

        $progress.on('input', (e) => { 
            audio.currentTime = e.target.value; 
            $currentTime.text(formatTime(audio.currentTime));
        });

        // Limpieza automática al desmontar/cerrar el visor
        setRender(() => {
            audio.pause();
            audio.src = "";
            audio.remove();
        });
    }
});