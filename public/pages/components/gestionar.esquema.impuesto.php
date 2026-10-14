<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Gestión de esquemas fiscales";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<form class="w-p-100 h-p-100 py-2 flex flex-column" id="form-gestion-esquema-fiscal">
    <div class="w-p-100 flex flex-column js-wizard-container flex-1 min-w-0 ocultar-scroll">

        <!-- Sección 1: Identificación -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card acordeon-item" id="form-esquema-basico">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d acordeon-header cursor-pointer flex items-center justify-between">
                <span>Identificación del esquema</span>
                <i class="vf-ic_fluent_caret_down_24_filled fs-6 icon-flecha acordeon-icon"></i>
            </div>
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body acordeon-panel">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="esquema-input-nombre" class="block mb-1 fs-3 fw-600 pl-2">Nombre del esquema</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="nombre" class="w-p-100 h-40 input-mayus" id="esquema-input-nombre" placeholder="Ej. General 16% + IEPS Refrescos" autocomplete="off" required>
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="impuesto-span-nombre"></span>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex-1 min-h-0 overflow-auto custom-scroll">

            <!-- Sección 2: Tasas Porcentuales (Traslados) -->
            <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card acordeon-item" id="form-esquema-porcentuales">
                <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d acordeon-header cursor-pointer flex items-center justify-between">
                    <span>Tasas porcentuales (Traslados)</span>
                    <i class="vf-ic_fluent_caret_down_24_filled fs-6 icon-flecha acordeon-icon"></i>
                </div>
                <div class="flex-1 min-h-0 my-3 card-body acordeon-panel">
                    <div class="my-3 flex flex-column gap-4">
                        <div class="flex justify-between gap-3">
                            <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                                <label for="select-iva" class="block mb-1 fs-3 fw-600 pl-2">Tasa de I.V.A.</label>
                                <div class="flex items-center gap-2 h-40" id="impuestos-select-iva">
                                    <!-- Aquí se renderiza dinámicamente el custom select de IVA asegurando el name "tasa_iva" si es necesario -->
                                </div>
                            </div>
                            <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1 pl-2">
                                    <label for="esquema-input-ieps" class="block fs-3 fw-600">Tasa I.E.P.S. (Ad-valorem)</label>
                                    <button type="button" class="btn btn-secondary rounded-md flex-center shrink-0" style="padding: 0px; width:15px; height:15px;" id="boton-ayuda-ieps" title="Ayuda">
                                        <i class="vf-ic_fluent_question_24_filled fs-3"></i>
                                    </button>
                                </div>
                                <div class="flex items-center gap-2">
                                    <input type="text" name="tasa_ieps" class="w-p-100 h-40" id="esquema-input-ieps" placeholder="Ej. 8 para 8%" autocomplete="off">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sección 3: Cuotas Fijas IEPS -->
            <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card acordeon-item" id="form-esquema-cuotas">
                <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d acordeon-header cursor-pointer flex items-center justify-between">
                    <span>Cuotas fijas I.E.P.S. (Opcional)</span>
                    <i class="vf-ic_fluent_caret_down_24_filled fs-6 icon-flecha acordeon-icon"></i>
                </div>
                <div class="flex-1 min-h-0 my-3 card-body acordeon-panel" style="display: none;">
                    <div class="my-3 flex flex-column gap-4">
                        <div class="flex justify-between gap-3">
                            <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1 pl-2">
                                    <label for="esquema-input-cuota-litro" class="block fs-3 fw-600">Cuota por litro</label>
                                    <button type="button" class="btn btn-secondary rounded-md flex-center shrink-0" style="padding: 0px; width:15px; height:15px;" id="boton-ayuda-cuota-litro" title="Ayuda">
                                        <i class="vf-ic_fluent_question_24_filled fs-3"></i>
                                    </button>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-30 flex justify-center items-center fw-600 fs-6 text-brand span-moneda">$</span>
                                    <input type="text" name="ieps_cuota_litro" class="w-p-100 h-40" id="esquema-input-cuota-litro" placeholder="Ej. 1.5086" autocomplete="off">
                                </div>
                            </div>
                            <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1 pl-2">
                                    <label for="esquema-input-cuota-unidad" class="block fs-3 fw-600">Cuota por unidad</label>
                                    <button type="button" class="btn btn-secondary rounded-md flex-center shrink-0" style="padding: 0px; width:15px; height:15px;" id="boton-ayuda-cuota-unidad" title="Ayuda">
                                        <i class="vf-ic_fluent_question_24_filled fs-3"></i>
                                    </button>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-30 flex justify-center items-center fw-600 fs-6 text-brand span-moneda">$</span>
                                    <input type="text" name="ieps_cuota_unidad" class="w-p-100 h-40" id="esquema-input-cuota-unidad" placeholder="Ej. 0.5000" autocomplete="off">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sección 4: Retenciones -->
            <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card acordeon-item" id="form-esquema-retenciones">
                <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d acordeon-header cursor-pointer flex items-center justify-between">
                    <span>Retención de impuestos (Opcional)</span>
                    <i class="vf-ic_fluent_caret_down_24_filled fs-6 icon-flecha acordeon-icon"></i>
                </div>
                <div class="flex-1 min-h-0 my-3 card-body acordeon-panel" style="display: none;">
                    <div class="my-3 flex flex-column gap-4">
                        <div class="flex justify-between gap-3">
                            <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1 pl-2">
                                    <label for="esquema-input-ret-isr" class="block fs-3 fw-600">Retención de I.S.R. (%)</label>
                                    <button type="button" class="btn btn-secondary rounded-md flex-center shrink-0" style="padding: 0px; width:15px; height:15px;" id="boton-ayuda-ret-isr" title="Ayuda">
                                        <i class="vf-ic_fluent_question_24_filled fs-3"></i>
                                    </button>
                                </div>
                                <div class="flex items-center gap-2">
                                    <input type="text" name="retencion_isr" value="0" class="w-p-100 h-40" id="esquema-input-ret-isr" placeholder="Ej. 1.25 para 1.25%" autocomplete="off">
                                    <span class="w-30 flex justify-center items-center fw-600 fs-6 text-brand">%</span>
                                </div>
                            </div>
                            <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1 pl-2">
                                    <label for="esquema-input-ret-iva" class="block fs-3 fw-600">Retención de I.V.A. (%)</label>
                                    <button type="button" class="btn btn-secondary rounded-md flex-center shrink-0" style="padding: 0px; width:15px; height:15px;" id="boton-ayuda-ret-iva" title="Ayuda">
                                        <i class="vf-ic_fluent_question_24_filled fs-3"></i>
                                    </button>
                                </div>
                                <div class="flex items-center gap-2">
                                    <input type="text" name="retencion_iva" value="0" class="w-p-100 h-40" id="esquema-input-ret-iva" placeholder="Ej. 10.66 para 10.66%" autocomplete="off">
                                    <span class="w-30 flex justify-center items-center fw-600 fs-6 text-brand">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
    <div class="w-p-100 p-2 flex justify-end items-center">
        <button type="button" class="btn btn-primary fw-600" id="esquema-boton-guardar">Guardar</button>
    </div>
</form>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/componente.php';
?>

<script src="../../../public/js/ajax/components/gestionar.esquema.impuesto.js"></script>
<script src="../../../public/js/components/pages/components/gestionar.esquema.impuesto.js" defer></script>