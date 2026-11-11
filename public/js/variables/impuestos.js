window.filtrosConfiguracionImpuestos = [
    {
        id: 'f-iva',
        texto: 'Tasa de IVA',
        opciones: [
            { id: '0.1600', texto: 'IVA 16%' },
            { id: '0.0800', texto: 'IVA 8%' },
            { id: '0.0000', texto: 'IVA 0%' }
        ],
        config: {
            multiple: true,
            buscador: false
        }
    },
    {
        id: 'f-ieps',
        texto: 'Tasa de IEPS',
        opciones: [
            { id: 'con_ieps', texto: 'Con IEPS' },
            { id: 'sin_ieps', texto: 'Sin IEPS (0%)' }
        ],
        config: {
            multiple: false,
            buscador: false
        }
    },
    {
        id: 'f-retenciones',
        texto: 'Retenciones',
        opciones: [
            { id: 'isr', texto: 'Con Retención ISR' },
            { id: 'iva', texto: 'Con Retención IVA' }
        ],
        config: {
            multiple: true,
            buscador: false
        }
    },
    {
        id: 'f-estado',
        texto: 'Estado',
        opciones: [
            { id: 'activo', texto: 'Activos' },
            { id: 'inactivo', texto: 'Inactivos' }
        ],
        config: {
            multiple: false,
            buscador: false
        }
    }
];
window.botonesToolbarConfig = [
    {
        text: 'Nuevo Esquema',
        class: 'btn btn-primary fw-600 flex',
        id: 'impuesto-boton-nuevo',
        icon: 'vf-ic_fluent_add_24_filled',
        onClick: (e, $btn) => {
            CrearVentanaIframe(
                'Nuevo esquema de impuesto',
                '../components/gestionar.esquema.impuesto.php',
                '600px',
                true,
                true
            );
        }
    },
    {
        text: 'Importar',
        class: 'btn btn-secondary fw-600 flex',
        id: 'btn-importar-impuestos',
        icon: 'vf-ic_fluent_arrow_import_24_filled',
        onClick: (e, $btn) => {
            CrearVentanaIframe(
                'Importar esquemas',
                '../components/carga.archivo.php',
                '600px',
                true,
                true,
                function (iframeElement) {
                    let datos = {
                        multiple: false,
                        mostrar_plantilla: true,
                        url_plantilla: '/../../../../public/docs/esquemas_fiscales.xlsx',
                        tipo_archivos: '.xlsx,.xls,.csv',
                        nombre_plantilla:'plantilla_esquemas_fiscales.xlsxs'
                    };

                    $.messenger.send(iframeElement, 'datos_iniciales', datos);

                    $.messenger.on('Archivos_cargados', function (data, sourceWindow, origin) {
                        ModalAPI.cerrar();
                        MostrarCargando('Procesando...', false);
                        Procesar_Archivo_Importar_Impuestos(data.data);
                    });
                }
            );
        }
    }
];

window.ordenImpuestos = window.ordenImpuestos || {
    columna: 'id',
    direccion: 'DESC'
};

window.opcionesMenuOrdenar = [
    {
        id: 'recientes',
        texto: 'Más recientes primero',
        icono: 'fa-solid fa-arrow-down-1-9',
        callback: (id, elemento) => {
            window.ordenImpuestos = {
                columna: 'id',
                direccion: 'DESC'
            };
            window.pagina = 1;
            CargarImpuestos();
        }
    },
    {
        id: 'antiguos',
        texto: 'Más antiguos primero',
        icono: 'fa-solid fa-arrow-up-9-1',
        callback: (id, elemento) => {
            window.ordenImpuestos = {
                columna: 'id',
                direccion: 'ASC'
            };
            window.pagina = 1;
            CargarImpuestos();
        }
    },
    {
        id: 'nombre_asc',
        texto: 'Nombre (A - Z)',
        icono: 'fa-solid fa-arrow-down-a-z',
        callback: (id, elemento) => {
            window.ordenImpuestos = {
                columna: 'nombre',
                direccion: 'ASC'
            };
            window.pagina = 1;
            CargarImpuestos();
        }
    },
    {
        id: 'nombre_desc',
        texto: 'Nombre (Z - A)',
        icono: 'fa-solid fa-arrow-up-z-a',
        callback: (id, elemento) => {
            window.ordenImpuestos = {
                columna: 'nombre',
                direccion: 'DESC'
            };
            window.pagina = 1;
            CargarImpuestos();
        }
    }
];

window.opcionesImpuestoHabilitado = [{
    texto: 'Editar esquema',
    icono: 'vf-ic_fluent_edit_24_filled text-brand-blue', // Icono específico de persona/edición
    permiso: 'editar_esquemas_fiscales',
    callback: (id) => Editar_Esquema_Impuesto(id)
},
{
    texto: 'Eliminar esquema',
    icono: 'vf-ic_fluent_delete_24_filled text-brand-blue', // Icono de documento/factura
    permiso: 'editar_esquemas_fiscales',
    callback: (id) => Eliminar_Esquema_Impuestos(id, 'fiscal')
},
];

window.opcionesImpuestoDeshabilitado= [{
texto: 'Habilitar impuesto',
icono: 'vf-ic_fluent_checkmark_circle_24_filled text-success',
permiso: 'editar_esquemas_fiscales',
callback: (id) => Habilitar_Esquema_Impuestos(id)
}];


window.botones_opciones_habilitado=[
    {
        id: 'btn-eliminar-masivo',
        icon: 'vf-ic_fluent_delete_24_filled',
        title: 'Eliminar seleccionados',
        permiso:'eliminar_clientes',
        onclick: 'Eliminar_Esquema_Impuestos_Masivo()'
    },
    {
        id: 'btn-exportar-masivo',
        icon: 'vf-ic_fluent_arrow_export_24_filled',
        title: 'Exportar seleccionados',
        onclick: 'Exportar_Esquemas_Impuestos_Masivos()'
    }
]

window.botones_opciones_deshabilitado=[
    {
        id: 'btn-habilitar-masivo',
        icon: 'vf-ic_fluent_arrow_clockwise_24_filled',
        title: 'Habiltar seleccionados',
        permiso:'editar_esquemas_fiscales',
        onclick: 'Habilitar_Esquema_Impuestos_Masivo()'
    }
]