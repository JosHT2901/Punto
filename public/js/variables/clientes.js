// 1. JSON unificado con los filtros principales y sus opciones internas
window.filtrosConfiguracionClientes = [{
        id: 'f-rfc',
        texto: 'R.F.C.',
        opciones: [{
                id: 'generico',
                texto: 'RFC Genérico'
            },
            {
                id: 'especifico',
                texto: 'RFC Específico'
            }
        ],
        config: {
            multiple: false,
            buscador: false
        }
    },
    {
        id: 'f-regimen',
        texto: 'Régimen fiscal',
        opciones: [], // Se llenará dinámicamente con los 23 regímenes del JSON
        config: {
            multiple: true,
            buscador: true
        }
    },
    {
        id: 'f-estado',
        texto: 'Estado',
        opciones: [{
                id: 'activo',
                texto: 'Activos'
            },
            {
                id: 'inactivo',
                texto: 'Inactivos'
            }
        ],
        config: {
            multiple: false,
            buscador: false
        }
    }
];
/* =============================================
    CONTROLADOR DEL MÓDULO CLIENTES
============================================= */
window.carga_inicial = true;
window.ClientesSelectionController = window.ClientesSelectionController || CrearSeleccionController('Clientes');
// 1. Definimos el array de botones en una variable
window.botonesToolbarConfig = [{
        text: 'Nuevo cliente',
        class: 'btn btn-primary fw-600 flex',
        id: 'cliente-boton-nuevo',
        icon: 'vf-ic_fluent_add_24_filled',
        onClick: (e, $btn) => {
            CrearVentanaIframe(
                'Nuevo cliente',
                '../components/crear.cliente.php',
                '600px',
                true,
                true
            );
        }
    },
    {
        text: 'Importar',
        class: 'btn btn-secondary fw-600 flex',
        id: 'btn-finalizar',
        icon: 'vf-ic_fluent_arrow_import_24_filled',
        onClick: (e, $btn) => {
            CrearVentanaIframe(
                'Importar clientes',
                '../components/carga.archivo.php',
                '600px',
                true,
                true,
                function (iframeElement) {
                    // Empaquetamos los datos con la propiedad 'localidades'
                    let datos = {
                        multiple: false,
                        mostrar_plantilla: true,
                        url_plantilla:'/../../../../public/docs/Clientes.xlsx',
                        tipo_archivos: '.xlsx,.xls,.csv',
                        nombre_plantilla:'plantilla_clientes.xlsx'
                    };

                    // Enviamos al iframe recién creado usando la acción 'codigo_postal'
                    $.messenger.send(iframeElement, 'datos_iniciales', datos);

                    $.messenger.on('Archivos_cargados', function (data, sourceWindow, origin) {
                        ModalAPI.cerrar()
                        MostrarCargando('Procesando...', false)
                        Procesar_Archivo_Importar_Clientes(data.data)
                    })
                }
            );
        }
    }
];

window.filtrosAdicionales = {
    buscar: '',
    tipo_cliente: '',
    habilitado: 1
};

window.opcionesClienteHabilitado = [{
        texto: 'Información básica',
        icono: 'vf-ic_fluent_person_edit_24_filled text-brand-blue', // Icono específico de persona/edición
        permiso: 'editar_clientes',
        callback: (id) => EditarCliente(id, 'basica')
    },
    {
        texto: 'Información fiscal',
        icono: 'vf-ic_fluent_person_money_24_filled text-brand-blue', // Icono de documento/factura
        permiso: 'editar_clientes',
        callback: (id) => EditarCliente(id, 'fiscal')
    },
    {
        texto: 'Editar contacto',
        icono: 'vf-ic_fluent_call_24_filled text-brand-blue', // Icono de llamada/contacto
        permiso: 'editar_clientes',
        callback: (id) => EditarCliente(id, 'contacto')
    },
    {
        texto: 'Ver Historial',
        icono: 'vf-ic_fluent_history_24_regular text-slate-600',
        permiso: 'ver_historial_clientes',
        callback: (id) => VerHistorialCliente(id)
    },
    {
        texto: 'Eliminar Cliente',
        icono: 'vf-ic_fluent_delete_24_filled text-danger',
        permiso: 'eliminar_clientes',
        callback: (id) => EliminarClientes(id)
    }
];

window.opcionesClienteDeshabilitado = [{
    texto: 'Habilitar cliente',
    icono: 'vf-ic_fluent_checkmark_circle_24_filled text-success',
    permiso: 'editar_clientes',
    callback: (id) => HabilitarClientes(id)
}];

window.ordenClientes = window.ordenClientes || {
    columna: 'ID',
    direccion: 'DESC'
};

window.opcionesMenuOrdenar = [{
        id: 'recientes',
        texto: 'Más recientes primero',
        icono: 'fa-solid fa-arrow-down-1-9',
        callback: (id, elemento) => {
            window.ordenClientes = {
                columna: 'ID',
                direccion: 'DESC'
            };
            window.pagina = 1; // Volvemos a la primera página
            CargarClientes();
        }
    },
    {
        id: 'antiguos',
        texto: 'Más antiguos primero',
        icono: 'fa-solid fa-arrow-up-9-1',
        callback: (id, elemento) => {
            window.ordenClientes = {
                columna: 'ID',
                direccion: 'ASC'
            };
            window.pagina = 1;
            CargarClientes();
        }
    },
    {
        id: 'nombre_asc',
        texto: 'Nombre (A - Z)',
        icono: 'fa-solid fa-arrow-down-a-z',
        callback: (id, elemento) => {
            window.ordenClientes = {
                columna: 'Nombre',
                direccion: 'ASC'
            };
            window.pagina = 1;
            CargarClientes();
        }
    },
    {
        id: 'nombre_desc',
        texto: 'Nombre (Z - A)',
        icono: 'fa-solid fa-arrow-up-z-a',
        callback: (id, elemento) => {
            window.ordenClientes = {
                columna: 'Nombre',
                direccion: 'DESC'
            };
            window.pagina = 1;
            CargarClientes();
        }
    }
];

window.botones_opciones_habilitado=[
    {
        id: 'btn-eliminar-masivo',
        icon: 'vf-ic_fluent_delete_24_filled',
        title: 'Eliminar seleccionados',
        permiso:'eliminar_clientes',
        onclick: 'EliminarClientesMasivos()'
    },
    {
        id: 'btn-exportar-masivo',
        icon: 'vf-ic_fluent_arrow_export_24_filled',
        title: 'Exportar seleccionados',
        onclick: 'ExportarClientesMasivos()'
    }
]

window.botones_opciones_deshabilitado=[
    {
        id: 'btn-habilitar-masivo',
        icon: 'vf-ic_fluent_arrow_clockwise_24_filled',
        title: 'Habiltar seleccionados',
        permiso:'editar_clientes',
        onclick: 'HabilitarClientesMasivos()'
    }
]