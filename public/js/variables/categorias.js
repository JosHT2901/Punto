window.botonesToolbarConfig = [{
    text: 'Nueva categoría',
    class: 'btn btn-primary fw-600 flex',
    id: 'categoria-boton-nueva',
    icon: 'vf-ic_fluent_add_24_filled',
    onClick: (e, $btn) => {
        window.location.href='../components/gestionar.categorias.php' 
    }
},
{
    text: 'Importar',
    class: 'btn btn-secondary fw-600 flex',
    id: 'categorias-importar',
    icon: 'vf-ic_fluent_arrow_import_24_filled',
    onClick: (e, $btn) => {
        CrearVentanaIframe(
            'Importar categorias',
            '../components/carga.archivo.php',
            '600px',
            true,
            true,
            function (iframeElement) {
                // Empaquetamos los datos con la propiedad 'localidades'
                let datos = {
                    multiple: false,
                    mostrar_plantilla: true,
                    url_plantilla:'/../../../../public/docs/Categorias.xlsx',
                    tipo_archivos: '.xlsx,.xls,.csv',
                    nombre_plantilla:'plantilla_categorias.xlsx'
                };

                // Enviamos al iframe recién creado usando la acción 'codigo_postal'
                $.messenger.send(iframeElement, 'datos_iniciales', datos);

                $.messenger.on('Archivos_cargados', function (data, sourceWindow, origin) {
                    ModalAPI.cerrar()
                    MostrarCargando('Procesando...', false)
                    Procesar_Archivo_Importar_Categorias(data.data)
                })
            }
        );
    }
}];

window.filtrosConfiguracionCategorias = [
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

window.opcionesCategoriaHabilitado = [{
    texto: 'Editar categoría',
    icono: 'vf-ic_fluent_edit_24_filled text-brand-blue', // Icono de edición
    permiso: 'editar_categorias',
    callback: (id) => {
        const id_cifrado = Cifrar_Payload(id);
        console.log(id_cifrado);
        window.location.href = "../components/gestionar.categorias.php?id=" + id_cifrado;
    }
},

{
    texto: 'Eliminar categoría',
    icono: 'vf-ic_fluent_delete_24_filled text-brand-blue', // Icono específico de persona/edición
    permiso: 'eliminar_categorias',
    callback: (id) => Eliminar_Categoria(id)
},
];

window.opcionesCategoriaDeshabilitado = [{
    texto: 'Habilitar categoría',
    icono: 'vf-ic_fluent_checkmark_circle_24_filled text-success',
    permiso: 'editar_categorias',
    callback: (id) => Restaurar_Categoria(id)
}];

window.botones_opciones_habilitado=[
    {
        id: 'btn-eliminar-masivo',
        icon: 'vf-ic_fluent_delete_24_filled',
        title: 'Eliminar seleccionados',
        permiso:'eliminar_categorias',
        onclick: 'EliminarCategoriasMasivos()'
    },
    {
        id: 'btn-exportar-masivo',
        icon: 'vf-ic_fluent_arrow_export_24_filled',
        title: 'Exportar seleccionados',
        onclick: 'ExportarCategoriasMasivas()'
    }
]

window.botones_opciones_deshabilitado=[
    {
        id: 'btn-habilitar-masivo',
        icon: 'vf-ic_fluent_arrow_clockwise_24_filled',
        title: 'Habiltar seleccionados',
        permiso:'editar_categorias',
        onclick: 'HabilitarCategoriasMasivos()'
    }
]

window.ordenCategorias = window.ordenCategorias || {
    columna: 'ID',
    direccion: 'DESC'
};

window.opcionesMenuOrdenar = [
    {
        id: 'recientes',
        texto: 'Más recientes primero',
        icono: 'fa-solid fa-arrow-down-1-9',
        callback: (id, elemento) => {
            window.ordenCategorias = {
                columna: 'ID',
                direccion: 'DESC'
            };
            window.pagina = 1; // Volvemos a la primera página
            CargarCategorias();
        }
    },
    {
        id: 'antiguos',
        texto: 'Más antiguos primero',
        icono: 'fa-solid fa-arrow-up-9-1',
        callback: (id, elemento) => {
            window.ordenCategorias = {
                columna: 'ID',
                direccion: 'ASC'
            };
            window.pagina = 1;
            CargarCategorias();
        }
    },
    {
        id: 'nombre_asc',
        texto: 'Nombre (A - Z)',
        icono: 'fa-solid fa-arrow-down-a-z',
        callback: (id, elemento) => {
            window.ordenCategorias = {
                columna: 'Nombre',
                direccion: 'ASC'
            };
            window.pagina = 1;
            CargarCategorias();
        }
    },
    {
        id: 'nombre_desc',
        texto: 'Nombre (Z - A)',
        icono: 'fa-solid fa-arrow-up-z-a',
        callback: (id, elemento) => {
            window.ordenCategorias = {
                columna: 'Nombre',
                direccion: 'DESC'
            };
            window.pagina = 1;
            CargarCategorias();
        }
    }
];