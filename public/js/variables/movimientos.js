window.filtrosConfiguracionMovimientos = [
    {
        id: 'f-modulo',
        texto: 'Módulo',
        opciones: (window.modulosMovimientos || []).map((modulo) => ({
            id: modulo,
            texto: formatearTextoFiltro(modulo)
        })),
        config: {
            multiple: true,
            buscador: true
        }
    },
    {
        id: 'f-accion',
        texto: 'Acción',
        opciones: (window.accionesMovimientos || []).map((accion) => ({
            id: accion,
            texto: formatearTextoFiltro(accion)
        })),
        config: {
            multiple: true,
            buscador: true
        }
    }
];

// Aplica un orden y recarga desde la primera página
const aplicarOrdenMovimientos = (columna, direccion) => {
    window.ordenMovimientos = { columna, direccion };
    window.pagina = 1; // Volvemos a la primera página
    CargarMovimientos();
};

window.opcionesMenuOrdenar = [
    {
        id: 'recientes',
        texto: 'Más recientes primero',
        icono: 'fa-solid fa-arrow-down-1-9',
        callback: () => aplicarOrdenMovimientos('t.movimiento_id', 'DESC')
    },
    {
        id: 'antiguos',
        texto: 'Más antiguos primero',
        icono: 'fa-solid fa-arrow-up-9-1',
        callback: () => aplicarOrdenMovimientos('t.movimiento_id', 'ASC')
    },
    {
        id: 'modulo_asc',
        texto: 'Módulo (A - Z)',
        icono: 'fa-solid fa-arrow-down-a-z',
        callback: () => aplicarOrdenMovimientos('t.modulo', 'ASC')
    },
    {
        id: 'modulo_desc',
        texto: 'Módulo (Z - A)',
        icono: 'fa-solid fa-arrow-up-z-a',
        callback: () => aplicarOrdenMovimientos('t.modulo', 'DESC')
    },
    {
        id: 'accion_asc',
        texto: 'Acción (A - Z)',
        icono: 'fa-solid fa-arrow-down-a-z',
        callback: () => aplicarOrdenMovimientos('t.accion', 'ASC')
    },
    {
        id: 'accion_desc',
        texto: 'Acción (Z - A)',
        icono: 'fa-solid fa-arrow-up-z-a',
        callback: () => aplicarOrdenMovimientos('t.accion', 'DESC')
    }
];

window.botones_opciones=[
    {
        id: 'btn-exportar-masivo',
        icon: 'vf-ic_fluent_arrow_export_24_filled',
        title: 'Exportar seleccionados',
        onclick: 'ExportarMovimientosMasivos()'
    }
]