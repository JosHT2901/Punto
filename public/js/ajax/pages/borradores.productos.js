$(document).ready(function (e) {
    ObtenerBorradores();
});

async function ObtenerBorradores() {
    try {
        MostrarCargando('Cargando borradores...', false);

        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/productos.php', {
            accion: 'obtener_borradores'
        });

        OcultarCargando();

        if (respuesta && respuesta.ok) {
            window.borradores = respuesta.data;
        } 
        $(document).trigger('datosListos.gestionBorradores');
        
    } catch (error) {
        OcultarCargando();
        console.error("Error al obtener borradores:", error);
        MostrarMensaje('Ocurrió un error al conectar con el servidor.', false, false, false);
    }
}

async function Eliminar_Borrador(id_borrador) {
    try {
        MostrarCargando('Eliminando borrador...', false);

        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/productos.php', {
            accion: 'eliminar_borrador',
            borrador_id: id_borrador
        });

        OcultarCargando();

        if (respuesta && respuesta.ok) {
                window.borradores = window.borradores.filter(b => b.id != id_borrador);
                MostrarMensaje('Borrador eliminado exitosamente',true,false,false);
                setTimeout(() => {
                    ModalAPI.cerrar()
                    InicializarListaBorradores()
                }, 1000);
        } else {
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'No se pudo eliminar el borrador.';
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeError, false, false, false);
            }
        }
    } catch (error) {
        OcultarCargando();
        console.error("Error al eliminar borrador:", error);
        MostrarMensaje('Ocurrió un error al conectar con el servidor.', false, false, false);
    }
}

async function Eliminar_Borradores_Masivo(seleccion) {
    try {
        // Validar que exista selección previa
        if (!seleccion || seleccion.length === 0) {
            MostrarMensaje('No se seleccionaron borradores para eliminar.', false, false, false);
            return;
        }

        MostrarCargando('Eliminando borradores seleccionados...', false);

        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/productos.php', {
            accion: 'eliminar_borradores_masivo',
            ids: seleccion
        });

        OcultarCargando();

        if (respuesta && respuesta.ok) {
            console.log(respuesta);

            // Extraer y mapear de forma segura los IDs numéricos desde los objetos procesados
            const procesadosRaw = (respuesta.data && respuesta.data.results && respuesta.data.results.processed) 
                ? respuesta.data.results.processed 
                : [];

            const idsProcesados = procesadosRaw.map(item => {
                return (typeof item === 'object' && item !== null) ? parseInt(item.id, 10) : parseInt(item, 10);
            });

            // Filtrar la lista local eliminando los IDs procesados con éxito
            if (window.borradores && Array.isArray(window.borradores)) {
                window.borradores = window.borradores.filter(b => !idsProcesados.includes(parseInt(b.id, 10)));
            }

            const mensajeExito = respuesta.mensaje || 'Proceso de eliminación masiva completado.';
            MostrarMensaje(mensajeExito, true, false, false);

            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
                console.log(window.borradores);
                 InicializarListaBorradores();

                // Abrir la ventana modal de Iframe con el reporte detallado del proceso
                CrearVentanaIframe(
                    'Información del proceso',
                    '../components/informacion.php',
                    '620px',
                    true,
                    true,
                    function (iframeElement) {
                        // Enviamos la respuesta completa al iframe para renderizar stats y resultados
                        $.messenger.send(iframeElement, 'informacion', respuesta);
                    }
                );
            }, 1000);

        } else {
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'No se pudieron eliminar los borradores.';
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeError, false, false, false);
            }
        }
    } catch (error) {
        OcultarCargando();
        console.error("Error al eliminar borradores masivos:", error);
        MostrarMensaje('Ocurrió un error al conectar con el servidor.', false, false, false);
    }
}