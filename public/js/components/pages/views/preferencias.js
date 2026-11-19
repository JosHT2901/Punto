// ================== CATÁLOGOS ==================
const formatosFecha = [
    { value: 'd/m/Y',  text: 'DD/MM/YYYY' },
    { value: 'Y-m-d',  text: 'YYYY-MM-DD' },
    { value: 'm/d/Y',  text: 'MM/DD/YYYY' },
    { value: 'd-m-Y',  text: 'DD-MM-YYYY' },
    { value: 'j M, Y', text: '12 Abr, 2026' }
];

const formatosHora = [
    { value: 'g:i a',   text: '12 Horas (Ej: 03:45 pm)' },
    { value: 'h:i:s A', text: '12 Horas con segundos (Ej: 03:45:10 PM)' },
    { value: 'H:i',     text: '24 Horas (Ej: 15:45)' },
    { value: 'H:i:s',   text: '24 Horas con segundos (Ej: 15:45:30)' }
];

const opcionesPaginacion = [
    { value: '10',  text: '10 registros' },
    { value: '25',  text: '25 registros' },
    { value: '50',  text: '50 registros' },
    { value: '100', text: '100 registros' }
];

const INACTIVIDAD_DEFECTO = 5;
const INACTIVIDAD_MIN = 5;
const INACTIVIDAD_MAX = 240;

// ================== HELPERS ==================
// Quita el select anterior (si existe) y lo vuelve a crear con el valor actual.
// Sin esto, InsertarCustomSelect sale sin hacer nada cuando el id ya existe
// y el select se queda con el valor viejo.
function renderSelectPreferencia({ contenedor, id, placeholder, opciones, valor, onChange }) {
    if (!$(contenedor).length) return;
    $('#' + id).remove();

    InsertarCustomSelect({
        contenedor,
        id,
        placeholder,
        buscador: false,
        onChange,
        opciones: opciones.map(op => ({
            value: op.value,
            text: op.text,
            selected: valor !== null && valor !== undefined && String(op.value) === String(valor)
        }))
    });
}

const esValorValido = (catalogo, valor) =>
    catalogo.some(op => String(op.value) === String(valor));

// ================== CARGA DE PREFERENCIAS ==================
$(document).off('datosListos.preferencias').on('datosListos.preferencias', () => {
    try {
        const preferencias = window.PreferenciasUsuario || {};

        // "sucursales" sin window. lanza ReferenceError si no está declarada
        const listaSucursales = window.ListaSucursales || window.sucursales || [];

        const sucursalDefaultId     = preferencias.sucursal_default_id ?? null;
        const sucursalComportamiento = preferencias.sucursal_comportamiento || 'sesion';
        const inactividadMin        = preferencias.seguridad_inactividad_min ?? INACTIVIDAD_DEFECTO;
        const dosPasosActivo        = [1, '1', true].includes(preferencias.seguridad_2fa);

        const formatoFechaGuardado  = preferencias.formato_fecha || 'd/m/Y';
        const formatoHoraGuardado   = preferencias.reloj_formato || 'g:i a';
        const paginacionGuardada    = String(preferencias.paginacion_tabla || '25');

        // 1. Sucursal
        renderSelectPreferencia({
            contenedor: '#contenedor-select-sucursal',
            id: 'select-sucursal',
            placeholder: 'Selecciona la sucursal predeterminada',
            opciones: listaSucursales.map(item => ({
                value: item.ID ?? item.id,
                text: item.nombre
            })),
            valor: sucursalDefaultId
        });

        // 2. Formato de fecha
        renderSelectPreferencia({
            contenedor: '#contenedor-select-formato-fecha',
            id: 'select-formato-fecha',
            placeholder: 'Selecciona un formato de fecha',
            opciones: formatosFecha,
            valor: formatoFechaGuardado
        });

        // 3. Formato de hora
        renderSelectPreferencia({
            contenedor: '#contenedor-select-formato-hora',
            id: 'select-formato-hora',
            placeholder: 'Selecciona un formato de hora',
            opciones: formatosHora,
            valor: formatoHoraGuardado
        });

        // 4. Paginación
        renderSelectPreferencia({
            contenedor: '#contenedor-select-paginacion',
            id: 'select-paginacion-tabla',
            placeholder: 'Selecciona la paginación',
            opciones: opcionesPaginacion,
            valor: paginacionGuardada
        });

        // 5. Seguridad e inactividad
        $('#input-tiempo-inactividad').val(inactividadMin);
        $('#check-verificacion-dos-pasos').prop('checked', dosPasosActivo);

        InputService.soloNumeros('#input-tiempo-inactividad');
        InputService.maxLength('#input-tiempo-inactividad', 3);

        // 6. Comportamiento al cambiar de sucursal
        $(`input[name="sucursal_comportamiento"][value="${sucursalComportamiento}"]`)
            .prop('checked', true);

    } catch (error) {
        console.error('Error al cargar preferencias:', error);
        MostrarAlerta('No se pudieron cargar las preferencias.', 250, false);
    } finally {
        // El cargando se oculta siempre, aunque algo falle arriba
        if (typeof OcultarCargando === 'function') OcultarCargando();
    }
});

// Quita el borde rojo en cuanto el usuario corrige el campo
$(document).off('input.preferencias', '#input-tiempo-inactividad')
    .on('input.preferencias', '#input-tiempo-inactividad', function () {
        $(this).removeClass('border-danger');
    });

// ================== GUARDAR ==================
$(document).off('click', '#preferencias-boton-guardar')
    .on('click', '#preferencias-boton-guardar', async function (e) {
        e.preventDefault();

        const $boton = $(this);
        if ($boton.prop('disabled')) return; // evita doble clic

        // 1. Recolectar valores
        const sucursalDefaultId       = CustomSelect.getValue('#select-sucursal');
        const comportamientoSucursal  = $('input[name="sucursal_comportamiento"]:checked').val() || 'sesion';
        const verificacionDosPasos    = $('#check-verificacion-dos-pasos').is(':checked') ? 1 : 0;
        const formatoFecha            = CustomSelect.getValue('#select-formato-fecha');
        const formatoHora             = CustomSelect.getValue('#select-formato-hora');
        const paginacionTabla         = CustomSelect.getValue('#select-paginacion-tabla') || '25';

        const $inputInactividad = $('#input-tiempo-inactividad');
        const valorInactividad  = $inputInactividad.val().trim();
        const tiempoInactividad = valorInactividad === '' ? INACTIVIDAD_DEFECTO : parseInt(valorInactividad, 10);

        // 2. Validaciones
        if (!sucursalDefaultId) {
            return MostrarAlerta('Selecciona una sucursal predeterminada', 250, false);
        }

        if (!formatoFecha || !esValorValido(formatosFecha, formatoFecha)) {
            return MostrarAlerta('Selecciona un formato de fecha', 250, false);
        }

        if (!formatoHora || !esValorValido(formatosHora, formatoHora)) {
            return MostrarAlerta('Selecciona un formato de hora', 250, false);
        }

        if (!esValorValido(opcionesPaginacion, paginacionTabla)) {
            return MostrarAlerta('Selecciona una paginación válida', 250, false);
        }

        // 0 = desactivado; si no, entre INACTIVIDAD_MIN y INACTIVIDAD_MAX
        let errorInactividad = '';
        if (isNaN(tiempoInactividad) || tiempoInactividad < 0) {
            errorInactividad = 'El tiempo de inactividad no puede ser negativo.';
        } else if (tiempoInactividad > 0 && tiempoInactividad < INACTIVIDAD_MIN) {
            errorInactividad = `El tiempo mínimo de inactividad es de ${INACTIVIDAD_MIN} minutos (o 0 para desactivar).`;
        } else if (tiempoInactividad > INACTIVIDAD_MAX) {
            errorInactividad = `El tiempo máximo de inactividad permitido es de ${INACTIVIDAD_MAX} minutos.`;
        }

        if (errorInactividad) {
            $inputInactividad.focus().addClass('border-danger');
            return MostrarAlerta(errorInactividad, 250, false);
        }
        $inputInactividad.removeClass('border-danger');

        // 3. Paquete de datos
        const datosPreferencias = {
            sucursal_default_id: Number(sucursalDefaultId),
            sucursal_comportamiento: comportamientoSucursal,
            formato_fecha: formatoFecha,
            reloj_formato: formatoHora,
            paginacion_tabla: String(paginacionTabla),
            seguridad_inactividad_min: tiempoInactividad,
            seguridad_2fa: verificacionDosPasos
        };

        // 4. Guardar
        $boton.prop('disabled', true);
        try {
            if (typeof Guardar_Preferencias === 'function') {
                await Guardar_Preferencias(datosPreferencias);
            } else {
                console.log('Datos listos para guardar:', datosPreferencias);
            }
        } catch (error) {
            console.error('Error al guardar preferencias:', error);
            MostrarAlerta('No se pudieron guardar las preferencias.', 250, false);
        } finally {
            $boton.prop('disabled', false);
        }
    });