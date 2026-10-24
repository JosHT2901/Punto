$(document).ready(async function () {
    try {
        await esperarDatosIniciales;
        MostrarCargando('Obteniendo información...', false);

        const [localidadesData, regimenesData, listaClientes,informacion] = await Promise.all([
            CargarJSON('../../../src/json/data/localidades.json'),
            CargarJSON('../../../src/json/data/regimenes.json'),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/clientes.php', {
                accion: 'obtener_clientes'
            }),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/clientes.php', {
                accion: 'obtener_informacion_cliente',
                id:id_cliente
            })
        ]);

        // Guardamos de forma segura asignando respaldos (arrays vacíos) por si algún recurso falla
        window.localidades = localidadesData || [];
        window.regimenes = regimenesData || [];
        window.clientes = (listaClientes && Array.isArray(listaClientes.data)) ? listaClientes.data : [];
        window.informacion=informacion.data
        console.log(window.informacion)
        OcultarCargando();
        $(document).trigger('datosListos');

    } catch (error) {
        console.error("Error crítico al inicializar los datos:", error);

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar la información inicial.', false, false, false);
        }
    } 
});

async function Guardar_Edicion_Cliente(payload)
{
    try {
        MostrarCargando('Procesando información...', false); 

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/clientes.php', {
            accion: 'gestionar_cliente',
            data: payload
        });

        OcultarCargando();

        if (respuesta.ok) {
            MostrarMensaje(respuesta.mensaje || 'Información guardada correctamente.', true, false,false);
            setTimeout(() => {
                $.messenger.send(
                    window.parent,                // Ventana padre
                    'cliente_editado',         // Nombre de la acción
                    { status: 'success', mensaje: 'Proceso completado', accion: window.accion },
                    '*'
                );
            }, 1000);
         
        } else {
            MostrarMensaje(respuesta.mensaje || 'No se pudo completar la operación.', false, false, false);
        }

    } catch (error) {
        OcultarCargando();
        console.error("Error al guardar la información del usuario:", error.mensaje || error);
        MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, false, false);
    }
}