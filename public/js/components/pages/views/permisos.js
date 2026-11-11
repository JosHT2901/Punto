window.carga_inicial = true;

// 1. Instancia única del controlador global para toda la vista
window.PermisosSelectionController = window.PermisosSelectionController || CrearSeleccionController('PermisosGlobal');

$(document).ready(function (e) {
    // 1. Obtener los parámetros de la URL actual
    const urlParams = new URLSearchParams(window.location.search);
    const idCifrado = urlParams.get('id');
    console.log(idCifrado)

    if (idCifrado) {
        window.usuarioId = idCifrado;
    }
    if (!usuarioId) {
        console.error("ID de usuario inválido o ausente en la URL.");
        OcultarCargando();
        MostrarMensaje('El enlace no es válido o ha expirado.', false, false, false);
        return;
    }

    // 4. Ejecutar la función pasando el ID descifrado
    Obtener_Permisos();
});


async function Obtener_Permisos() {
    try {
        MostrarCargando('Obteniendo información...', false);


        // Petición AJAX para obtener los permisos
        window.permisos = await Obtener_Permisos_Ajax();
        
        if (!window.permisos || !window.permisos.usuario) {
            throw new Error("No se recibieron datos válidos del servidor.");
        }

        const { modulos, permisos_stats, usuario } = window.permisos;
        console.log("Permisos cargados correctamente:", window.permisos);

        // 1. Rellenar datos del perfil del usuario
        $("#label-nombre-usuario").text(usuario.nombre_completo || '');
        $("#label-name-usuario").text('@' + (usuario.nombre_usuario || ''));
        $("#contador-global-permisos").text(permisos_stats.total_asignados + '/' + permisos_stats.total_general);

        // 2. Renderizar Avatar o Iniciales
        const $contenedorAvatar = $('#contenedor-avatar');
        if ($contenedorAvatar.length) {
            if (usuario.imagen && usuario.imagen.trim() !== "") {
                $contenedorAvatar.html(`
                    <img src="${usuario.imagen}" alt="Avatar de ${usuario.nombre_completo}" class="w-p-100 h-p-100 object-fit-cover">
                `);
            } else {
                const iniciales = ((usuario.nombre ? usuario.nombre.charAt(0) : '') + (usuario.apellido_paterno ? usuario.apellido_paterno.charAt(0) : '')).toUpperCase() || 'US';
                $contenedorAvatar.html(iniciales);
            }
        }

        // 3. Renderizar Módulos y Permisos dinámicamente
        const $contenedorModulos = $('#contenedor-modulos-permisos');
        if ($contenedorModulos.length && modulos) {
            let htmlModulos = '';

            modulos.forEach(mod => {
                let htmlPermisosLista = '';
                const moduloSlug = mod.modulo.toLowerCase().replace(/\s+/g, '_');

                mod.permisos.forEach(perm => {
                    const isChecked = perm.asignado ? 'checked' : '';
                    // Estructura limpia sin onclick en línea para evitar conflictos de propagación
                    htmlPermisosLista += `
                        <div class="flex items-center justify-between btn-ghost p-2 rounded-8 border btn permiso-row gap-2 tarjeta-permiso-item">
                            <label class="flex items-center gap-2 flex-1 cursor-pointer m-0">
                                <div class="w-30">
                                    <input type="checkbox" id="chk_${perm.id}" class="checkbox-round check-item flex-shrink-0" name="permisos[]" value="${perm.id}" data-id="${perm.id}" data-modulo="${moduloSlug}" ${isChecked}>
                                </div>
                                <div class="flex flex-column px-3 gap-1">
                                    <span class="block fw-600 fs-3 text-gray-800">${perm.nombre_permiso}</span>
                                    <span class="block fs-1 text-gray-500 fw-600 word-break-all">${perm.descripcion || 'Sin descripción'}</span>
                                </div>
                            </label>
                        </div>
                    `;
                });

                htmlModulos += `
                    <div class="bg-white border rounded-12 p-3 shadow-sm flex flex-column gap-3 tarjeta-ajustable" id="card_modulo_${moduloSlug}" data-modulo="${moduloSlug}" style="flex: 1 1 340px; min-width: 280px;">
                        <div class="flex items-center justify-between px-2 border-bottom gap-2 pb-2">
                            <div>
                                <input type="checkbox" class="checkbox-round modulo-toggle-master" id="master_${moduloSlug}" data-modulo-target="${moduloSlug}" title="Marcar todo el módulo">
                            </div>
                            <div class="flex-1 px-3">
                                <div class="flex justify-start items-center flex-column gap-1">
                                    <span class="w-p-100 text-left fw-600 text-capitalize">${mod.modulo}</span>
                                    <span class="w-p-100 text-left fw-600 fs-2 text-brand"><span class="contador-asignados">${mod.asignados_modulo}</span> asignados / ${mod.total_modulo} total</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-column gap-2">
                            ${htmlPermisosLista}
                        </div>
                    </div>
                `;
            });

            // Inyectamos las tarjetas en el contenedor
            $contenedorModulos.html(htmlModulos);

            // Inicializar el controlador global único para todo el bloque de permisos
            window.PermisosSelectionController.init({
                scope: document.querySelector('#contenedor-global'),
                checkItemClass: '.check-item',
                checkAllId: '#input-check-password',
                tarjetaClass: '.tarjeta-ajustable',
                claseActiva: 'activo',
                onChange: (seleccionadas, estado, idModificado) => {
                    const totalSeleccionados = seleccionadas.size;
                    const totalGeneral = permisos_stats.total_general;
                    $("#contador-global-permisos").text(totalSeleccionados + '/' + totalGeneral);

                    // Actualizar contadores y estados master de cada módulo en tiempo real de forma aislada
                    modulos.forEach(mod => {
                        const moduloSlug = mod.modulo.toLowerCase().replace(/\s+/g, '_');
                        const card = document.getElementById(`card_modulo_${moduloSlug}`);
                        if (!card) return;

                        const itemsModulo = card.querySelectorAll('.check-item');
                        const totalMod = itemsModulo.length;
                        const marcadosMod = [...itemsModulo].filter(chk => seleccionadas.has(String(chk.dataset.id))).length;

                        // Actualizar contador visual del módulo
                        const $contador = card.querySelector('.contador-asignados');
                        if ($contador) $contador.textContent = marcadosMod;

                        // Actualizar estado del checkbox master del módulo sin alterar eventos
                        const masterChk = card.querySelector('.modulo-toggle-master');
                        if (masterChk) {
                            masterChk.checked = (marcadosMod === totalMod && totalMod > 0);
                            masterChk.indeterminate = (marcadosMod > 0 && marcadosMod < totalMod);
                        }
                    });
                }
            });

            // Manejo eficiente del clic en los checkboxes "master" de cada módulo
            $(document).off('change.masterModulo').on('change.masterModulo', '.modulo-toggle-master', function() {
                const moduloSlug = $(this).data('modulo-target');
                const isChecked = this.checked;
                const card = document.getElementById(`card_modulo_${moduloSlug}`);
                if (!card) return;

                const itemsModulo = card.querySelectorAll('.check-item');
                
                // Obtenemos el Set actual del controlador global extrayéndolo directamente o iterando
                itemsModulo.forEach(chk => {
                    const id = String(chk.dataset.id);
                    if (isChecked) {
                        window.PermisosSelectionController.agregar(id);
                    } else {
                        // Eliminación segura individual simulando un toggle de borrado limpio
                        if (window.PermisosSelectionController.existe(id)) {
                            // Extraemos los IDs actuales, filtramos y reseteamos limpiamente
                            const actual = window.PermisosSelectionController.getSeleccionados().filter(i => i !== id);
                            window.PermisosSelectionController.limpiar();
                            actual.forEach(validId => window.PermisosSelectionController.agregar(validId));
                        }
                    }
                });

                window.PermisosSelectionController.sincronizarDOM();
            });

            // Precargar en el controlador global los permisos que ya venían marcados desde PHP
            modulos.forEach(mod => {
                mod.permisos.forEach(perm => {
                    if (perm.asignado) {
                        window.PermisosSelectionController.agregar(perm.id);
                    }
                });
            });
            window.PermisosSelectionController.sincronizarDOM();
        }

        // Cambiar estado de carga inicial
        if (window.carga_inicial) {
            window.carga_inicial = false;
        }

        // Ocultar Skeleton de carga
        const $skeleton = $("#contenedor-skeleton-carga-permisos");
        if ($skeleton.length) {
            $skeleton.addClass('d-none');
        }

        OcultarCargando();

    } catch (error) {
        console.error("Error al obtener los permisos:", error);
        OcultarCargando();
        MostrarMensaje('Ocurrió un error al cargar los permisos del usuario.', false, false, false);
    }
}

// =============================================
// EVENTO: GUARDAR PERMISOS SELECCIONADOS
// =============================================
$(document).off('click.btnGuardarPermisos').on('click.btnGuardarPermisos', '#btn-guardar', async function(e) {
    e.preventDefault();

    try {
        // 1. Obtener el array de IDs seleccionados desde el controlador global
        const permisosSeleccionados = window.PermisosSelectionController.getSeleccionados();
        
        // 2. Obtener el ID del usuario (el mismo que usaste para consultar, ej. '48')
        // Si tienes el ID guardado en una variable global o campo oculto, úsalo aquí.
        const usuarioIdPlano = '48'; // O el valor dinámico correspondiente si lo tienes en el DOM

        // 3. Preparar y cifrar el payload según tu arquitectura de seguridad
        const payload = {
            usuario_id: window.usuarioId,
            permisos: permisosSeleccionados // Envía el array con los IDs de los permisos activos
        };

        Guardar_Actualizacion_Permisos(payload)

    } catch (error) {
        console.error("Error al guardar los permisos:", error);
        OcultarCargando();
        MostrarMensaje('Ocurrió un error al intentar guardar los permisos.', false, false, false);
    }
});

$("#btn-atras").off('click').on('click',function(e)
{
    window.location.href="usuarios.php"
})