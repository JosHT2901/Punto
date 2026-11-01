window.botonesToolbarConfig = [{
    text: 'Nuevo',
    class: 'btn btn-primary fw-600 flex',
    id: 'biblioteca-boton-nuevo',
    icon: 'vf-ic_fluent_add_24_filled',
    onClick: (e, $btn) => {
        Carga_Archivo(e)
    }
}
];

window.filtrosConfiguracionBiblioteca = [
    {
        id: 'f-tipo-archivo',
        texto: 'Tipo de Archivo',
        opciones: [
            {
                id: 'pdf',
                texto: 'PDF'
            },
            {
                id: 'imagen',
                texto: 'Imagen (PNG, JPG)'
            },
            {
                id: 'otro',
                texto: 'Otros formatos'
            }
        ],
        config: {
            multiple: true,
            buscador: false
        }
    },
    {
        id: 'f-fecha-modificacion',
        texto: 'Modificado',
        opciones: [
            {
                id: 'hoy',
                texto: 'Hoy'
            },
            {
                id: 'ayer',
                texto: 'Ayer'
            },
            {
                id: 'ultimos_7_dias',
                texto: 'Últimos 7 días'
            },
            {
                id: 'ultimos_30_dias',
                texto: 'Últimos 30 días'
            },
            {
                id: 'antiguos',
                texto: 'Más antiguos'
            }
        ],
        config: {
            multiple: false,
            buscador: false
        }
    }
];

window.opcionesDocumentoBiblioteca = [
    {
        texto: 'Ver documento',
        icono: 'vf-ic_fluent_eye_24_filled text-brand-blue',
        permiso: 'ver_biblioteca',
        callback: (archivo) => {
            Actulizar_Apertura_Documento(archivo)
            .then(response => {
                if (response && response.ok) {
                    if (typeof FileViewer !== 'undefined') {
                        FileViewer.open(archivo, archivosGlobales);
                    }
                } else {
                    console.warn("No se pudo registrar la apertura del documento en servidor.");
                    MostrarAlerta('No se puede abrir el documento',230,false)
                }
            })
            .catch(err => {
                console.error("Error al registrar apertura:", err);
                MostrarAlerta('No se puede abrir el documento',230,false)
            });
        }
    },
    {
        texto: 'Información del documento',
        icono: 'vf-ic_fluent_info_24_filled text-brand-blue', // Icono de información / detalles
        permiso: 'ver_biblioteca',
        callback: (archivo) => {
            MostrarInformacionDocumento(archivo)
        }
    },
    {
        texto: 'Crear copia',
        icono: 'vf-ic_fluent_copy_24_filled text-brand-blue',
        permiso: 'gestionar_biblioteca',
        callback: (archivo) => {
            console.log(archivo)
            Duplicar_Archivo_Biblioteca(archivo);
        }
    },
    {
        texto: 'Cambiar nombre',
        icono: 'vf-ic_fluent_edit_24_filled text-brand-blue',
        permiso: 'gestionar_biblioteca',
        callback: (archivo) => {
            Cambiar_Nombre_Archivo(archivo)
        }
    },
    {
        texto: 'Asignar a usuarios',
        icono: 'vf-ic_fluent_person_available_24_filled text-brand-blue',
        permiso: 'asignar_usuarios_biblioteca',
        callback: (archivo) => {
            Asignar_Archivo_Usuarios(archivo)
        }
    },
    {
        texto: 'Descargar',
        icono: 'vf-ic_fluent_arrow_download_24_filled text-brand-blue',
        permiso: 'gestionar_biblioteca',
        callback: (archivo) => {
            const link = document.createElement('a');
            link.href = archivo.ruta || archivo.blob || archivo.url;
            link.download = archivo.nombre_original || archivo.name || 'documento';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    },
    {
        texto: 'Eliminar archivo',
        icono: 'vf-ic_fluent_delete_24_filled text-danger',
        permiso: 'gestionar_biblioteca',
        callback: (archivo) => {
            Eliminar_Archivo(archivo)
        }
    }
];