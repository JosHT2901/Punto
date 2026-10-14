window.numero_marcas = 0; // Controla el número consecutivo único para el ID y título de la tarjeta
window.total_marcas_activas = 0; // Controla cuántas tarjetas hay vivas actualmente

const MarcasSelectionController = CrearSeleccionController('GestionMarcas');

$.messenger.on('datos_iniciales', function (data, sourceWindow, origin) {
    if(!data.mostrar_boton_varias)
    {
        $("#gestionar-marca-masivo").hide()
    }
})
$(document).ready(async function () {
    let inicializado = false;

    function InicilizarGestionarMarcas() {
        if (inicializado) return;
        inicializado = true;

        console.log(window.marcas)
        const $contenedor = $("#contenedor-lista-marcas");
        InputService.aMayusculas('.input-mayus');

        // Renderizamos el estado inicial de carga/vacío (siempre y cuando no esté en modo edición con datos previos)
        if (typeof window.id_marca_edicion === 'undefined' || !window.id_marca_edicion) {
            Contenedor_Agregar('Agrega una marca', $contenedor);
        }

        // 1. Evento para el switch masivo
        $("#gestionar-marcas-check-varias").off('change.marcasMasivo').on('change.marcasMasivo', function () {
            let estaMarcado = $(this).is(':checked');

            if (estaMarcado) {
                $("#gestionar-marcas-masivo").css("display", "flex");
                $("#gestionar-marca-unica").hide();
            } else {
                $("#gestionar-marcas-masivo").hide();
                $("#gestionar-marca-unica").show();
            }
        });

        // 2. Evento para agregar nueva tarjeta
        $("#btn-agregar-nueva-marca").off('click.agregarMarca').on('click.agregarMarca', function (e) {
            e.preventDefault();

            // Si existe el contenedor de estado vacío "Agregar", lo removemos antes de insertar
            if ($("#contenedor-agregar").length) {
                $("#contenedor-agregar").remove();
            }
            AgregarNuevaTarjetaMarca();
        });

        // 3. Evento delegado para el botón eliminar tarjeta (Basado 100% en variables)
        $contenedor.off('click.eliminarTarjeta').on('click.eliminarTarjeta', '.boton-eliminar-tarjeta-marca', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const $tarjeta = $(this).closest('.tarjeta-marca-item');
            const $checkbox = $tarjeta.find('.check-item');
            const idTarjeta = $checkbox.data('id');

            // Si estaba seleccionada, forzamos su desmarque para actualizar contadores de selección
            if (idTarjeta && typeof MarcasSelectionController !== 'undefined') {
                if ($checkbox.is(':checked')) {
                    $checkbox.prop('checked', false).trigger('change');
                }
            }

            // Animamos y removemos la tarjeta del DOM
            $tarjeta.fadeOut(200, function () {
                $(this).remove();

                // Decrementamos nuestra variable de total activo
                window.total_marcas_activas -= 1;
                if (window.total_marcas_activas < 0) window.total_marcas_activas = 0;

                // Actualizamos el texto masivo usando la variable
                const totalRestante = window.total_marcas_activas;
                $("#contador-marcas-masivas").text(`${totalRestante} marca${totalRestante !== 1 ? 's' : ''}`);

                // Si ya no quedan marcas activas, reiniciamos todo a 0
                if (totalRestante === 0) {
                    window.numero_marcas = 0;
                    Contenedor_Agregar('Agrega una marca', $contenedor);
                    $("#contenedor-marcas-acciones").hide();
                }
            });
        });

        // 4. Inicialización del controlador de selección
        MarcasSelectionController.init({
            scope: $contenedor,
            checkItemClass: '.check-item',
            tarjetaClass: '.tarjeta-marca-item',
            claseActiva: 'seleccionada',
            checkAllId:'check-item-all',
            onChange: (seleccionadas, estado, idModificado) => {
                console.log(sele)
                const cantidad = seleccionadas.size;
                const textoPlural = `${cantidad} marca${cantidad !== 1 ? 's' : ''}`;

                console.log(`Checkbox con ID ${idModificado} cambió a: ${estado} | Total: ${textoPlural}`);

                const $panelAcciones = $("#contenedor-marcas-acciones");
                const $contadorTexto = $("#contador-marcas-acciones");

                if (cantidad > 0) {
                    $panelAcciones.css("display", "flex");
                    $contadorTexto.text(textoPlural);
                } else {
                    $panelAcciones.hide();
                    $contadorTexto.text('0');
                }
            }
        });

        // Configurar el evento del botón de eliminar una sola vez (fuera o controlado)
        // --- ELIMINAR TARJETAS SELECCIONADAS ---
        $(document).off('click', '#gestionar-marcas-btn-eliminar-seleccionadas').on('click', '#gestionar-marcas-btn-eliminar-seleccionadas', function (e) {
            e.preventDefault();

            // Buscamos todas las tarjetas seleccionadas
            const $tarjetasSeleccionadas = $contenedor.find('.tarjeta-marca-item.marca-seleccionada');

            if ($tarjetasSeleccionadas.length === 0) {
                return MostrarAlerta("Selecciona al menos una tarjeta para eliminar.", 220, true);
            }

            // Iteramos cada tarjeta seleccionada para aplicar la misma lógica de limpieza individual
            $tarjetasSeleccionadas.each(function () {
                const $tarjeta = $(this);
                const $checkbox = $tarjeta.find('.check-item');
                const idTarjeta = $checkbox.data('id');

                // Si estaba seleccionada, forzamos su desmarque para actualizar contadores
                if (idTarjeta && typeof MarcasSelectionController !== 'undefined') {
                    if ($checkbox.is(':checked')) {
                        $checkbox.prop('checked', false).trigger('change');
                    }
                }

                // Animamos y removemos del DOM
                $tarjeta.fadeOut(200, function () {
                    $(this).remove();

                    // Decrementamos la variable global de marcas activas
                    if (typeof window.total_marcas_activas !== 'undefined') {
                        window.total_marcas_activas -= 1;
                        if (window.total_marcas_activas < 0) window.total_marcas_activas = 0;
                    }

                    // Actualizamos el texto masivo utilizando la variable global
                    const totalRestante = typeof window.total_marcas_activas !== 'undefined' ? window.total_marcas_activas : $contenedor.find('.tarjeta-marca-item').length;
                    $("#contador-marcas-masivas").text(`${totalRestante} marca${totalRestante !== 1 ? 's' : ''}`);

                    // Si ya no quedan marcas activas, reiniciamos todo a su estado inicial
                    if (totalRestante === 0) {
                        window.numero_marcas = 0;
                        if (typeof Contenedor_Agregar === 'function') {
                            Contenedor_Agregar('Agrega una marca', $contenedor);
                        }
                        $("#contenedor-marcas-acciones").hide();
                    }
                });
            });

            // Ocultar el panel flotante de acciones inmediatamente
            $("#contenedor-marcas-acciones").hide();
        });
        $("#marca-input-nombre-unico").off('input.validarMarca').on('input.validarMarca', function () {
            ValidarInputDuplicadoEnVivo($(this));
        });

        // Para todas las tarjetas masivas (actuales y futuras)
        $("#contenedor-lista-marcas").off('input.validarMasivo', 'input[name="nombre"]').on('input.validarMasivo', 'input[name="nombre"]', function () {
            ValidarInputDuplicadoEnVivo($(this));
        });

        // 5. Evento para el botón Guardar (maneja modo único, edición o masivo según el switch)
        $("#gestionar-marcas-boton-guardar").off('click.guardarMarcas').on('click.guardarMarcas', function (e) {
            e.preventDefault();

            // Asegurar que window.marcas sea un array válido
            const marcasExistentes = (window.marcas && Array.isArray(window.marcas)) ? window.marcas : [];

            let esMasivo = $("#gestionar-marcas-check-varias").is(':checked');
            let idEdicion = typeof window.id_marca_edicion !== 'undefined' ? window.id_marca_edicion : null;

            // --- MODO: EDICIÓN DE 1 MARCA ---
            if (idEdicion) {
                const nombre_marca = $("#marca-input-nombre-unico").val().trim().toUpperCase();

                if (!nombre_marca) {
                    return MostrarAlerta('Ingresa el nombre de la marca', 250, true);
                }

                // Validar si ya existe en window.marcas (excluyendo a la propia marca que estamos editando)
                const duplicada = marcasExistentes.some(m => {
                    let mId = Number(m.id || m.ID);
                    let mNombre = (m.nombre || m.Nombre || '').trim().toUpperCase();
                    return mNombre === nombre_marca && mId !== Number(idEdicion);
                });

                if (duplicada) {
                    return MostrarAlerta('La marca ingresada ya se encuentra registrada en el sistema.', 250, true);
                }

                const datosGuardar = {
                    tipo: 'editar',
                    id: idEdicion,
                    nombre: nombre_marca
                };

                console.log("Editando 1 marca:", datosGuardar);
                Guardar_Gestion_Marcas(datosGuardar);
                return;
            }

            if (!esMasivo) {
                // --- MODO: ÚNICA MARCA (CREACIÓN) ---
                const nombre_marca = $("#marca-input-nombre-unico").val().trim().toUpperCase();

                if (!nombre_marca) {
                    return MostrarAlerta('Ingresa el nombre de la marca', 250, true);
                }

                // Validar si ya existe en window.marcas
                const duplicada = marcasExistentes.some(m => {
                    let mNombre = (m.nombre || m.Nombre || '').trim().toUpperCase();
                    return mNombre === nombre_marca;
                });

                if (duplicada) {
                    return MostrarAlerta('La marca ingresada ya se encuentra registrada en el sistema.', 250, true);
                }

                const datosGuardar = {
                    tipo: 'unica',
                    nombre: nombre_marca
                };

                console.log("Guardando 1 marca:", datosGuardar);
                Guardar_Gestion_Marcas(datosGuardar);

            } else {
                // --- MODO: VARIAS MARCAS (MASIVO) ---
                const listaMarcasMasivas = [];
                let hayErrores = false;
                let mensajeErrorMasivo = "";

                // Set temporal para detectar duplicados dentro del mismo formulario masivo actual
                const nombresEnLote = new Set();

                // Recorremos cada tarjeta dentro de la lista
                $contenedor.find('.tarjeta-marca-item').each(function () {
                    const $tarjeta = $(this);
                    const $inputNombre = $tarjeta.find('input[name="nombre"]');

                    const nombre = $inputNombre.val().trim().toUpperCase();

                    if (!nombre) {
                        hayErrores = true;
                        mensajeErrorMasivo = "Hay tarjetas de marca con el nombre vacío.";
                        $inputNombre.focus();
                        return false; // Rompe el each
                    }

                    // Validar si está duplicada dentro del mismo lote que el usuario está escribiendo
                    if (nombresEnLote.has(nombre)) {
                        hayErrores = true;
                        mensajeErrorMasivo = `La marca '${nombre}' está repetida en el listado masivo.`;
                        $inputNombre.focus();
                        return false;
                    }
                    nombresEnLote.add(nombre);

                    // Validar si ya existe previamente en window.marcas
                    const yaRegistrada = marcasExistentes.some(m => {
                        let mNombre = (m.nombre || m.Nombre || '').trim().toUpperCase();
                        return mNombre === nombre;
                    });

                    if (yaRegistrada) {
                        hayErrores = true;
                        mensajeErrorMasivo = `La marca '${nombre}' ya se encuentra registrada en el sistema.`;
                        $inputNombre.focus();
                        return false;
                    }

                    listaMarcasMasivas.push({
                        nombre: nombre
                    });
                });

                if (hayErrores) {
                    return MostrarAlerta(mensajeErrorMasivo, 250, true);
                }

                if (listaMarcasMasivas.length === 0) {
                    return MostrarAlerta("No hay marcas para guardar.", 250, true);
                }

                const datosGuardar = {
                    tipo: 'masivo',
                    total: listaMarcasMasivas.length,
                    marcas: listaMarcasMasivas
                };

                console.log("Guardando múltiples marcas:", datosGuardar);
                Guardar_Gestion_Marcas(datosGuardar);
            }
        });
    }

    if (window.marcas) {
        InicilizarGestionarMarcas();
    }

    // Escucha alternativa si los datos cargan de manera asíncrona externa
    $(document).off('datosListos.gestionMarcas').on('datosListos.gestionMarcas', function () {
        InicilizarGestionarMarcas();
    });
});

function AgregarNuevaTarjetaMarca() {
    // Incrementamos ambos contadores por variable
    window.numero_marcas += 1;
    window.total_marcas_activas += 1;

    const indiceActual = window.numero_marcas;

    let htmlTarjeta = `
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 tarjeta-marca-item shrink-0">
            <div class="w-p-100 text-blue-03618d fw-600 p-2 box-sizing bg-blue-03618d card-header cursor-pointer flex col-gap-1 items-center">
                <div class="flex justify-center items-center">
                   <input type="checkbox" name="marca_seleccionada[]" data-id="${indiceActual}" class="checkbox-round check-item" value="${indiceActual}">
                </div>
                <div class="flex-1 flex justify-start items-center px-2"><span>Marca ${indiceActual}</span></div>
                <div class="flex justify-center items-center">
                    <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40 boton-eliminar-tarjeta-marca" title="Eliminar tarjeta">
                        <i class="icon vf-ic_fluent_delete_24_filled fs-6"></i>
                    </a>
                </div>
            </div>
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label class="block mb-1 fs-3 fw-600 pl-2">Nombre de la marca</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="nombre" class="w-p-100 h-40 input-mayus px-3 border-light rounded-sm" placeholder="Nombre" autocomplete="off">
                        </div>
                        <!-- Span dinámico para el mensaje de error debajo del input -->
                        <span class="error-marca-msg fs-2 text-danger mt-1 pl-2 fw-600" style="display: none;"></span>
                    </div>
                </div>
            </div>
        </div>
    `;

    let $contenedor = $("#contenedor-lista-marcas");

    // Inyectamos la tarjeta
    $contenedor.append(htmlTarjeta);

    // Actualizamos el texto del contador masivo directamente con la variable
    const totalActual = window.total_marcas_activas;
    $("#contador-marcas-masivas").text(`${totalActual} marca${totalActual !== 1 ? 's' : ''}`);

    MarcasSelectionController.limpiar()
    // Desplazamos el scroll suavemente hasta el final
    $contenedor.stop().animate({
        scrollTop: $contenedor[0].scrollHeight
    }, 300);
}

function ValidarInputDuplicadoEnVivo($input) {
    const normalizar = (str) => str ? str.trim().toUpperCase() : '';
    const valorActual = normalizar($input.val());

    // Buscamos el span de error asociado (puede estar en la misma tarjeta o ser el único)
    const $spanError = $input.closest('.row-gap-0').find('.error-marca-msg');

    if (!valorActual) {
        $input.removeClass('border-error');
        $spanError.text('').hide();
        return true;
    }

    const marcasRegistradas = window.marcas || [];
    let idEdicion = typeof window.id_marca_edicion !== 'undefined' ? window.id_marca_edicion : null;
    let esMasivo = $("#gestionar-marcas-check-varias").is(':checked');

    let estaDuplicado = false;

    // 1. Revisar si ya existe en la base de datos (window.marcas)
    const existeEnBD = marcasRegistradas.some(m => {
        const nombreDB = normalizar(m.nombre || m.Nombre);
        const idDB = m.id || m.ID;

        if (idEdicion && Number(idDB) === Number(idEdicion)) {
            return false;
        }
        return nombreDB === valorActual;
    });

    if (existeEnBD) {
        estaDuplicado = true;
    }

    // 2. Si estamos en modo masivo, revisar si se repite en otro input de las tarjetas
    if (esMasivo && !estaDuplicado) {
        const $contenedor = $("#contenedor-lista-marcas");
        $contenedor.find('.tarjeta-marca-item').each(function () {
            const $otroInput = $(this).find('input[name="nombre"]');

            if ($otroInput[0] === $input[0]) return true;

            if (normalizar($otroInput.val()) === valorActual) {
                estaDuplicado = true;
                return false;
            }
        });
    }

    if (estaDuplicado) {
        $input.addClass('border-error');
        $spanError.text('Esta marca ya está registrada').show();
        return false;
    } else {
        $input.removeClass('border-error');
        $spanError.text('').hide();
        return true;
    }
}