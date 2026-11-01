window.FileViewer.registerModule({
    name: 'AudioModule',
    shouldHandle: (file) => (file.type && file.type.includes('audio')) || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name),
    
    init: async (file, $container, $toolbar, $headerActions, setRender) => {
        if ($('#audio-module-styles').length === 0) {
            $('head').append(`
                <style id="audio-module-styles">
                    .google-audio-progress { 
                        -webkit-appearance: none; width: 100%; height: 4px; background: rgba(255, 255, 255, 0.2); 
                        border-radius: 2px; cursor: pointer; transition: background 0.2s ease; outline: none;
                    }
                    .google-audio-progress:hover { background: rgba(138, 180, 248, 0.5); }
                    .google-audio-progress::-webkit-slider-thumb { 
                        -webkit-appearance: none; width: 12px; height: 12px; background: #8ab4f8; 
                        border-radius: 50%; opacity: 0; transition: opacity 0.2s ease;
                    }
                    .google-audio-progress:hover::-webkit-slider-thumb { opacity: 1; }
                    .time-google { font-weight: 500; font-size: 12px; color: #e8eaed; min-width: 42px; text-align: center; font-variant-numeric: tabular-nums; }
                    .vol-google { -webkit-appearance: none; width: 90px; height: 4px; background: rgba(255, 255, 255, 0.2); border-radius: 2px; outline: none; cursor: pointer; }
                    .vol-google::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; background: #8ab4f8; border-radius: 50%; }
                    
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

        // Renderizado limpio inyectando el src directamente en el elemento audio
        $container.css({ 
            'display': 'flex', 'flex-direction': 'column', 'justify-content': 'center', 
            'align-items': 'center', 'padding': '40px', 'width': '100%', 'height': '100%', 'background': '#0f172a'
        }).html(`
            <div style="text-align: center;">
                <div style="width: 100px; height: 100px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.1);">
                    <i class="icon fs-9 vf-ic_fluent_music_note_1_24_filled" style="font-size: 40px; color: #8ab4f8;"></i>
                </div>
                <h3 style="color: #f8fafc; font-size: 16px; font-weight: 600; max-width: 450px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${file.name}</h3>
                <audio id="viewer-audio" src="${file.url}" preload="auto"></audio>
            </div>
        `);

        const audio = document.getElementById('viewer-audio');
        if (!audio) return;

        const formatTime = (seconds) => {
            if (isNaN(seconds) || seconds === 0) return "0:00";
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        // Toolbar inferior al 100% estilo Google
        $toolbar.empty().css({ 
            'display': 'flex', 'flex-direction': 'column', 'padding': '14px 28px', 'width': '100%', 'box-sizing': 'border-box', 'gap': '10px', 'background': '#202124', 'border-top': '1px solid #3c4043'
        });

        const $barWrapper = $('<div>', { style: 'display:flex; align-items:center; gap:14px; width:100%;' }).appendTo($toolbar);
        const $currentTime = $('<span>', { class: 'time-google', text: '0:00' }).appendTo($barWrapper);
        const $progress = $('<input>', { type: 'range', class: 'google-audio-progress', value: 0, min: 0, step: 0.1 }).appendTo($barWrapper);
        const $duration = $('<span>', { class: 'time-google', text: '0:00' }).appendTo($barWrapper);

        const $btns = $('<div>', { style: 'display:flex; justify-content:space-between; align-items:center; width:100%;' }).appendTo($toolbar);
        const $leftControls = $('<div>', { style: 'display:flex; gap:12px; align-items:center;' }).appendTo($btns);
        const $rightControls = $('<div>', { style: 'display:flex; gap:12px; align-items:center;' }).appendTo($btns);

        const createGoogleBtn = (iconClass, text, action, isPrimary = false, isIconOnly = false) => {
            let className = isIconOnly ? 'btn-google btn-google-icon' : 'btn-google';
            if (isPrimary) className += ' btn-google-primary';
            const content = isIconOnly ? `<i class="icon fs-6 ${iconClass}"></i>` : `<i class="icon fs-6 ${iconClass}"></i><span>${text}</span>`;
            
            return $('<button>', { class: className, title: isIconOnly ? text : '' })
                .html(content)
                .on('click', action)
                .appendTo(isIconOnly ? $rightControls : $leftControls);
        };

        createGoogleBtn('vf-ic_fluent_previous_24_filled', '-10s', () => audio.currentTime = Math.max(0, audio.currentTime - 10));
        
        const $playBtn = $('<button>', { class: 'btn-google btn-google-primary btn-google-icon', title: 'Reproducir' })
            .html(`<i class="icon fs-6 vf-ic_fluent_play_24_filled"></i>`)
            .on('click', () => {
                if (audio.paused) {
                    audio.play().then(() => {
                        $playBtn.html(`<i class="icon fs-6 vf-ic_fluent_pause_24_filled"></i>`).attr('title', 'Pausar');
                    }).catch(err => console.warn("Error de reproducción manual:", err));
                } else {
                    audio.pause();
                    $playBtn.html(`<i class="icon fs-6 vf-ic_fluent_play_24_filled"></i>`).attr('title', 'Reproducir');
                }
            })
            .appendTo($leftControls);

        createGoogleBtn('vf-ic_fluent_next_24_filled', '+10s', () => audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10));

        // Control de Volumen
        const $volContainer = $('<div>', { style: 'display:flex; align-items:center; gap:10px; color: #e8eaed; background: #3c4043; padding: 0 16px; height: 36px; border-radius: 18px; margin-left: 6px;' }).appendTo($leftControls);
        $volContainer.append('<i class="icon fs-6 vf-ic_fluent_speaker_2_24_regular"></i>');
        
        $('<input>', { type: 'range', min: 0, max: 1, step: 0.05, value: audio.volume, class: 'vol-google' })
            .on('input', (e) => {
                audio.volume = e.target.value;
                audio.muted = (e.target.value == 0);
            })
            .appendTo($volContainer);

        // Actualizador robusto de duración y metadatos
        const actualizarDuracion = () => {
            if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
                $progress.attr('max', audio.duration);
                $duration.text(formatTime(audio.duration));
            }
        };

        audio.addEventListener('loadedmetadata', actualizarDuracion);
        audio.addEventListener('durationchange', actualizarDuracion);
        audio.addEventListener('canplaythrough', actualizarDuracion);

        // Forzar carga de datos y reproducción automática controlada
        audio.load();
        audio.play().then(() => {
            $playBtn.html(`<i class="icon fs-6 vf-ic_fluent_pause_24_filled"></i>`).attr('title', 'Pausar');
            actualizarDuracion();
        }).catch(() => {
            // Si el navegador bloquea el autoplay, mantenemos el botón listo para reproducir
            $playBtn.html(`<i class="icon fs-6 vf-ic_fluent_play_24_filled"></i>`).attr('title', 'Reproducir');
        });

        audio.addEventListener('timeupdate', () => { 
            if (!audio.seeking && $progress.length) {
                $progress.val(audio.currentTime); 
                $currentTime.text(formatTime(audio.currentTime));
            }
            actualizarDuracion();
        });

        audio.addEventListener('ended', () => {
            $playBtn.html(`<i class="icon fs-6 vf-ic_fluent_play_24_filled"></i>`).attr('title', 'Reproducir');
        });

        $progress.on('input', (e) => { 
            audio.currentTime = e.target.value; 
            $currentTime.text(formatTime(audio.currentTime));
        });

        // Limpieza estricta al cerrar
        const limpiarRecursos = () => {
            try {
                if (audio) {
                    audio.pause();
                    audio.removeAttribute('src');
                    audio.load();
                }
            } catch (e) {}

            if ($toolbar) $toolbar.empty().removeAttr("style");
            if ($container) $container.empty();
        };

        $('#close-file-viewer').off('click.audioCleanup').on('click.audioCleanup', limpiarRecursos);
        $(document).off('keydown.audioEscape').on('keydown.audioEscape', (e) => {
            if (e.key === 'Escape') limpiarRecursos();
        });

        setRender(() => {
            limpiarRecursos();
        });
    }
});