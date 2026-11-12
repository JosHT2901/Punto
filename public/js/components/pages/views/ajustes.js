$("#card-smtp").off('click').on('click',function(e)
{
    CrearVentanaIframe(
        'Editar SMTP',
        '../components/configurar.smtp.php',
        '620px',
        true,
        true
    );
})
$("#card-imap").off('click').on('click',function(e)
{
    CrearVentanaIframe(
        'Editar IMAP',
        '../components/configurar.imap.php',
        '620px',
        true,
        true
    );
})

$("#card-exportar-sql").off('click').on('click', async function(e) {
    AbrirModalAutenticacion(false, async function(datosAuth) {
    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Obteniendo archivo...', false);
    }

    AjaxService.descargarArchivo(
        '../../../src/controllers/php/controllers/ajustes.php', // Ruta de tu controlador PHP
        { accion: 'descargar_sql' }, // Acción correcta que procesa Descargar_Backup_Dinamico_SQL
        false,                          // esFormData
        'respaldo_sistema.sql',         // Nombre predeterminado
        false                           // ejecutarClick en false para capturar el blob en el .then
    )
    .then(async respuesta => {
        // Ocultar modal de carga si existe la función
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (respuesta && respuesta.ok) {
            // Mostramos la pregunta de confirmación utilizando await correctamente
            const confirma = await MostrarPregunta({
                titulo: 'Descargar respaldo',
                texto: 'El archivo SQL está listo para descargarse. ¿Desea continuar?',
                icono: 'fa-solid fa-download text-gray-500',
                confirmarText: 'Descargar',
                colorConfirmar: 'btn-primary',
                altura: 350
            });

            // Si el usuario confirma, ejecutamos el disparo manual de la descarga con el blob recibido
            if (confirma) {
                const urlBlob = window.URL.createObjectURL(respuesta.blob);
                const link = document.createElement("a");
                link.href = urlBlob;
                link.download = respuesta.nombre || `backup_${Date.now()}.sql`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    window.URL.revokeObjectURL(urlBlob);
                    document.body.removeChild(link);
                }, 200);
            }
        } else {
            // Si el servidor respondió pero con ok: false
            const mensajeError = respuesta?.mensaje || 'No se pudo generar el archivo de respaldo.';
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(mensajeError, 320, false);
            } else {
                alert(mensajeError);
            }
        }
    })
    .catch(error => {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        
        console.error("Error al descargar respaldo:", error);
        let mensajeError = error.mensaje || "Ocurrió un error al generar el respaldo.";
        
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta(mensajeError, 320, false);
        } else {
            alert(mensajeError);
        }
    });
})
});
$("#card-importar-sql").off('click').on('click', async function (e) {
    AbrirModalAutenticacion(false, async function(datosAuth) {
    const confirmado = await MostrarPregunta({
        titulo: 'Restaurar Base de Datos',
        texto: '¿Estás seguro de que deseas restaurar la base de datos? Se sobrescribirá la información actual con el respaldo seleccionado.',
        icono: 'fa-solid fa-database',
        confirmarText: 'Sí, restaurar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 380
    });

    if (!confirmado) {
        return false;
    }
   
    CrearVentanaIframe(
        'Restaurar Respaldo SQL',
        '../components/carga.archivo.php',
        '600px',
        true,
        true,
        function (iframeElement) {
            let datos = {
                multiple: false,
                mostrar_plantilla: false,
                tipo_archivos: '.sql',
            };

            $.messenger.send(iframeElement, 'datos_iniciales', datos);

            $.messenger.on('Archivos_cargados', function (data, sourceWindow, origin) {
                ModalAPI.cerrar();
                MostrarCargando('Restaurando base de datos...', false);

                // Función que envía el archivo SQL mediante FormData al controlador PHP
                Procesar_Archivo_Importar_SQL(data.data);
            });
        }
    );
})
});

// Función auxiliar para enviar el archivo al controlador de ajustes / base de datos
function Procesar_Archivo_Importar_SQL(archivos) {
    let formData = new FormData();
    formData.append('accion', 'importar_backup'); // Acción que recibe tu switch en PHP

    if (Array.isArray(archivos) && archivos.length > 0) {
        formData.append('archivos[0]', archivos[0]);
    } else if (archivos instanceof File) {
        formData.append('archivos[0]', archivos);
    } else {
        if (typeof OcultarCargando === 'function') OcultarCargando();
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('No se pudo adjuntar el archivo SQL correctamente.', 320, false);
        }
        return;
    }

    AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', formData, true)
        .then(response => {
            if (typeof OcultarCargando === 'function') OcultarCargando();

            if (response && response.ok) {
                if (typeof MostrarNotificacion === 'function') {
                    MostrarNotificacion(response.mensaje || 'Base de datos restaurada correctamente.', 'success');
                } else {
                    alert(response.mensaje || 'Restauración exitosa.');
                }
                setTimeout(() => location.reload(), 1500); // Recargar para aplicar cambios estructurales
            } else {
                const mensajeError = response?.mensaje || 'Error al restaurar la base de datos.';
                if (typeof MostrarAlerta === 'function') {
                    MostrarAlerta(mensajeError, 320, false);
                } else {
                    alert(mensajeError);
                }
            }
        })
        .catch(error => {
            if (typeof OcultarCargando === 'function') OcultarCargando();

            console.error("Error en restauración SQL:", error);
            let mensajeError = error.mensaje || "Ocurrió un error inesperado al procesar la restauración.";
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(mensajeError, 320, false);
            } else {
                alert(mensajeError);
            }
        });
}
async function Procesar_Archivo_Importar_SQL(archivoSeleccionado) {
    try {
        console.log(archivoSeleccionado);
        const respuesta = await FileUploadService.subir(
            '../../../src/controllers/php/controllers/ajustes.php', // URL del endpoint
            archivoSeleccionado,
            'importar_sql', // La acción que leerá tu PHP en el despachador
            {},                  // Parámetros extra (objeto vacío si no requieres extras)
            'procesando archivo...' // Texto personalizado para el modal de carga en minúsculas
        );

        OcultarCargando()
        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje, true, false, false);
            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
                    CrearVentanaIframe(
                        'información del proceso',
                        '../components/informacion.php',
                        '620px',
                        true,
                        true,
                        function (iframeElement) {
                            $.messenger.send(iframeElement, 'informacion', respuesta);
                        }
                    );  
               
            }, 1000);
        } else {
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'no se pudo procesar la importación del archivo.';
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeError, false, false, false);
            }
        }
    } catch (error) {
        console.error("fallo en la subida:", error);
        MostrarAlerta(error.mensaje || 'error al procesar el archivo', 280, true);
    }
}