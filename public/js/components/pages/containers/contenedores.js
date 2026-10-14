function Contenedor_Carga(texto = 'Cargando...') {
    return `
        <div id="contenedor-cargando-proceso" class="w-p-100 h-p-100 flex flex-column justify-center items-center p-20">
            <div class="w-p-100 h-80 flex justify-center items-center">
                <div class="spinner-cargando"></div>
            </div>
            <div class="fs-5 fw-600 text-gray-600 h-40 w-p-100 my-px-10 flex justify-center items-center">
                <span>${texto}</span>
            </div>
        </div>
    `;
}

function Contenedor_No_Resultados(texto, contenedor) {
    const $contenedor =$(contenedor);
    if (!$contenedor.length) return;

    $contenedor.empty();
    const imagenSeleccionada = SeleccionarImagen();
    
    $contenedor.addClass('position-relative').html(`
        <div class="w-p-100 h-calc-100-20 my-px-10 flex justify-center items-center position-absolute top-0 left-0" id="contenedor-no-resultados">
            <div class="w-p-100 box-sizing px-px-5 flex justify-center items-center">
                <div class="w-p-100">
                    <div class="w-p-100 h-150 flex justify-center items-center">
                        <img src="${imagenSeleccionada}" class="h-p-100" style="object-fit: contain;" alt="Sin resultados"/>
                    </div>
                    <div class="w-p-100 my-px-10 flex justify-center items-center fw-700">
                        <span>${texto}</span>
                    </div>
                </div>
            </div>
        </div>
    `);
}

/**
 * Renderiza un contenedor de estado "Agregar" con imagen y texto descriptivo.
 * @param {string} texto Mensaje principal a mostrar.
 * @param {string|jQuery} contenedor Selector o elemento jQuery contenedor.
 */
function Contenedor_Agregar(texto, contenedor) {
    const $contenedor =$(contenedor);
    if (!$contenedor.length) return;

    const basePath = typeof UI_CONFIG !== 'undefined' ? UI_CONFIG.ASSETS_PATH : '../../assets/icon/';
    
    $contenedor.empty();$contenedor.addClass('position-relative');

    $contenedor.html(`
        <div class="w-p-100 h-calc-100-20 my-px-10 flex justify-center items-center position-absolute top-0 left-0" id="contenedor-agregar">
            <div class="w-p-100 box-sizing px-px-5 flex justify-center items-center">
                <div class="w-p-100">
                    <div class="w-p-100 h-150 flex justify-center items-center px-2">
                        <img src="${basePath}Graphics_Plazza/agregar.png" class="h-p-80" style="object-fit: contain;" alt="Agregar"/>
                    </div>
                    <div class="w-p-100 my-px-10 flex justify-center items-center fw-700">
                        <span>${texto}</span>
                    </div>
                </div>
            </div>
        </div>
    `);
}