<div class="w-p-100 h-p-100 box-sizing p-2 flex items-center justify-between gap-4 bg-white">

    <!-- 1. Botón Abrir Menú -->
    <div class="flex-center">
        <a class="btn w-40 h-40 btn-secondary rounded-md flex-center mx-auto" id="menu-boton-abrir" title="Menú">
            <i class="vf-ic_fluent_grid_dots_24_filled fs-8"></i>
        </a>
    </div>

    <!-- 2. Información de Sucursal (Ocupa el espacio flexible restante) -->
    <div class="flex-1 min-w-0" id="menu-contenedor-sucursal">
        <div class="contenedor-sucursal-info">
            <div class="w-p-100 flex items-center justify-between bg-gray-200 rounded-md px-3 py-1">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                    <i class="vf-ic_fluent_store_24_regular text-blue-03618d"></i>
                    <span class="texto-truncado fw-700 fs-3 text-blue-03618d">Morelos</span>
                </div>
                <!-- Optimizado con .flex-center y transición -->
                <a class="w-20 h-20 btn btn-ghost rounded-md flex-center transition-all shrink-0" id="menu-boton-cambiar-sucursal" title="Cambiar sucursal">
                    <i class="vf-ic_fluent_chevron_down_24_filled fs-5"></i>
                </a>
            </div>
        </div>
    </div>

    <!-- 3. Acciones de Usuario y Notificaciones -->
    <div class="flex items-center gap-1 shrink-0">
        <!-- Correo con Badge -->
        <a class="btn w-40 h-40 btn-ghost rounded-md flex-center position-relative" title="Correos">
            <i class="fs-8 vf-ic_fluent_mail_24_filled"></i>
            <span id="badge-mail-main"
                class="position-absolute top-0 right-0 bg-danger text-white fw-bold rounded-full flex-center w-18 h-18 fs-0 border-white"
                style="display:none; transform: translate(0%, -5%);">
            </span>
        </a>

        <!-- Alertas con Badge -->
        <a class="btn w-40 h-40 btn-ghost rounded-md flex-center position-relative" id="nuevo-usuario-boton-generar-usuario" title="Alertas">
            <i class="fs-8 vf-ic_fluent_alert_24_filled"></i>
            <span id="badge-mensajes-main"
                class="position-absolute top-0 right-0 bg-danger text-white fw-bold rounded-full flex-center w-18 h-18 fs-0 border-white"
                style="display:none; transform: translate(0%, -5%);">
                0
            </span>
        </a>
    </div>

    <div class="flex-center shrink-0 px-2">
        <a class="w-40 h-40 rounded-3xl btn btn-ghost" id="menu-boton-usuario"></a>
    </div>

</div>