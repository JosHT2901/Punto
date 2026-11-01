(function($) {
    $.fn.ondaLoader = function(opciones) {
        const basePath= UI_CONFIG.ICON_PATH+'File/default.png'
        const settings = $.extend({
            progreso: 0,
            color: '#23c8fa',
            radio: 80,          // Ligeramente ajustado para prevenir bordes justos
            amplitud: 2,
            frecuencia: 30,
            velocidad: 0.15,
            imagenUrl: '' || basePath,
            imagenSize: '110px',      
            imagenSizeFull: '130px',  
            velocidadTransicion: 1.8 
        }, opciones);

        return this.each(function() {
            const $container =$(this);
            let progresoVisual = 0;
            let frameId;
            let haFinalizado = false;

            if ($("#onda-loader-styles").length === 0) {
                $('head').append(`
                    <style id="onda-loader-styles">
                        .onda-loader-wrapper {
                            position: relative;
                            width: 100%;
                            height: 100%;
                            overflow: hidden; /* Evita cualquier desbordamiento visual */
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-sizing: border-box;
                        }
                        .onda-fade-out { 
                            opacity: 0; 
                            transition: opacity 0.5s ease-in-out; 
                        }
                        .img-grow-final { 
                            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                        }
                    </style>
                `);
            }

            // Envolvemos el SVG dentro de una capa con overflow hidden controlado
            const wrapperTemplate = `
                <div class="onda-loader-wrapper">
                    <svg viewBox="0 0 200 200" style="width:100%; height:100%; max-width: 100%; max-height: 100%;">
                        <g class="main-loader-group" style="transition: opacity 0.4s ease;">
                            <path class="camino-total" fill="none" stroke="#d9e4ec" stroke-width="8" />
                            <path class="progreso-fondo" fill="none" stroke="${settings.color}40" stroke-width="8" stroke-linecap="round" />
                            <path class="serpiente" fill="none" stroke="${settings.color}" stroke-width="10" stroke-linecap="round" />
                        </g>
                        <foreignObject x="0" y="0" width="200" height="200" style="overflow: visible;">
                            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                                <img src="${settings.imagenUrl}" class="loader-img img-grow-final"
                                     style="width: ${settings.imagenSize}; height: ${settings.imagenSize}; 
                                            object-fit: contain; pointer-events: none; z-index: 10;">
                            </div>
                        </foreignObject>
                    </svg>
                </div>`;

            $container.html(wrapperTemplate);

            const $grupo =$container.find('.main-loader-group');
            const $img =$container.find('.loader-img');
            const paths = {
                total: $container.find('.camino-total')[0],
                fondo: $container.find('.progreso-fondo')[0],
                serpiente: $container.find('.serpiente')[0]
            };

            const destruirLoader = () => {
                if (haFinalizado) return;
                haFinalizado = true;
                
                $grupo.addClass('onda-fade-out');$img.css({
                    'width': settings.imagenSizeFull,
                    'height': settings.imagenSizeFull
                });

                setTimeout(() => {
                    cancelAnimationFrame(frameId);
                    $grupo.css('display', 'none'); 
                }, 500);
            };

            let offset = 0;
            const pasos = 600;
            
            // Precomputar ángulos y proporciones para optimizar la animación fluida
            const angulos = new Float64Array(pasos + 1);
            const ts = new Float64Array(pasos + 1);
            for (let i = 0; i <= pasos; i++) {
                const t = i / pasos;
                ts[i] = t;
                angulos[i] = t * Math.PI * 2;
            }

            const dibujar = () => {
                if (progresoVisual < settings.progreso) {
                    progresoVisual += settings.velocidadTransicion;
                }
                
                if (progresoVisual >= 100 && !haFinalizado) {
                    progresoVisual = 100;
                    destruirLoader();
                }

                if (!haFinalizado) {
                    let dCompleto = "";
                    let dProgreso = "";
                    const limite = Math.floor(pasos * (progresoVisual / 100));

                    for (let i = 0; i <= pasos; i++) {
                        const t = ts[i];
                        const angulo = angulos[i];
                        const onda = Math.sin((t * settings.frecuencia * Math.PI * 2) + offset) * settings.amplitud;
                        const r = settings.radio + onda;
                        const x = 100 + r * Math.cos(angulo - Math.PI / 2);
                        const y = 100 + r * Math.sin(angulo - Math.PI / 2);
                        
                        const cmd = (i === 0 ? "M " : " L ") + x.toFixed(2) + " " + y.toFixed(2);
                        dCompleto += cmd;
                        if (i <= limite) dProgreso += cmd;
                    }

                    paths.total.setAttribute("d", dCompleto);
                    paths.fondo.setAttribute("d", dProgreso);
                    paths.serpiente.setAttribute("d", dProgreso);
                    
                    offset += settings.velocidad;
                    frameId = requestAnimationFrame(dibujar);
                }
            };

            dibujar();

            $container.data('actualizar', (n) => { settings.progreso = n; });$container.data('destruir', destruirLoader);
        });
    };
})(jQuery);