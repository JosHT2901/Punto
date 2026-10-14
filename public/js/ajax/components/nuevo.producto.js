// --- 1. Funciones individuales para cada petición (reutilizables) ---

async function ObtenerCategoriasAPI() {
    try {
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/categorias.php', {
            accion: 'obtener_categorias'
        });
        return respuesta?.data || [];
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        return [];
    }
}

async function ObtenerMarcasAPI() {
    try {
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/marcas.php', {
            accion: 'obtener_marcas'
        });
        return respuesta?.data || [];
    } catch (error) {
        console.error("Error al obtener marcas:", error);
        return [];
    }
}

async function ObtenerSkuAPI() {
    try {
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/codigos.php', {
            accion: 'generar_sku'
        });
        return respuesta?.data || '';
    } catch (error) {
        console.error("Error al generar SKU:", error);
        return '';
    }
}

async function ObtenerImpuestosAPI() {
    try {
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/impuestos.php', {
            accion: 'obtener_esquemas_fiscales'
        });
        return respuesta?.data || [];
    } catch (error) {
        console.error("Error al obtener impuestos:", error);
        return [];
    }
}

async function ObtenerSucursalesAPI() {
    try {
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/sucursales.php', {
            accion: 'obtener_sucursales'
        });
        return respuesta?.data || [];
    } catch (error) {
        console.error("Error al obtener sucursales:", error);
        return [];
    }
}

async function ObtenerAtributosAPI() {
    try {
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/categorias.php', {
            accion: 'obtener_atributos'
        });
        return respuesta?.data || [];
    } catch (error) {
        console.error("Error al obtener atributos:", error);
        return [];
    }
}

async function ObtenerProductosAPI() {
    try {
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/productos.php', {
            accion: 'obtener_productos_completos'
        });
        return respuesta?.data || [];
    } catch (error) {
        console.error("Error al obtener atributos:", error);
        return [];
    }
}

// --- 2. Función contenedora principal robusta con Promise.allSettled ---

async function CargarDatosIniciales(dispararEvento = true) {
    try {
        MostrarCargando('Obteniendo información...', false);

        // Usamos allSettled para evitar que un fallo individual rompa toda la carga inicial
        const resultados = await Promise.allSettled([
            ObtenerCategoriasAPI(),
            ObtenerMarcasAPI(),
            ObtenerSkuAPI(),
            typeof CargarJSON === 'function' ? CargarJSON('../../../src/json/data/claves_producto.json') : Promise.resolve([]),
            ObtenerImpuestosAPI(),
            ObtenerAtributosAPI(),
            ObtenerSucursalesAPI(),
            ObtenerProductosAPI(),
            typeof CargarJSON === 'function' ? CargarJSON('../../../src/json/data/unidades.json') : Promise.resolve([])
        ]);
        OcultarCargando();
        // Extraemos resultados de forma segura
        window.categorias = resultados[0].status === 'fulfilled' ? resultados[0].value : [];
        window.marcas = resultados[1].status === 'fulfilled' ? resultados[1].value : [];
        window.sku = resultados[2].status === 'fulfilled' ? resultados[2].value : '';
        window.claves_productos = resultados[3].status === 'fulfilled' ? resultados[3].value : [];
        window.impuestos = resultados[4].status === 'fulfilled' ? resultados[4].value : [];
        window.atributos = resultados[5].status === 'fulfilled' ? resultados[5].value : [];
        window.sucursales = resultados[6].status === 'fulfilled' ? resultados[6].value : [];
        window.productos=resultados[7].status==='fulfilled'?resultados[7].value:[]
        window.unidades=resultados[8].status==='fulfilled'?resultados[8].value:[]
        if (!Array.isArray(window.categorias) || window.categorias.length === 0) {
            MostrarMensajeConAccion(
                'Primero crea una categoría', 
                false, // tipo éxito
                290,
                false,
                false,
                {
                    botonTexto: 'Crear categoría',
                    accionBoton: 'gestionar.categoria.php' // URL destino
                }
            );
            return false;
        }

        if (!Array.isArray(window.impuestos) || window.impuestos.length === 0) {
            MostrarMensajeConAccion(
                'Primero crea un impuesto', 
                false, // tipo éxito
                290,
                false,
                false,
                {
                    botonTexto: 'Crear impuesto',
                    accionBoton: 'gestionar.esquema.impuesto.php' // URL destino
                }
            );
            return false;
        }

        if (!Array.isArray(window.sucursales) || window.sucursales.length === 0) {
            MostrarMensajeConAccion(
                'Primero crea una sucursal', 
                false, // tipo éxito
                290,
                false,
                false,
                {
                    botonTexto: 'Crear sucursal',
                    accionBoton: 'gestionar.sucursal.php' // URL destino
                }
            );
            return false;
        }

        if (dispararEvento) {
            $(document).trigger('datosListos');
        }
       
        return true;
    } catch (error) {
        OcultarCargando();
        console.error("Error crítico al obtener los datos iniciales:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('No se pudieron cargar algunos datos iniciales.', false, false, false);
        }
        return false;
    }
}

// --- 3. Generación de Código de Barras con manejo robusto ---

async function Generar_Codigo_Barras() {
    try {
        MostrarCargando('Generando código...', false);
        
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/codigos.php', {
            accion: 'generar_codigo_barras'
        });
        console.log(respuesta)
        if (respuesta && respuesta.ok) {
            OcultarCargando();
            return respuesta.data;
        } 
      
        throw new Error(respuesta?.mensaje || 'No se pudo generar el código de barras.');

    } catch (error) {
        console.error("Error al generar el código de barras:", error);

        OcultarCargando();
        const mensajeServidor = error?.response?.mensaje || error?.message || (typeof error === 'string' ? error : '');
        const palabrasClave = ['duplicado', 'existe', 'obligatorio', 'generar', 'código', 'permiso'];
        const esControlado = palabrasClave.some(palabra => mensajeServidor.toLowerCase().includes(palabra));

        if (mensajeServidor && esControlado) {
            MostrarMensaje(mensajeServidor, false, true, false);
        } else {
            MostrarMensaje('Ocurrió un error inesperado al generar el código de barras.', false, false, false);
        }
        
        return null;
    }
}

// --- 4. Inicialización al cargar el DOM ---
$(document).ready(async function () {
    await CargarDatosIniciales(true);
});