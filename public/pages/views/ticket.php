<?php
$tituloPage = 'Ticket';

/* ---------- Helpers para no repetir markup (sin configuración: valores fijos) ---------- */
if (!function_exists('ticketToggle')) {
    function ticketToggle(string $name, string $label, bool $checked = false): void
    {
        $attr = $checked ? 'checked' : '';
        $labelEsc = htmlspecialchars($label);
        echo <<<HTML
        <div class="w-p-100 flex justify-between items-center bg-white my-2 p-2 px-3 rounded-8">
            <div class="fw-600 flex justify-start items-center"><span>{$labelEsc}</span></div>
            <div class="flex justify-center items-center w-50">
                <label class="toggle-switch pointer">
                    <input type="checkbox" class="atributo-toggle atributo-valor" name="{$name}" aria-label="{$labelEsc}" {$attr}>
                    <div class="toggle-switch-background"><div class="toggle-switch-handle"></div></div>
                </label>
            </div>
        </div>
HTML;
    }
}

if (!function_exists('ticketAlineacion')) {
    function ticketAlineacion(string $name, string $actual): void
    {
        $opciones = [
            ['id' => 'left',   'icon' => 'vf-ic_fluent_text_align_left_24_filled',   'label' => 'Izquierda'],
            ['id' => 'center', 'icon' => 'vf-ic_fluent_text_align_center_24_filled', 'label' => 'Centro'],
            ['id' => 'right',  'icon' => 'vf-ic_fluent_text_align_right_24_filled',  'label' => 'Derecha'],
        ];
        echo '<div class="flex-1 flex justify-between items-center gap-2">';
        foreach ($opciones as $op) {
            $on = ($actual === $op['id']);
            echo '<label class="flex-1 h-40 flex justify-center items-center gap-2 px-3 rounded-md btn btn-option fw-600 cursor-pointer ' . ($on ? 'active' : '') . '" title="' . $op['label'] . '">'
                . '<input type="radio" name="' . $name . '" value="' . $op['id'] . '" class="checkbox-round" aria-label="' . $op['label'] . '" ' . ($on ? 'checked' : '') . '>'
                . '<i class="fs-8 ' . $op['icon'] . '"></i>'
                . '</label>';
        }
        echo '</div>';
    }
}

if (!function_exists('ticketBloqueTexto')) {
    function ticketBloqueTexto(string $titulo, string $nameAlineacion, string $nameTexto, string $labelTexto, string $alineacion, string $texto = ''): void
    {
        echo '<div class="w-p-100 flex justify-between items-center bg-white my-2 p-3 px-3 rounded-8 flex-column">'
            . '<div class="flex justify-start items-center w-p-100 fw-600 mb-2"><span class="text-left w-p-100">' . htmlspecialchars($titulo) . '</span></div>'
            . '<div class="w-p-100 flex row-gap-2 flex-column">'
            . '<div class="my-2 flex flex-column"><div class="w-p-100 fw-600 fs-2 flex justify-start items-center mb-2"><span>Alineación</span></div>';
        ticketAlineacion($nameAlineacion, $alineacion);
        echo '</div>'
            . '<div class="my-2 flex flex-column"><div class="w-p-100 fw-600 fs-2 flex justify-start items-center mb-2"><span>' . htmlspecialchars($labelTexto) . '</span></div>'
            . '<div class="flex-1 flex justify-between items-center">'
            . '<textarea class="input w-p-100" style="resize: none; min-height: 80px;" maxlength="200" name="' . $nameTexto . '" aria-label="' . htmlspecialchars($labelTexto) . '">' . htmlspecialchars($texto) . '</textarea>'
            . '</div></div></div></div>';
    }
}

ob_start();
?>

<style>
    /* Vista previa moderna del ticket. Todo en em para que escale con el tamaño de fuente. */
    .tk-wrap { --tk-bg: #eef0f3; width: 400px; max-height: 100%; flex-shrink: 0; overflow: auto; padding: 24px 16px; background: var(--tk-bg); border-radius: 12px; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; }
    .tk { --ink: #14181f; --muted: #6b7280; --line: #e5e7eb; --soft: #f5f6f8;
          width: 350px; min-height: 540px; flex-shrink: 0; box-sizing: border-box; background: #fff; color: var(--ink);
          font-family: 'Plus Jakarta Sans', Montserrat, system-ui, sans-serif; font-size: 9.5pt; line-height: 1.4;
          border-radius: 20px; padding: 24px 22px; box-shadow: 0 1px 2px rgba(20,24,31,.06), 0 12px 32px rgba(20,24,31,.10);
          font-variant-numeric: tabular-nums; }
    .tk * { box-sizing: border-box; }
    .tk-brand { text-align: center; padding-bottom: 1.2em; }
    .tk-logo { width: 3.4em; height: 3.4em; margin: 0 auto .8em; border-radius: 1.1em; background: var(--ink); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.4em; }
    .tk-name { font-size: 1.5em; font-weight: 700; letter-spacing: -.01em; }
    .tk-rfc { font-size: .9em; color: var(--muted); margin-top: .2em; }
    .tk-branch { text-align: center; margin-bottom: 1em; }
    .tk-branch b { display: block; font-weight: 600; font-size: 1.05em; }
    .tk-branch span { color: var(--muted); font-size: .9em; }
    .tk-dyn { display: block; width: 100%; color: var(--muted); white-space: pre-wrap; word-break: break-word; }
    .tk-dyn:empty { display: none; }
    .tk-tear { position: relative; height: 0; border-top: 2px dashed var(--line); margin: 1.3em -22px; }
    .tk-tear::before, .tk-tear::after { content: ""; position: absolute; top: -11px; width: 20px; height: 20px; border-radius: 50%; background: var(--tk-bg); }
    .tk-tear::before { left: -10px; } .tk-tear::after { right: -10px; }
    .tk-meta { display: grid; gap: .5em; font-size: .9em; }
    .tk-row { display: flex; justify-content: space-between; gap: 12px; }
    .tk-row > span:first-child { color: var(--muted); }
    .tk-row > span:last-child { font-weight: 600; text-align: right; }
    .tk-items-head { display: flex; justify-content: space-between; color: var(--muted); font-size: .9em; padding-bottom: .6em; border-bottom: 1px solid var(--line); }
    .tk-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: .9em 0; border-bottom: 1px solid var(--soft); }
    .tk-item .n { font-weight: 600; }
    .tk-item .u { color: var(--muted); font-size: .9em; }
    .tk-item .t { font-weight: 700; }
    .tk-sum { display: grid; gap: .5em; color: var(--muted); padding-top: .9em; }
    .tk-sum .tk-row > span:last-child { font-weight: 500; }
    .tk-total { margin-top: .9em; padding: 1em 1.1em; border-radius: 14px; background: var(--ink); color: #fff; display: flex; justify-content: space-between; align-items: baseline; }
    .tk-total span:first-child { font-weight: 600; opacity: .85; }
    .tk-total span:last-child { font-size: 1.9em; font-weight: 800; letter-spacing: -.02em; }
    .tk-foot { margin: 1.4em 0 1.1em; font-weight: 500; }
    .tk-foot .tk-dyn { color: var(--ink); }
    .tk-qr { display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 14px; background: var(--soft); border: 1px solid var(--line); }
    .tk-qr .box { width: 52px; height: 52px; flex-shrink: 0; border-radius: 10px; background: #fff; border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; font-size: 26px; }
    .tk-qr b { display: block; font-weight: 600; }
    .tk-qr span { color: var(--muted); font-size: .9em; }

    /* Botones Vista previa / Ajustes: solo en pantallas pequeñas */
    #contenedor-botones-opciones { display: none !important; }
    /* Se oculta el botón de la vista en la que ya estás */
    #contenedor-botones-opciones button[data-activo="true"] { display: none !important; }
    @media (max-width: 700px) {
        #contenedor-botones-opciones { display: flex !important; }
        #ticket-panel-ajustes { padding-right: 0 !important; }
        #ticket-panel-preview { width: 100%; }
        #ticket-layout[data-vista="ajustes"] #ticket-panel-preview,
        #ticket-layout[data-vista="preview"] #ticket-panel-ajustes { display: none !important; }
    }
</style>

<div class="flex flex-column position-relative overflow-auto custom-scroll p-3 h-p-100">
    <div class="h-40 w-p-100 my-2 flex bg-gray-300 px-2 rounded-8">
        <div class="flex-1 fw-600 fs-3 flex justify-start items-center">
            <span>El diseño final puede variar</span>
        </div>
        <div class="flex justify-center items-center gap-1" id="contenedor-botones-opciones">
            <button type="button" class="btn btn-secondary fw-600 flex items-center gap-1" id="btn-ver-vista-previa">
                <i class="icon vf-ic_fluent_eye_24_filled fs-2"></i>
                <span>Ver vista previa</span>
            </button>
            <button type="button" class="btn btn-secondary fw-600 flex items-center gap-1" id="btn-editar-ajustes" data-activo="true">
                <i class="icon vf-ic_fluent_edit_24_filled fs-2"></i>
                <span>Editar ajustes</span>
            </button>
        </div>
    </div>

    <div class="flex flex-1 overflow-auto" id="ticket-layout" data-vista="ajustes">
        <div class="flex-1 flex flex-column pr-3 overflow-auto custom-scroll" id="ticket-panel-ajustes">

            <!-- Líneas al principio -->
            <div class="w-p-100 flex justify-between items-center bg-white my-2 p-2 px-3 rounded-8">
                <div class="fw-600 flex justify-start items-center"><span>Líneas al principio</span></div>
                <div class="flex justify-center items-center w-60 h-35">
                    <input type="text"  class="input h-p-100 text-center input-number" name="espaciado_inicio" aria-label="Líneas al principio">
                </div>
            </div>

            <!-- Ancho de papel -->
            <div class="w-p-100 flex flex-column justify-between items-center bg-white my-2 p-3 px-3 rounded-8">
                <div class="w-p-100 fw-600 flex justify-start items-center mb-2"><span>Ancho de papel</span></div>
                <div class="w-p-100 flex justify-start items-center gap-3">
                    <label class="flex-1 h-40 flex justify-center items-center gap-2 px-3 rounded-md btn btn-option fw-600 cursor-pointer">
                        <input type="radio" name="tamano_papel" value="58mm" class="checkbox-round">
                        <span class="fs-3">58 mm</span>
                    </label>
                    <label class="flex-1 h-40 flex justify-center items-center gap-2 px-3 rounded-md btn btn-option fw-600 cursor-pointer active">
                        <input type="radio" name="tamano_papel" value="80mm" class="checkbox-round">
                        <span class="fs-3">80 mm</span>
                    </label>
                </div>
            </div>

            <?php ticketToggle('mostrar_logo', 'Mostrar logotipo de la empresa'); ?>

            <?php ticketBloqueTexto('Encabezado', 'alineacion_encabezado', 'encabezado', 'Texto del encabezado', 'left'); ?>

            <?php
            ticketToggle('mostrar_vendedor', 'Mostrar vendedor');
            ticketToggle('mostrar_cliente', 'Mostrar información del cliente');
            ticketToggle('descripcion_completa', 'Descripción completa del producto');
            ticketToggle('mostrar_precio_unitario', 'Mostrar precio unitario');
            ?>

            <?php ticketBloqueTexto('Pie de página', 'alineacion_pie', 'pie', 'Texto del pie de página', 'center'); ?>

            <!-- Líneas al final -->
            <div class="w-p-100 flex justify-between items-center bg-white my-2 p-2 px-3 rounded-8">
                <div class="fw-600 flex justify-start items-center"><span>Líneas al final</span></div>
                <div class="flex justify-center items-center w-60 h-35">
                    <input type="text"  class="input h-p-100 text-center input-number" name="espaciado_final" aria-label="Líneas al final">
                </div>
            </div>

            <!-- Tipografía -->
            <div class="w-p-100 flex flex-column justify-between items-center bg-white my-2 p-3 px-3 rounded-8">
                <div class="fw-600 w-p-100 flex justify-start items-center mb-2"><span>Tipografía y tamaño de fuente</span></div>
                <div class="w-p-100 flex flex-column gap-3 my-3">

                    <div class="flex flex-column">
                        <div class="w-p-100 fw-600 fs-2 flex justify-start items-center mb-1"><span>Familia de fuente</span></div>
                        <select class="input w-p-100" name="font_family" aria-label="Familia de fuente">
                            <option value="Courier New" selected>Courier New (Recomendada para tickets)</option>
                            <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                            <option value="Montserrat">Montserrat</option>
                            <option value="Arial">Arial</option>
                            <option value="Consolas">Consolas</option>
                        </select>
                    </div>

                    <div class="flex flex-column">
                        <div class="w-p-100 fw-600 fs-2 flex justify-start items-center mb-1"><span>Tamaño de fuente (pt)</span></div>
                        <div class="flex items-center gap-2">
                            <input type="text" min="8" max="16" class="input w-100 text-center input-number" name="font_size" aria-label="Tamaño de fuente en puntos">
                            <span class="fs-3 text-gray-500 fw-600">pt</span>
                        </div>
                    </div>

                    <div class="flex flex-column">
                        <div class="w-p-100 fw-600 fs-2 flex justify-start items-center mb-1"><span>Subir fuente</span></div>
                        <div class="flex items-center gap-2 justify-between">
                            <input type="file" id="font-file-input" name="font_file" class="d-none" accept=".ttf,.otf,.woff,.woff2">
                            <button type="button" class="btn btn-secondary fw-600 flex justify-between items-center gap-1" id="btn-subir-fuente">
                                <i class="icon vf-ic_fluent_arrow_up_24_filled fs-2"></i>
                                <span>Subir archivo</span>
                            </button>
                            <div class="flex justify-start items-center fw-700 fs-2 text-brand-blue flex-1 px-2">
                                <span id="font-file-nombre">Sin archivo seleccionado</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- Vista previa del ticket -->
        <div class="tk-wrap custom-scroll" id="ticket-panel-preview">
            <div class="ticket tk" id="ticket-contenedor-vista-preview">

                <div id="ticket-contenedor-linea-inicio" style="display: none;"></div>

                <div class="tk-brand" id="ticket-contenedor-logotipo">
                    <div class="tk-logo"><i class="icon vf-ic_fluent_receipt_24_filled"></i></div>
                    <div class="tk-name">Nombre de la empresa</div>
                    <div class="tk-rfc">RFC: XAXX010101000</div>
                </div>

                <div class="tk-branch">
                    <b>Sucursal Matriz</b>
                    <span>Domicilio de la empresa y sucursal</span>
                </div>

                <div style="margin-bottom: .8em;">
                    <span id="ticket-span-encabezado" class="tk-dyn"></span>
                </div>

                <div class="tk-tear"></div>

                <div class="tk-meta">
                    <div class="tk-row"><span>Operación</span><span>#POS-2026-99</span></div>
                    <div class="tk-row"><span>Fecha</span><span>11/11/2026 19:25</span></div>
                    <div class="tk-row" id="ticket-contenedor-informacion-vendedor"><span>Cajero</span><span>Información del vendedor</span></div>
                    <div class="tk-row" id="ticket-contenedor-informacion-cliente" style="display: none;"><span>Cliente</span><span>Información del cliente</span></div>
                </div>

                <div class="tk-tear"></div>

                <div class="tk-items-head"><span>Concepto</span><span>Total</span></div>
                <div class="tk-item">
                    <div>
                        <div class="n">1x Producto de Ejemplo</div>
                        <div class="u" id="ticket-item-descripcion" style="display: none;">Descripción completa del producto de ejemplo</div>
                        <div class="u" id="ticket-item-precio-unitario">$45.00 unitario</div>
                    </div>
                    <div class="t">$45.00</div>
                </div>

                <div class="tk-sum">
                    <div class="tk-row"><span>Subtotal</span><span>$38.79</span></div>
                    <div class="tk-row"><span>IVA (16%)</span><span>$6.21</span></div>
                </div>
                <div class="tk-total"><span>Total a pagar</span><span>$45.00</span></div>

                <div class="tk-foot">
                    <span id="ticket-span-pie" class="tk-dyn">¡Gracias por su compra!</span>
                </div>

                <div class="tk-qr">
                    <div class="box"><i class="icon vf-ic_fluent_qr_code_24_filled"></i></div>
                    <div>
                        <b>Ticket digital</b>
                        <span>Escanea para ver tu factura</span>
                    </div>
                </div>

                <div id="ticket-contenedor-linea-final" style="display: none;"></div>
            </div>
        </div>
    </div>
</div>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/protegido.boton.guardar.php';
?>
<script src="../../../public/js/ajax/pages/ticket.js" defer></script>
<script src="../../../public/js/components/pages/views/ticket.js" defer></script>