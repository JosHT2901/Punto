<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Gestión de productos, costos y precios";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>

<form class="w-p-100 h-p-100 py-2 flex flex-column" >
    <div class="w-p-100 mb-3" id="contenedor-timeline">
        <!-- El TimelineUI se renderizará aquí automáticamente -->
    </div>
    <div class="w-p-100 flex flex-column js-wizard-container flex-1 min-w-0 ocultar-scroll" id="form-gestion-producto">

        <!-- Paso 1: Identificación -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-producto-identificacion">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Identificación</span>
            </div>
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body js-panel-toggle">
                <div class="my-3 flex flex-column gap-4">
                    <div class="flex flex-column md:flex-row justify-between gap-3">
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label for="input-codigo" class="block mb-1 fs-3 fw-600 pl-2">Código</label>
                            <div class="flex items-center gap-2">
                                <div class="flex flex-column flex-1 min-w-0">
                                    <input type="text" name="codigo" class="w-p-100 h-40 input-mayus" id="input-codigo" placeholder="Ingresa el código" autocomplete="off">
                                    <span class="error-produ-msg fs-2 text-danger mt-1 pl-2 fw-600" style="display: none;"></span>
                                </div>
                                <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40" id="boton-scan-codigo" title="Escanear código">
                                    <i class="ph vf-ic_fluent_barcode_scanner_24_filled fs-6"></i>
                                </a>
                                <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40" id="boton-generar-codigo" title="Generar código">
                                    <i class="ph ph-magic-wand fs-6"></i>
                                </a>
                            </div>
                        </div>
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label for="input-sku" class="block mb-1 fs-3 fw-600 pl-2">SKU</label>
                            <div class="flex items-center gap-2">
                                <input type="text" name="sku" class="w-p-100 h-40 input-mayus input-50" id="input-sku" placeholder="Ingresa el SKU (opcional)" autocomplete="off">
                                <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40 btn-active" id="boton-block-sku" title="Bloquear sku">
                                    <i class="vf-ic_fluent_lock_open_24_filled fs-6"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end">
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="2" id="identificacion-boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 2: Información básica -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-producto-basico" data-step-id="basico">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Información básica</span>
            </div>
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="producto-input-descripcion" class="block mb-1 fs-3 fw-600 pl-2">Descripción</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="descripcion" class="w-p-100 h-40 input-mayus input-100" id="producto-input-descripcion" placeholder="Ingresa la descripción del producto" autocomplete="off">
                        </div>
                    </div>
                    <div class="flex flex-column md:flex-row justify-between gap-3">
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label class="block mb-1 fs-3 fw-600 pl-2">Categoría</label>
                            <div class="flex items-center gap-2 flex-column row-gap-1">
                                <div class="w-p-100 h-40" id="contenedor-categoria"></div>
                                <span class="rounded-8 bg-brand-soft p-2 text-brand-blue fw-600 fs-2">Para administrar las categorias ve al módulo categorías</span>
                            </div>
                        </div>
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label class="block mb-1 fs-3 fw-600 pl-2">Marca</label>
                            <div class="flex items-center gap-2">
                                <div class="h-40 flex-1" id="contenedor-marcas"></div>
                                <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40" id="nuevo-producto-boton-marca" title="Nueva marca">
                                    <i class="vf-ic_fluent_add_24_filled fs-6"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="1">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="descripcion-boton-siguiente" data-target-step="3">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 3: Imágenes -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-producto-imagenes" data-step-id="imagenes">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Imágenes</span>
            </div>
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4" id="contenedor-galeria-productos"></div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="2">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="imagenes-boton-siguiente" data-target-step="4">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 4: Fiscal General -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-producto-fiscal" data-step-id="fiscal">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Fiscal</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="producto-input-sat" class="block mb-1 fs-3 fw-600 pl-2">Clave S.A.T. General</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="clave_sat" class="w-p-100 h-40 input-mayus" id="producto-input-sat" placeholder="Ej. 52151504" autocomplete="off">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="producto-input-impuesto" class="block mb-1 fs-3 fw-600 pl-2">Perfil de impuesto</label>
                        <div class="flex items-center gap-2 flex-column row-gap-1">
                            <div class="w-p-100 h-40" id="contenedor-impuestos"></div>
                            <span class="rounded-8 bg-brand-soft p-2 text-brand-blue fw-600 fs-2">Para administrar los perfiles de impuestos ve a ajustes</span>
                        </div>
                        <div class="w-p-100 bg-brand-soft rounded-md my-3 flex" id="contenedor-informacion-impuesto">
                            <div class="flex justify-center items-center flex-1"><span class="fw-600 fs-3 text-brand">Selecciona un impuesto</span></div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="3">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="fiscal-boton-siguiente" data-target-step="5">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 5: Costos y Presentación de Compra -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-producto-compra" data-step-id="compra">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Costos de compra</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="p-3 bg-brand-soft rounded-8 flex items-center gap-2">
                        <i class="ph ph-calculator fs-5 text-brand-blue"></i>
                        <span class="fs-2 text-brand-blue fw-600">Calculadora de compra: Indica cuántos empaques compraste y cuánto pagaste en total para obtener el costo unitario automáticamente.</span>
                    </div>
                    <div class="flex flex-column md:flex-row justify-between gap-3">
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label for="producto-input-tipo-compra" class="block mb-1 fs-3 fw-600 pl-2">Presentación de Compra</label>
                            <input type="text" name="tipo_compra" class="w-p-100 h-40 input-mayus input-50" id="producto-input-tipo-compra" placeholder="Ej. Caja, Paquete" autocomplete="off">
                        </div>
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label for="producto-input-cantidad-compra" class="block mb-1 fs-3 fw-600 pl-2">Cantidad Comprada</label>
                            <input type="text" name="cantidad_compra" class="w-p-100 h-40 fw-600" id="producto-input-cantidad-compra" autocomplete="off">
                            <span class="fs-1 text-muted pl-2 mt-1">Ej. 12 cajas o paquetes</span>
                        </div>
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label for="producto-input-costo-total" class="block mb-1 fs-3 fw-600 pl-2">Costo Total Pagado</label>
                            <div class="flex items-center gap-2">
                                <span class="w-30 flex justify-center items-center fw-600 fs-6 text-brand span-moneda">$</span>
                                <input type="text" name="costo_total" class="w-p-100 h-40 fw-600" id="producto-input-costo-total" autocomplete="off">
                            </div>
                            <span class="fs-1 text-muted pl-2 mt-1">Total de la factura o ticket</span>
                        </div>
                    </div>
                    <div class="flex flex-column md:flex-row justify-between gap-3 p-3 bg-gray-100 rounded-8 border border-gray-300">
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label for="producto-input-piezas-por-empaque" class="block mb-1 fs-3 fw-600 pl-2">Piezas por cada empaque</label>
                            <input type="text" name="piezas_por_empaque" class="w-p-100 h-40 text-center fw-600" id="producto-input-piezas-por-empaque" autocomplete="off">
                            <span class="fs-1 text-muted pl-2 mt-1">Cuántas piezas trae cada caja individual</span>
                        </div>
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label class="block mb-1 fs-3 fw-600 pl-2">Total de Piezas en el Lote</label>
                            <input type="text" name="piezas_compra" class="w-p-100 h-40 text-center fw-600 bg-gray-200" id="producto-input-piezas-compra" value="0.00" readonly autocomplete="off">
                            <span class="fs-1 text-muted pl-2 mt-1">Calculado automáticamente</span>
                        </div>
                    </div>
                    <div class="flex flex-column md:flex-row gap-3">
                        <div class="p-3 bg-light rounded-8 flex flex-1 justify-between items-center border">
                            <span class="fs-3 fw-600 text-muted">Costo por <span id="label-tipo-unidad">---</span>:</span>
                            <span class="rounded-8 bg-brand-soft p-2 text-brand-blue fw-700 fs-4" id="contador-costo-empaque">$0.00</span>
                        </div>
                        <div class="p-3 bg-light rounded-8 flex flex-1 justify-between items-center border">
                            <span class="fs-3 fw-600 text-muted">Costo Base:</span>
                            <span class="rounded-8 bg-brand-soft p-2 text-brand-blue fw-700 fs-4" id="contador-costo-base">$0.00</span>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="4">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="6" id="costo-boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 6: Formas de venta y equivalencias -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-producto-costos-equivalencias" data-step-id="equivalencias">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Formas de venta</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4 w-p-100">
                    <div id="contenedor-tabla-formas-venta" class="w-p-100 overflow-x-auto"></div>
                </div>
                <div class="flex justify-between mt-4">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="5">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="7" id="formas-boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 7: Códigos de Barras y Claves S.A.T. por Empaque -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-producto-codigos-sat" data-step-id="codigos-sat">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Códigos de Barras y Claves S.A.T. por Empaque</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="flex flex-column md:flex-row justify-between items-center gap-2">
                        <span class="rounded-8 bg-brand-soft p-2 text-brand-blue fw-600 fs-2">Asigna el código de barras y la clave SAT específica para cada presentación</span>
                    </div>
                    <div class="w-p-100 p-2 overflow-x-auto" id="contenedor-tabla-codigos-sat"></div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="6">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="claves-boton-siguiente" data-target-step="8">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 8: Márgenes y Precios de Venta -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-producto-precios-venta" data-step-id="precios">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Márgenes y Precios de Venta</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4 w-p-100">
                    <div class="w-p-100 flex rounded-md bg-gray-200 p-2">
                        <div class="flex-1 fw-600 flex justify-start items-center"><span>Contiene impuestos</span></div>
                        <div>
                            <label class="toggle-switch pointer">
                                <input type="checkbox" class="atributo-toggle atributo-valor" id="check-precio-impuestos">
                                <div class="toggle-switch-background">
                                    <div class="toggle-switch-handle"></div>
                                </div>
                            </label>
                        </div>
                    </div>
                    <div id="contenedor-tabla-precios" class="w-p-100 overflow-x-auto"></div>
                </div>
                <div class="flex justify-between mt-4">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="7">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="precios-boton-siguiente" data-target-step="9">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 9: Atributos -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-producto-atributos" data-step-id="atributos">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Atributos</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4 w-p-100">
                    <div class="w-p-100 flex js-wizard-container flex-1 min-w-0 ocultar-scroll flex-wrap" id="contenedor-atributos"></div>
                </div>
                <div class="flex justify-between mt-4">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="8">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="atributos-boton-siguiente" data-target-step="10">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 10: Ubicación en sucursales -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-producto-ubicacion" data-step-id="ubicacion">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Ubicación en sucursales</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4 w-p-100 max-h-320 overflow-auto custom-scroll" id="contenedor-sectores"></div>
                <div class="flex justify-between mt-4">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="9">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="ubicacion-boton-siguiente" data-target-step="11">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 11: Existencias -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-producto-existencias" data-step-id="existencias">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Existencias</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4 w-p-100 max-h-320 overflow-auto custom-scroll" id="contenedor-existencias"></div>
                <div class="flex justify-between mt-4">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="10">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="existencias-boton-siguiente">Finalizar</button>
                </div>
            </div>
        </div>

    </div>
</form>

<?php
$contenido_protegido = ob_get_clean();

include_once __DIR__ . '/../layouts/protegido.php';
?>
<script src="../../../public/js/components/pages/views/nuevo.producto/tablas.js" defer></script>
<script src="../../../public/js/components/pages/views/nuevo.producto/paginas.js" defer></script>
<script src="../../../public/js/components/pages/views/nuevo.producto/validaciones.js" defer></script>
<script src="../../../public/js/components/pages/views/nuevo.producto/helpers.js" defer></script>
<script src="../../../public/js/ajax/pages/nuevo.producto.js"></script>
<script src="../../../public/js/components/pages/views/nuevo.producto/nuevo.producto.js" defer></script>