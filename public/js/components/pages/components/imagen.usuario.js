$(document).ready(function () {
    function Iniciar_Pagina_Perfil() {
        const $contenedor = $('#contenedor-croppie');
        const imagenDesdeBD = window.imagenBase64 || null;

        if (!imagenDesdeBD) {
            // Si no hay imagen, ocultamos el botón de eliminar y pintamos el panel inicial
            $("#btn-eliminar-imagen").addClass('d-none');
            Renderizar_Panel_Inicial_Perfil($contenedor);
        } else {
            // Si hay imagen desde BD, mostramos el botón de eliminar y montamos Croppie directamente
            $("#btn-eliminar-imagen").removeClass('d-none');
            RecortadorUI.inicializarPerfilUsuario($contenedor, imagenDesdeBD);
        }
    }

    // 1. Si window.imagenBase64 ya fue resuelto antes de que cargara este script, arrancamos directo
    if (typeof window.imagenBase64 !== 'undefined') {
        Iniciar_Pagina_Perfil();
    }

    // 2. También escuchamos el evento por si los datos llegan de forma asíncrona después
    $(document).off('datosListos.gestionImagen').on('datosListos.gestionImagen', function () {
        Iniciar_Pagina_Perfil();
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
    });

    // 3. Conexión segura SIN bucle infinito (ignoramos si el clic viene del propio input file)
    $(document).off('click.examinar').on('click.examinar', '#btn-examinar-externo, #mi-panel-inicial', function (e) {
        if ($(e.target).is('input[type="file"]')) return; // 🛑 Rompe el bucle infinito

        e.preventDefault();
        e.stopPropagation();

        const $contenedor = $('#contenedor-croppie');
        const $inputOculto = $contenedor.find('.dds-input-oculto');
        if ($inputOculto.length) {
            $inputOculto[0].click();
        }
    });

    // Evento para guardar la imagen de perfil
    $(document).off('click.guardarPerfil').on('click.guardarPerfil', '#btn-guardar, #boton-guardar-imagen, #btn-guardar-imagen', async function (e) {
        e.preventDefault();

        if (!window.miRecortadorActual || typeof window.miRecortadorActual.obtenerImagen !== 'function') {
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta('No hay una imagen activa para guardar.', 230, true);
            }
            return;
        }

        try {
            const imagenBase64 = await new Promise((resolve) => {
                window.miRecortadorActual.obtenerImagen(function (base64) {
                    resolve(base64);
                }, {
                    type: 'base64',
                    size: 'viewport',
                    format: 'jpeg',
                    quality: 0.9
                });
            });

            const datosImagen = {
                accion: 'gestionar_imagen_usuario',
                imagen: imagenBase64
            };

            await Guardar_Imagen_Perfil(datosImagen);

        } catch (error) {
            console.error("Error al procesar la imagen con Croppie:", error);
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta('Ocurrió un error al procesar la imagen recortada.', 300, true);
            }
        }
    });

    // Evento para eliminar la imagen con confirmación
    $(document).off('click.eliminarPerfil').on('click.eliminarPerfil', '#btn-eliminar-imagen', async function (e) {
        e.preventDefault();

        const confirmado = await MostrarPregunta({
            titulo: 'Eliminar Imagen',
            texto: '¿Estás seguro de que deseas eliminar tu imagen de perfil?',
            icono: 'vf-ic_fluent_delete_24_filled',
            confirmarText: 'Eliminar',
            cancelarText: 'Cancelar',
            colorConfirmar: 'btn-danger',
            altura: 350
        });

        if (!confirmado) return;

        Ejecutar_Eliminacion_Imagen_Perfil();
    });

});


function Renderizar_Panel_Inicial_Perfil($contenedor) {
    if (!$contenedor.length) return;
    if ($('#mi-panel-inicial').length > 0) return;

    $contenedor.html(`
        <!-- Panel grande inicial -->
        <div id="mi-panel-inicial" class="dds-ui-inicial h-p-100" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30px 24px; border: 2px dashed #cbd5e1; border-radius: 16px; background: #ffffff; width: 100%; box-sizing: border-box; cursor: pointer;">
            <div style="width: 56px; height: 56px; border-radius: 14px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-bottom: 14px;">
                <i class="icon vf-ic_fluent_image_24_filled" style="font-size: 26px; color: #03618d;"></i>
            </div>
            <div style="font-size: 14.5px; font-weight: 600; color: #0f172a; margin-bottom: 4px; user-select: none;">Suelta tu foto de perfil</div>
            <div style="font-size: 12.5px; color: #64748b; margin-bottom: 16px; user-select: none;">Formatos permitidos:</div>
            <span style="display: inline-block; padding: 3px 10px; background: #f1f5f9; color: #475569; border-radius: 20px; font-size: 11.5px; font-weight: 500; margin-bottom: 18px; border: 1px solid #e2e8f0;">PNG, JPG, JPEG</span>
            <div style="display: flex; align-items: center; gap: 12px; width: 100%; max-width: 200px; margin-bottom: 18px;">
                <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
                <span style="font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">ó</span>
                <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
            </div>
            <button type="button" id="btn-examinar-externo" style="background-color: #03618d; color: #ffffff; border: none; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                <i class="icon vf-ic_fluent_folder_open_24_filled" style="font-size: 16px;"></i>
                <span>Examinar imágenes</span>
            </button>
        </div>
    `);

    if (typeof window.DragDropService === 'object') {
        window.DragDropService.init($contenedor, {
            tipo: 'imagen',
            formatos: '.png,.jpg,.jpeg',
            multiple: false,
            onDrop: function (archivo) {
                RecortadorUI.inicializarPerfilUsuario($contenedor, archivo);
            }
        });

        // 🛑 Detenemos también la propagación directamente en el input generado por DragDropService
        $contenedor.find('.dds-input-oculto').off('click.stop').on('click.stop', function (e) {
            e.stopPropagation();
        });
    }
}