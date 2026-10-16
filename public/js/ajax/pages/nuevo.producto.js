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
async function ObtenerAjustesAPI() {
    try {
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/ajustes.php', {
            accion: 'obtener_variables'
        });

        const listaAjustes = respuesta?.data || [];

        // Transformamos el arreglo de objetos [{v_clave: '...', v_valor: '...'}] 
        // en un objeto plano { bloquear_stock_cero: '1', codigo_iso: 'MXN', ... }
        const ajustesObjeto = {};
        listaAjustes.forEach(item => {
            if (item && item.v_clave) {
                ajustesObjeto[item.v_clave] = item.v_valor;
            }
        });
        return ajustesObjeto;
    } catch (error) {
        console.error("Error al obtener ajustes:", error);
        return {};
    }
}

// --- 2. Función contenedora principal robusta con Promise.allSettled ---

async function CargarDatosIniciales(dispararEvento = true) {
    try {
        MostrarCargando('Obteniendo información...', false);
        
        // 1. Detectar si existe un ID de borrador en la URL mediante el token cifrado
        const urlParams = new URLSearchParams(window.location.search);
        const IdCifrado = urlParams.get('token');
        const IdBorrador = IdCifrado ? Descifrar_Payload(IdCifrado) : null;
        console.log("ID Borrador detectado:", IdBorrador);

        // Preparamos las promesas base. Si hay borrador, omitimos ObtenerSkuAPI() para no generar un SKU nuevo.
        const promesasBase = [
            ObtenerCategoriasAPI(),
            ObtenerMarcasAPI(),
            IdBorrador ? Promise.resolve('') : ObtenerSkuAPI(), // <--- Si hay ID, no genera SKU nuevo
            typeof CargarJSON === 'function' ? CargarJSON('../../../src/json/data/claves_producto.json') : Promise.resolve([]),
            ObtenerImpuestosAPI(),
            ObtenerAtributosAPI(),
            ObtenerSucursalesAPI(),
            ObtenerProductosAPI(),
            typeof CargarJSON === 'function' ? CargarJSON('../../../src/json/data/unidades.json') : Promise.resolve([]),
            ObtenerAjustesAPI()
        ];

        // Si hay un ID de borrador en la URL, añadimos la promesa para obtenerlo al final del arreglo
        if (IdBorrador) {
            const promesaBorrador = ajaxConParametros('../../../src/controllers/php/controllers/productos.php', {
                accion: 'obtener_detalle_borrador',
                id_borrador: IdBorrador
            });
            promesasBase.push(promesaBorrador);
        }

        // Usamos allSettled para evitar que un fallo individual rompa toda la carga inicial
        const resultados = await Promise.allSettled(promesasBase);
        OcultarCargando();

        // Extraer resultados de forma segura
        window.categorias = resultados[0].status === 'fulfilled' ? resultados[0].value : [];
        window.marcas = resultados[1].status === 'fulfilled' ? resultados[1].value : [];
        window.sku = resultados[2].status === 'fulfilled' ? resultados[2].value : '';
        window.claves_productos = resultados[3].status === 'fulfilled' ? resultados[3].value : [];
        window.impuestos = resultados[4].status === 'fulfilled' ? resultados[4].value : [];
        window.atributos = resultados[5].status === 'fulfilled' ? resultados[5].value : [];
        window.sucursales = resultados[6].status === 'fulfilled' ? resultados[6].value : [];
        window.productos = resultados[7].status === 'fulfilled' ? resultados[7].value : [];
        window.unidades = resultados[8].status === 'fulfilled' ? resultados[8].value : [];
        window.ajustes = resultados[9].status === 'fulfilled' ? resultados[9].value : [];

        // Si se consultó el borrador (índice 10 en allSettled), procesamos su información e inyectamos en MemoriaLocal
        if (IdBorrador && resultados[10] && resultados[10].status === 'fulfilled') {
            const respBorrador = resultados[10].value;
            if (respBorrador && respBorrador.ok && respBorrador.data && respBorrador.data.datos) {
                const datosBorrador = respBorrador.data.datos;
                
                // Si MemoriaLocal está disponible, cargamos los buckets guardados
                if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.RestaurarMemoria === 'function') {
                    MemoriaLocal.RestaurarMemoria(datosBorrador);
                } else if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.GuardarMasivo === 'function') {
                    // Carga manual bucket por bucket si aplica
                    for (const [key, value] of Object.entries(datosBorrador)) {
                        MemoriaLocal.GuardarMasivo(key, value);
                    }
                }
                console.log("Borrador cargado exitosamente desde la URL:", datosBorrador);
            }
        }

        if (!Array.isArray(window.categorias) || window.categorias.length === 0) {
            MostrarMensajeConAccion(
                'Primero crea una categoría', 
                false, 
                290,
                false,
                false,
                {
                    botonTexto: 'Crear categoría',
                    accionBoton: 'gestionar.categoria.php'
                }
            );
            return false;
        }

        if (!Array.isArray(window.impuestos) || window.impuestos.length === 0) {
            MostrarMensajeConAccion(
                'Primero crea un impuesto', 
                false, 
                290,
                false,
                false,
                {
                    botonTexto: 'Crear impuesto',
                    accionBoton: 'gestionar.esquema.impuesto.php'
                }
            );
            return false;
        }

        if (!Array.isArray(window.sucursales) || window.sucursales.length === 0) {
            MostrarMensajeConAccion(
                'Primero crea una sucursal', 
                false, 
                290,
                false,
                false,
                {
                    botonTexto: 'Crear sucursal',
                    accionBoton: 'gestionar.sucursal.php'
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

async function Guardar_Gestion_Producto(payload) {
    try {
        // 1. Mostrar modal de carga
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Guardando producto y subiendo archivos...', false);
        }

        // 2. Crear un FormData nativo limpio
        const formData = new FormData();

        // 3. Extraer las imágenes y separar el resto de la data del wizard
        const { imagenes, ...datosSinImagenes } = payload;

        // 4. Agregar la acción y la data estructurada en formato JSON string
        formData.append('accion', 'gestionar_producto');
        formData.append('data', JSON.stringify(datosSinImagenes));

        // 5. Adjuntar los archivos evitando cualquier clonación de jQuery
        if (imagenes && Array.isArray(imagenes)) {
            imagenes.forEach((img, index) => {
                // Verificamos de forma estricta si el objeto contiene un archivo File o Blob válido
                if (img && img.file && (img.file instanceof File || img.file instanceof Blob)) {
                    formData.append(`imagen_${index}`, img.file);
                } 
                else if (img && img.preview && typeof img.preview === 'string') {
                    formData.append(`imagen_url_${index}`, img.preview);
                }
            });
        }

        // 6. Ejecutar la petición utilizando la función XHR nativa pura
        const respuesta = await ajaxConParametrosXHR(
            '../../../src/controllers/php/controllers/productos.php', 
            formData, 
            true // esFormData = true (omite $.param y evita que jQuery toque los binarios)
        );

        console.log("Respuesta del servidor (Producto):", respuesta);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        // 7. Validar respuesta exitosa
        if (respuesta && respuesta.ok) {
            const mensajeExito = respuesta.mensaje || 'Producto guardado correctamente.';
            
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeExito, true, false, false);
            } else if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(mensajeExito, 250, true);
            }

            // Limpieza de memoria local y wizard
            if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.LimpiarTodo === 'function') {
                MemoriaLocal.LimpiarTodo();
            }

            window.formasVentaData = [];
            window.sucursalesProducto = {};
            window.atributosSeleccionados = [];

            $('form').each(function() {
                this.reset();
            });

            if (window.galeriaProductos && typeof window.galeriaProductos.destroy === 'function') {
                window.galeriaProductos.destroy();
            }

            // Notificar a la ventana padre
            if (typeof $.messenger !== 'undefined' && window.parent) {
                $.messenger.send(
                    window.parent,
                    'producto_guardado',
                    { 
                        status: 'success', 
                        mensaje: mensajeExito, 
                        tipo: payload.tipo || 'unica',
                        id_producto: respuesta.data ? respuesta.data.id : null
                    },
                    '*'
                );
            }

            setTimeout(() => {
                if (typeof CerrarModal === 'function') {
                    CerrarModal();
                } else if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
            }, 1000);

        } else {
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'No se pudo completar el registro del producto.';
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeError, false, false, false);
            } else {
                alert(mensajeError);
            }
        }

    } catch (error) {
        console.error("Error crítico al guardar el producto:", error);
        
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        let mensajeServidor = error.mensaje || 'Ocurrió un error inesperado al conectar con el servidor.';

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje(mensajeServidor, false, true, false);
        } else {
            alert(mensajeServidor);
        }
    }
}

async function Guardar_Borrador_Producto() {
    try {
        // 1. Detectar si estamos editando un borrador existente a través del token en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const IdCifrado = urlParams.get('token');
        
        // Como el token descifrado ya es directamente el número (ej. "5"), solo lo convertimos a entero
        const idBorradorActual = IdCifrado ? parseInt(Descifrar_Payload(IdCifrado), 10) || 0 : 0;
        console.log(idBorradorActual)
        // 2. Obtenemos el estado completo actual del wizard desde MemoriaLocal
        const payloadBorrador = (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.VerMemoria === 'function') 
            ? MemoriaLocal.VerMemoria() 
            : {};

        // Validamos que exista algo que guardar
        if (!payloadBorrador || Object.keys(payloadBorrador).length === 0) {
            console.warn("El borrador está vacío, no hay datos que sincronizar.");
            return;
        }

        // 3. Enviamos los datos junto con el ID del borrador limpio
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/productos.php', {
            accion: 'guardar_borrador',
            borrador_id: idBorradorActual, 
            data: payloadBorrador
        });
        
        console.log("Respuesta del servidor (Borrador):", respuesta);

        // Validamos si la respuesta fue exitosa (ok: true)
        if (respuesta && respuesta.ok) {
            console.log(respuesta.mensaje || 'Borrador guardado exitosamente.');
            
            if (typeof MostrarNotificacionSutil === 'function') {
                MostrarNotificacionSutil('Borrador guardado automáticamente');
            }
        } else {
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'No se pudo guardar el borrador.';
            console.warn(mensajeError);
        }

    } catch (error) {
        console.error("Error al guardar el borrador del producto:", error);
        
        let mensajeServidor = '';
        if (error.response && error.response.mensaje) {
            mensajeServidor = error.response.mensaje;
        } else if (error.mensaje) {
            mensajeServidor = error.mensaje;
        } else if (typeof error === 'string') {
            mensajeServidor = error;
        }

        console.error("Detalle del error de borrador:", mensajeServidor || 'Error de conexión.');
    }
}