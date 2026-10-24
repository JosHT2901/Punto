$(document).ready(async function () {
    try {
        MostrarCargando('Obteniendo información...', false);

        const [localidadesData, regimenesData, listaClientes,numeroCliente] = await Promise.all([
            CargarJSON('../../../src/json/data/localidades.json'),
            CargarJSON('../../../src/json/data/regimenes.json'),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/clientes.php', {
                accion: 'obtener_clientes'
            }),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/clientes.php', {
                accion: 'generar_codigo_cliente'
            })
        ]);

        // Guardamos de forma segura asignando respaldos (arrays vacíos) por si algún recurso falla
        window.localidades = localidadesData || [];
        window.regimenes = regimenesData || [];
        window.clientes = (listaClientes && Array.isArray(listaClientes.data)) ? listaClientes.data : [];
        window.codigo_cliente=numeroCliente.data
        OcultarCargando();
        $(document).trigger('datosListos');

    } catch (error) {
        console.error("Error crítico al inicializar los datos:", error);

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar la información inicial.', false, false, false);
        }
    } 
});

async function Guardar_Gestion_Cliente() {
    try {
        // 1. Recolectar identificadores si estamos en modo edición (ej. input hidden o dataset)
        const idCliente = window.id_cliente;
        const codigoCliente = window.codigo_cliente;

        // 2. Recolectar valores del formulario
        const esRazonSocial = $("#crear-cliente-check-razon-social").is(':checked');
        const nombre = $("#crear-cliente-input-nombre").val().trim();
        const apellidoPaterno = $("#crear-cliente-input-apellido-paterno").val().trim();
        const apellidoMaterno = $("#crear-cliente-input-apellido-materno").val().trim();
        
        const rfc = $("#crear-cliente-input-rfc").val().trim().toUpperCase();
        const regimen = CustomSelect.getValue("#select-regimen");
        const codigoPostal = $("#crear-cliente-input-codigo-postal").data('id');
        
        const selectorTel = "#crear-cliente-input-telefono";
        const telefono = TelefonosUI.getValor(selectorTel);
        const correo = $("#crear-cliente-input-correo").val().trim();

        // 3. Validar Código de Cliente (Debe ser numérico)
        if (!codigoCliente) {
            MostrarAlerta('El código de cliente es obligatorio');
            return false;
        }
        if (isNaN(codigoCliente)) {
            MostrarAlerta('El código de cliente debe ser un valor numérico');
            return false;
        }

        // 4. Validar Información Básica
        if (!nombre) {
            MostrarAlerta(esRazonSocial ? 'Ingresa la razón social' : 'Ingresa el nombre');
            return false; // ⛔️ Detiene el proceso
        }

        // Validar apellidos SOLO si es persona física (no es razón social)
        if (!esRazonSocial) {
            if (!apellidoPaterno) {
                MostrarAlerta('Ingresa el apellido paterno');
                return false;
            }
            if (!apellidoMaterno) {
                MostrarAlerta('Ingresa el apellido materno');
                return false;
            }
        }

        // 5. Validar Información Fiscal y de Contacto
        if (!rfc) {
            MostrarAlerta('Ingresa el RFC');
            return false;
        }
        
        if (!TelefonosUI.esValido(selectorTel)) {
            MostrarAlerta("El número de teléfono no es válido para el país seleccionado.");
            return false;
        }

        if (!ValidacionService.validarRFC(rfc)) {
            MostrarAlerta('El RFC debe tener un formato válido');
            return false;
        }

        if (!regimen) {
            MostrarAlerta('Selecciona un régimen fiscal');
            return false;
        }

        if (!codigoPostal) {
            MostrarAlerta('Selecciona o ingresa un código postal');
            return false;
        }

        if (!ValidacionService.validarCorreo(correo)) {
            MostrarAlerta('Ingresa un correo electrónico válido');
            return false;
        }

        // 6. Preparar el objeto de datos (Payload) incluyendo ID y Código para el Backend
        const datosCliente = {
            accion: 'gestionar_cliente',
            id: idCliente ? parseInt(idCliente) : null, // Si trae ID, el PHP hará UPDATE
            codigo_cliente: codigoCliente,             // Código numérico obligatorio
            tipo_persona: esRazonSocial ? 'MORAL' : 'FISICA',
            nombre: nombre,
            apellido_paterno: esRazonSocial ? '' : apellidoPaterno,
            apellido_materno: esRazonSocial ? '' : apellidoMaterno,
            rfc: rfc,
            regimen_fiscal: regimen,
            codigo_postal: codigoPostal,
            telefono: telefono,
            correo: correo
        };

        // 7. Ejecutar petición AJAX de guardado / actualización
        MostrarCargando(idCliente ? 'Actualizando cliente...' : 'Guardando cliente...', false);

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/clientes.php', datosCliente);

        OcultarCargando();

        // Nota: Adaptado a tu clase JsonResponse que devuelve la propiedad 'ok' en lugar de 'success'
        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje || 'Operación realizada exitosamente', true,false,true);
            
            let notificacion=window.accion === 'crear'?'cliente_creado':'cliente_editado'
            $.messenger.send(
                window.parent,                // Ventana padre
                notificacion,         // Nombre de la acción
                { status: 'success', mensaje: 'Proceso completado', accion: window.accion },
                '*'
            );
            return true;
        } else {
            MostrarAlerta(respuesta.mensaje || 'Ocurrió un error al procesar el cliente.');
            return false;
        }

    } catch (error) {
        OcultarCargando();
        console.error("Error crítico al procesar cliente:", error);
        MostrarAlerta('Error de conexión al intentar guardar el cliente.',300);
        return false;
    }
}