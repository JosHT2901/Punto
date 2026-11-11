window.filtrosConfiguracionSucursales = [
    {
        id: 'f-tipo',
        texto: 'Tipo de Sucursal',
        opciones: [
            { id: 'TIENDA', texto: 'Tienda' },
            { id: 'BODEGA', texto: 'Bodega' },
            { id: 'MATRIZ', texto: 'Matriz' },
            { id: 'CEDIS', texto: 'Cedis' },
            { id: 'OFICINA', texto: 'Oficina' }
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
            { id: 'activo', texto: 'Activas' },
            { id: 'inactivo', texto: 'Inactivas' }
        ],
        config: {
            multiple: false,
            buscador: false
        }
    }
];

window.botonesToolbarConfig = [
    {
        text: 'Nueva sucursal',
        class: 'btn btn-primary fw-600 flex',
        id: 'sucursal-boton-nuevo',
        icon: 'vf-ic_fluent_add_24_filled',
        onClick: (e, $btn) => {
            CrearVentanaIframe(
                'Nueva sucursal',
                '../components/gestionar.sucursal.php',
                '600px',
                true,
                true
            );
        }
    },
    {
        text: 'Importar',
        class: 'btn btn-secondary fw-600 flex',
        id: 'btn-importar-sucursales',
        icon: 'vf-ic_fluent_arrow_import_24_filled',
        onClick: (e, $btn) => {
            CrearVentanaIframe(
                'Importar sucursales',
                '../components/carga.archivo.php',
                '600px',
                true,
                true,
                function (iframeElement) {
                    // Empaquetamos los datos con la configuración de la plantilla para sucursales
                    let datos = {
                        multiple: false,
                        mostrar_plantilla: true,
                        url_plantilla:'/../../../../public/docs/Sucursales.xlsx',
                        tipo_archivos: '.xlsx,.xls,.csv',
                        nombre_plantilla:'plantilla_sucursales.xlsx'
                    };

                    // Enviamos al iframe recién creado
                    $.messenger.send(iframeElement, 'datos_iniciales', datos);

                    $.messenger.on('Archivos_cargados', function (data, sourceWindow, origin) {
                        ModalAPI.cerrar();
                        MostrarCargando('Procesando...', false);
                        Procesar_Archivo_Importar_Sucursales(data.data);
                    });
                }
            );
        }
    }
];

window.opcionesSucursalHabilitado = [{
    texto: 'Editar sucursal',
    icono: 'vf-ic_fluent_edit_24_filled"', // Icono específico de persona/edición
    permiso: 'editar_sucursales',
    callback: (id) => EditarSucursal(id)
},
{
    texto: 'Eliminar Sucursal',
    icono: 'vf-ic_fluent_delete_24_filled text-danger',
    permiso: 'eliminar_sucursales',
    callback: (id) => EliminarSucursal(id)
}
];

window.opcionesSucursalDeshabilitado = [{
    texto: 'Habilitar sucursal',
    icono: 'vf-ic_fluent_checkmark_circle_24_filled text-success',
    permiso: 'editar_sucursales',
    callback: (id) =>Habilitar_Sucursal(id)
}];

window.opcionesMenuOrdenar = [
    {
        id: 'recientes',
        texto: 'Más recientes primero',
        icono: 'fa-solid fa-arrow-down-1-9',
        callback: (id, elemento) => {
            window.ordenSucursales = {
                columna: 'ID',
                direccion: 'DESC'
            };
            window.pagina = 1; // Volvemos a la primera página
            CargarSucursales();
        }
    },
    {
        id: 'antiguos',
        texto: 'Más antiguos primero',
        icono: 'fa-solid fa-arrow-up-9-1',
        callback: (id, elemento) => {
            window.ordenSucursales = {
                columna: 'ID',
                direccion: 'ASC'
            };
            window.pagina = 1;
            CargarSucursales();
        }
    },
    {
        id: 'nombre_asc',
        texto: 'Nombre (A - Z)',
        icono: 'fa-solid fa-arrow-down-a-z',
        callback: (id, elemento) => {
            window.ordenSucursales = {
                columna: 'nombre',
                direccion: 'ASC'
            };
            window.pagina = 1;
            CargarSucursales();
        }
    },
    {
        id: 'nombre_desc',
        texto: 'Nombre (Z - A)',
        icono: 'fa-solid fa-arrow-up-z-a',
        callback: (id, elemento) => {
            window.ordenSucursales = {
                columna: 'nombre',
                direccion: 'DESC'
            };
            window.pagina = 1;
            CargarSucursales();
        }
    }
];

window.botones_opciones_habilitado= [
    {
        id: 'btn-eliminar-masivo',
        icon: 'vf-ic_fluent_delete_24_filled',
        title: 'Eliminar seleccionadas',
        permiso:'eliminar_sucursales',
        onclick: 'Eliminar_Masivo_Sucursales()'
    },
    {
        id: 'btn-exportar-masivo',
        icon: 'vf-ic_fluent_arrow_export_24_filled',
        title: 'Exportar seleccionadas',
        onclick: 'ExportarSucursalesMasivas()'
    }
]

window.botones_opciones_deshabilitado=[
    {
        id: 'btn-habilitar-masivo',
        icon: 'vf-ic_fluent_arrow_clockwise_24_filled',
        title: 'Habiltar seleccionados',
        permiso:'editar_sucursales',
        onclick: 'Habilitar_Masivo_Sucursales()'
    }
]