const listaDePasosWizard = [{
        id: 'form-producto-identificacion',
        label: 'Identificación'
    },
    {
        id: 'form-producto-basico',
        label: 'Básico'
    },
    {
        id: 'form-producto-imagenes',
        label: 'Imágenes'
    },
    {
        id: 'form-producto-fiscal',
        label: 'Fiscal'
    },
    {
        id: 'form-producto-costos',
        label: 'Costos'
    },
    {
        id: 'form-producto-formas-venta',
        label: 'Formas de venta'
    },
    {
        id: 'form-producto-claves',
        label: 'Claves'
    },
    {
        id: 'form-producto-precios',
        label: 'Precios de venta'
    },
    {
        id: 'form-producto-atributos',
        label: 'Atributos'
    },
    {
        id: 'form-producto-ubicacion',
        label: 'Ubicación'
    },
    {
        id: 'form-producto-existencias',
        label: 'Existencias'
    }
];

$(document).ready(function () {
    let inicializado = false;
    // --- Función Principal InicializarNuevoProducto ---
    function InicializarNuevoProducto() {
        if (inicializado) return;
        inicializado = true;
        Eventos_Generales_Paginas()
        InicializarWizardAcordeon(function ($currentCard, $btn) {
            const btnId = $btn.attr('id');
            // --- PASO 1: IDENTIFICACIÓN ---
            if (btnId === 'identificacion-boton-siguiente') {
                return Validacion_Identificacion()
            }

            // --- PASO 2: BÁSICO ---
            if (btnId === 'descripcion-boton-siguiente') {
                return Validacion_Informacion_Basica()
            }

            if (btnId === "imagenes-boton-siguiente") {
                return Validacion_Imagenes()
            }

            if (btnId === 'fiscal-boton-siguiente') {
                return Validacion_Fiscal()
            }

            if (btnId === 'costo-boton-siguiente') {
                return Validacion_Costo()
            }
            if (btnId === 'formas-boton-siguiente') {
                return Validacion_Formas_Venta()
            }

            if (btnId === 'claves-boton-siguiente') {
                return Validacion_Claves()
            }

            if (btnId === 'precios-boton-siguiente') {
                return Validacion_Precios()
            }

            if (btnId === 'atributos-boton-siguiente') {
                return Validacion_Atributos()
            }

            if (btnId == 'ubicacion-boton-siguiente') {
                return Validacion_Ubicaciones()
            }

            if (btnId == 'existencias-boton-siguiente') {
                return Validacion_Existencias()
            }

            return true; // ✅ Todo correcto, permite que el acordeón avance al siguiente paso
        });
        Eventos_Pagina_Identificacion()
        ActualizarTimelineActivo('form-producto-identificacion')
    }
    // Escucha robusta cuando los datos carguen de manera asíncrona externa
    $(document).off('datosListos.nuevoProducto').on('datosListos.nuevoProducto', function () {
        InicializarNuevoProducto();
    });
});