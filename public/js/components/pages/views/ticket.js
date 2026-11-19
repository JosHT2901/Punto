$(document).ready(async function () {
    try {
        MostrarCargando('Obteniendo información...', false);
        const datos = await Obtener_Configuracion_Ticket();
        console.log(datos);
        const $ticket = $('#ticket-contenedor-vista-preview');
        const $layout = $('#ticket-layout');

        /* ---------- Utilidades ---------- */
        const clamp = (v, min, max) => Math.min(Math.max(parseInt(v, 10) || 0, min), max);
        const MONO = ['Courier New', 'Consolas'];

        // Marca como activo el label seleccionado dentro de su grupo de radios
        $(document).on('change', '.btn-option input[type="radio"]', function () {
            $(this).closest('label').addClass('active').siblings('label').removeClass('active');
        });

        // Líneas en blanco (alto real: 15px por línea)
        function bindLineas(nombre, selector) {
            $('input[name="' + nombre + '"]').on('input', function () {
                const lineas = clamp($(this).val(), 0, 15);
                const $el = $(selector);
                if (lineas > 0) {
                    $el.css({
                        height: (lineas * 15) + 'px',
                        display: 'block'
                    });
                } else {
                    $el.hide();
                }
            }).trigger('input');
        }

        // Interruptor que muestra u oculta un elemento de la vista previa
        function bindToggle(nombre, selector) {
            $('input[name="' + nombre + '"]').on('change', function () {
                $(selector).toggle(this.checked);
            }).trigger('change');
        }

        // Texto + alineación de un span dinámico
        function bindTexto(nombreTexto, selector) {
            $('textarea[name="' + nombreTexto + '"]').on('input', function () {
                $(selector).text($(this).val());
            }).trigger('input');
        }

        function bindAlineacion(nombre, selector) {
            $('input[name="' + nombre + '"]').on('change', function () {
                $(selector).css('text-align', $(this).val());
            });
            $('input[name="' + nombre + '"]:checked').trigger('change');
        }

        /* ---------- Llenado inicial con los datos recibidos ---------- */
        if (datos && typeof datos === 'object') {
            // 1. Tamaño del papel
            if (datos.tamano_papel) {
                $(`input[name="tamano_papel"][value="${datos.tamano_papel}"]`).prop('checked', true).trigger('change');
            }

            // 2 y 14. Espaciados
            if (datos.espaciado_inicio !== undefined) $('input[name="espaciado_inicio"]').val(datos.espaciado_inicio);
            if (datos.espaciado_final !== undefined) $('input[name="espaciado_final"]').val(datos.espaciado_final);

            // 3, 6, 7, 8, 9. Toggles (checkboxes)
            $('input[name="mostrar_logo"]').prop('checked', datos.mostrar_logo == 1);
            $('input[name="mostrar_vendedor"]').prop('checked', datos.mostrar_vendedor == 1);
            $('input[name="mostrar_cliente"]').prop('checked', datos.mostrar_cliente == 1);
            $('input[name="descripcion_completa"]').prop('checked', datos.descripcion_completa == 1);
            $('input[name="mostrar_precio_unitario"]').prop('checked', datos.mostrar_precio_unitario == 1);

            // 4 y 5. Encabezado y su alineación
            if (datos.encabezado !== null && datos.encabezado !== undefined) {
                $('textarea[name="encabezado"]').val(datos.encabezado);
            }
            if (datos.alineacion_encabezado) {
                $(`input[name="alineacion_encabezado"][value="${datos.alineacion_encabezado}"]`).prop('checked', true);
            }

            // 12 y 13. Pie de página (leyenda_pie) y su alineación
            if (datos.leyenda_pie !== null && datos.leyenda_pie !== undefined) {
                $('textarea[name="pie"]').val(datos.leyenda_pie);
            }
            if (datos.alineacion_pie) {
                $(`input[name="alineacion_pie"][value="${datos.alineacion_pie}"]`).prop('checked', true);
            }

            // 10 y 11. Tipografía y tamaño
            if (datos.font_family) {
                const familia = String(datos.font_family).replace(/"/g, '');
                const $select = $('select[name="font_family"]');

                // Si viene una ruta de fuente personalizada guardada en la base de datos
                if (datos.font_url && datos.font_url.trim() !== '') {
                    try {
                        let rutaLimpia = datos.font_url.replace(/^(\.\.\/)+/, '').replace(/^\/+/, '');
                        const pathSegments = window.location.pathname.split('/');
                        const proyectoCarpeta = pathSegments.length > 1 && pathSegments[1] !== '' ? '/' + pathSegments[1] : '';
                        let rutaFuente = `${window.location.origin}${proyectoCarpeta}/${rutaLimpia}`;

                        const fuente = new FontFace(familia, 'url("' + rutaFuente + '")');
                        await fuente.load();
                        document.fonts.add(fuente);

                        const existe = $select.find('option').filter(function () { return this.value === familia; }).length;
                        if (!existe) {
                            $('<option>').val(familia).text(familia + ' (personalizada)').appendTo($select);
                        }
                    } catch (err) {
                        console.error("No se pudo cargar la fuente personalizada en el navegador:", err);
                    }
                }

                // Seleccionar en el select y forzar el estilo visual inmediato en el ticket
                $select.val(familia);

                const respaldo = ['Courier New', 'Consolas'].includes(familia) ? 'monospace' : 'sans-serif';
                $ticket.css('font-family', '"' + familia + '", ' + respaldo);
            }

            if (datos.font_size !== undefined) {
                $('input[name="font_size"]').val(datos.font_size);
                $ticket.css('font-size', clamp(datos.font_size, 8, 16) + 'pt');
            }

            // Sincronizar clases visuales 'active' en los radio buttons iniciales
            $('.btn-option input[type="radio"]:checked').closest('label').addClass('active').siblings('label').removeClass('active');
        }

        /* ---------- 1. Ancho del papel ---------- */
        $('input[name="tamano_papel"]').on('change', function () {
            $ticket.css('width', $(this).val() === '58mm' ? '240px' : '350px');
        });
        $('input[name="tamano_papel"]:checked').trigger('change');

        /* ---------- 2 y 14. Líneas al principio / al final ---------- */
        bindLineas('espaciado_inicio', '#ticket-contenedor-linea-inicio');
        bindLineas('espaciado_final', '#ticket-contenedor-linea-final');

        /* ---------- 3, 6, 7, 8, 9. Interruptores ---------- */
        bindToggle('mostrar_logo', '#ticket-contenedor-logotipo');
        bindToggle('mostrar_vendedor', '#ticket-contenedor-informacion-vendedor');
        bindToggle('mostrar_cliente', '#ticket-contenedor-informacion-cliente');
        bindToggle('descripcion_completa', '#ticket-item-descripcion');
        bindToggle('mostrar_precio_unitario', '#ticket-item-precio-unitario');

        /* ---------- 4 y 5. Encabezado ---------- */
        bindTexto('encabezado', '#ticket-span-encabezado');
        bindAlineacion('alineacion_encabezado', '#ticket-span-encabezado');

        /* ---------- 12 y 13. Pie de página ---------- */
        bindTexto('pie', '#ticket-span-pie');
        bindAlineacion('alineacion_pie', '#ticket-span-pie');

        /* ---------- 10. Familia de fuente ---------- */
        $('select[name="font_family"]').on('change', function () {
            const fuente = String($(this).val() || '').replace(/"/g, '');
            if (!fuente) return;
            const respaldo = MONO.includes(fuente) ? 'monospace' : 'sans-serif';
            $ticket.css('font-family', '"' + fuente + '", ' + respaldo);
        }).trigger('change');

        /* ---------- 11. Tamaño de fuente (pt) ---------- */
        $('input[name="font_size"]').on('input', function () {
            $ticket.css('font-size', clamp($(this).val() || 10, 8, 16) + 'pt');
        }).trigger('input');

        /* ---------- Subir fuente propia ---------- */
        $('#btn-subir-fuente').on('click', function () {
            $('#font-file-input').trigger('click');
        });
        $('#font-file-input').on('change', async function () {
            const archivo = this.files && this.files[0];
            const $nombre = $('#font-file-nombre');
            if (!archivo) {
                $nombre.text('Sin archivo seleccionado');
                return;
            }
            const familia = archivo.name.replace(/\.[^.]+$/, '').replace(/"/g, '');
            try {
                const url = URL.createObjectURL(archivo);
                const fuente = new FontFace(familia, 'url("' + url + '")');
                await fuente.load();
                document.fonts.add(fuente);

                const $select = $('select[name="font_family"]');
                const existe = $select.find('option').filter(function () {
                    return this.value === familia;
                }).length;
                if (!existe) {
                    $('<option>').val(familia).text(familia + ' (personalizada)').appendTo($select);
                }
                $select.val(familia).trigger('change');
                $nombre.text(archivo.name);
            } catch (e) {
                $nombre.text('No se pudo cargar la fuente');
                this.value = '';
            }
        });

        /* ---------- Pantallas pequeñas: alternar Vista previa / Ajustes ---------- */
        function mostrarVista(vista) {
            $layout.attr('data-vista', vista);
            $('#btn-ver-vista-previa').attr('data-activo', vista === 'preview');
            $('#btn-editar-ajustes').attr('data-activo', vista === 'ajustes');
            $layout.find('#ticket-panel-ajustes, #ticket-panel-preview').scrollTop(0);
        }
        $('#btn-ver-vista-previa').on('click', function () {
            mostrarVista('preview');
        });
        $('#btn-editar-ajustes').on('click', function () {
            mostrarVista('ajustes');
        });
        mostrarVista('ajustes');

        const EXT_FUENTE = ['ttf', 'otf', 'woff', 'woff2'];
        const MAX_FUENTE_MB = 2;

        // Valida lo que pueda fallar antes de enviar. Devuelve un mensaje o null.
        function validarConfiguracion() {
            const inicio = parseInt($('input[name="espaciado_inicio"]').val(), 10);
            const final = parseInt($('input[name="espaciado_final"]').val(), 10);
            const tamano = parseInt($('input[name="font_size"]').val(), 10);

            if (isNaN(inicio) || inicio < 0 || inicio > 15) return 'Las líneas al principio deben estar entre 0 y 15.';
            if (isNaN(final) || final < 0 || final > 15) return 'Las líneas al final deben estar entre 0 y 15.';
            if (isNaN(tamano) || tamano < 8 || tamano > 16) return 'El tamaño de fuente debe estar entre 8 y 16 pt.';

            const archivo = $('#font-file-input')[0].files[0];
            if (archivo) {
                const ext = archivo.name.split('.').pop().toLowerCase();
                if (!EXT_FUENTE.includes(ext)) return 'La fuente debe ser .ttf, .otf, .woff o .woff2.';
                if (archivo.size > MAX_FUENTE_MB * 1024 * 1024) return 'La fuente no puede pesar más de ' + MAX_FUENTE_MB + ' MB.';
            }
            return null;
        }

        // Reúne todos los campos. Los interruptores siempre se envían (1 o 0).
        function recolectarConfiguracion() {
            const texto = n => $('[name="' + n + '"]').val();
            const check = n => ($('input[name="' + n + '"]').is(':checked') ? 1 : 0);
            const radio = n => $('input[name="' + n + '"]:checked').val() || '';

            const datosForm = new FormData();
            datosForm.append('accion', 'gestionar_ticket');
            datosForm.append('tamano_papel', radio('tamano_papel'));
            datosForm.append('espaciado_inicio', texto('espaciado_inicio'));
            datosForm.append('espaciado_final', texto('espaciado_final'));
            datosForm.append('mostrar_logo', check('mostrar_logo'));
            datosForm.append('encabezado', texto('encabezado'));
            datosForm.append('alineacion_encabezado', radio('alineacion_encabezado'));
            datosForm.append('mostrar_vendedor', check('mostrar_vendedor'));
            datosForm.append('mostrar_cliente', check('mostrar_cliente'));
            datosForm.append('descripcion_completa', check('descripcion_completa'));
            datosForm.append('mostrar_precio_unitario', check('mostrar_precio_unitario'));
            datosForm.append('pie', texto('pie'));
            datosForm.append('alineacion_pie', radio('alineacion_pie'));
            datosForm.append('font_family', texto('font_family'));
            datosForm.append('font_size', texto('font_size'));

            const archivo = $('#font-file-input')[0].files[0];
            if (archivo) datosForm.append('font_file', archivo);
            return datosForm;
        }

        // Delegado: el botón lo pinta el layout
        $(document).on('click', '#btn-guardar', async function (e) {
            e.preventDefault();

            const error = validarConfiguracion();
            if (error) {
                MostrarAlerta(error, 250, false);
                return;
            }
            const payload = recolectarConfiguracion();
            await Guardar_Ticket_AJAX(payload);
        });
        $(document).on('click', '#btn-atras', async function (e) {
            e.preventDefault();
            window.location.href="ajustes.php"
        });
        OcultarCargando();
    } catch (error) {
        OcultarCargando();
        MostrarMensaje(error || 'Ocurrió un error', false, false, false);
    }
});