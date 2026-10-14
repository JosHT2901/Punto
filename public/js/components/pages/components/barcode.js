let html5QrCode = null;
let isScannerRunning = false;
let scannerLock = false;
let currentCameraId = null;

// Estructura HTML original de la interfaz (Selector + Lector) para restauraciones dinámicas
const ESTRUCTURA_ORIGINAL_SCANNER = `
    <div class="flex flex-col gap-2 h-p-100 w-p-100 box-sizing">
        <div class="flex gap-2 items-center shrink-0">
            <div class="flex-1" id="ContenedorSelectCamaraCodeBar">
                <span class="rounded-8 bg-brand-soft p-2 text-brand-blue fw-600 fs-2">Selecciona una cámara</span>
            </div>
            <a class="btn w-35 h-35 btn-secondary rounded-md flex justify-center items-center" id="bar-code-boton-actualizar-camaras" title="Actualizar cámaras">
                <i class="icon vf-ic_fluent_arrow_repeat_all_24_filled h-20 w-20 fs-6"></i>
            </a>
        </div>
        <div class="flex flex-1 flex-col relative overflow-hidden rounded-8 bg-slate-900" id="lector-code-bar"></div>
    </div>
`;

$(document).ready(function () {
    MostrarCargando('Iniciando...', false);
    setTimeout(() => {
        InicializarAccionesInterfaz();
        IniciarScannerCodigoBarras().catch(err => console.error("Fallo inicial del escáner:", err));
    }, 400);
});

/**
 * Escucha eventos de los componentes fijos iniciales
 */
function InicializarAccionesInterfaz() {
    $(document).off('click.actualizarCamaras').on('click.actualizarCamaras', '#bar-code-boton-actualizar-camaras', function (e) {
        e.preventDefault();
        if (!scannerLock) {
            IniciarScannerCodigoBarras().catch(err => console.error("Error al actualizar cámaras:", err));
        }
    });
}

async function IniciarScannerCodigoBarras() {
    const contenedor = "lector-code-bar";

    // Asegurar que el contenedor existe en el DOM antes de instanciar la librería
    if (!$(`#${contenedor}`).length) {
        $("#bar-code-contenedor-principal").html(ESTRUCTURA_ORIGINAL_SCANNER);
        InicializarAccionesInterfaz();
    }

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode(contenedor);
    }

    try {
        // 1. Validar estado de permisos nativos en el navegador
        const status = await checkCameraPermissions();
        if (status === 'denied') {
            OcultarCargando();
            ImprimirMensajeErrorBarCodeScanner('El acceso a la cámara está bloqueado en los ajustes de tu navegador.');
            return;
        }

        // 2. Disparar prompt nativo para asegurar permisos de hardware
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        
        // Liberar el stream de inmediato para que Html5Qrcode tome el control limpio
        stream.getTracks().forEach(track => track.stop());

        // 3. Recuperar lista de lentes disponibles
        const devices = await Html5Qrcode.getCameras();

        if (!devices || devices.length === 0) {
            OcultarCargando();
            ImprimirMensajeErrorBarCodeScanner('No se encontraron cámaras conectadas.');
            return;
        }

        // 4. Match inteligente para priorizar lentes traseras (Corregido el error de sintaxis del índice)
        const backCamera = devices.find(device => {
            const label = device.label.toLowerCase();
            return label.includes('back') || label.includes('trasera') || label.includes('environment');
        });
        
        const selectedId = backCamera ? backCamera.id : devices[devices.length - 1].id;
        currentCameraId = selectedId;

        InsertarSelectCamaras(devices);
        await iniciarEscaneo(selectedId);
        OcultarCargando();
    } catch (err) {
        OcultarCargando();
        manejarErrorCamara(err);
    }
}

async function checkCameraPermissions() {
    try {
        if (navigator.permissions?.query) {
            const result = await navigator.permissions.query({ name: 'camera' });
            return result.state; 
        }
    } catch (e) {
        // Silenciar fallos si el navegador bloquea la consulta de permisos
    }
    return 'prompt';
}

function manejarErrorCamara(err) {
    console.error("Error de Cámara:", err);
    let mensaje = `Error al acceder a la cámara: ${err.message}`;
    
    const erroresComunes = {
        'NotAllowedError': 'Permiso denegado. Activa la cámara en la configuración del navegador o haz clic en el candado de la barra de direcciones.',
        'PermissionDeniedError': 'Permiso denegado. Activa la cámara en la configuración del navegador.',
        'NotFoundError': 'No se detectó ninguna cámara física.',
        'DevicesNotFoundError': 'No se detectó ninguna cámara física.',
        'NotReadableError': 'La cámara ya está siendo usada por otra aplicación, pestaña o proceso del sistema.',
        'TrackStartError': 'No se pudo iniciar la pista de video debido a un conflicto de hardware.'
    };

    if (erroresComunes[err.name]) {
        mensaje = erroresComunes[err.name];
    }
    
    ImprimirMensajeErrorBarCodeScanner(mensaje);
}

async function iniciarEscaneo(cameraId) {
    if (scannerLock) return;
    scannerLock = true;

    try {
        if (isScannerRunning && html5QrCode) {
            await html5QrCode.stop();
            isScannerRunning = false;
        }

        currentCameraId = cameraId;

        const config = {
            fps: 15,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
            videoConstraints: {
                deviceId: { exact: cameraId }
            }
        };

        await html5QrCode.start(
            cameraId,
            config,
            (decodedText) => onBarcodeSuccess(decodedText),
            () => {} // Callback silencioso de fallos por frame
        );

        isScannerRunning = true;
        $(".mensaje-error-barcode").remove(); 

        // Forzar propiedades CSS fluidas en la etiqueta de video inyectada
        $(`#lector-code-bar video`).css({
            "width": "100%", 
            "height": "100%", 
            "object-fit": "cover",
            "border-radius": "8px"
        });

    } catch (err) {
        manejarErrorCamara(err);
    } finally {
        scannerLock = false;
    }
}

function onBarcodeSuccess(decodedText) {
    if (!isScannerRunning) return;
    isScannerRunning = false;

    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop()
            .then(() => {
                $(".mensaje-error-barcode").remove();
                $.messenger.send(window.parent, 'BARCODE_SCANNED', decodedText);
            })
            .catch(err => {
                console.warn("Fallo controlado al detener la cámara:", err);
                $.messenger.send(window.parent, 'BARCODE_SCANNED', decodedText);
            });
    } else {
        $.messenger.send(window.parent, 'BARCODE_SCANNED', decodedText);
    }
}

function InsertarSelectCamaras(devices) {
    const $contenedor =$("#ContenedorSelectCamaraCodeBar");
    if (!$contenedor.length) return;

    $contenedor.empty();

    const opciones = devices.map((device, index) => ({
        value: device.id,
        text: device.label || `Cámara ${index + 1}`,
        selected: device.id === currentCameraId
    }));

    InsertarCustomSelect({
        contenedor: '#ContenedorSelectCamaraCodeBar',
        id: 'select-camara',
        placeholder: 'Selecciona una cámara',
        opciones: opciones,
        buscador: false,
        onChange: (cameraId) => {
            if (cameraId && cameraId !== currentCameraId && !scannerLock) {
                iniciarEscaneo(cameraId);
            }
        }
    });
}

function ImprimirMensajeErrorBarCodeScanner(texto) {
    const componenteError = Contenedor_Con_Imagen('camera.png', texto, 'h-p-100', 'h-100', true);
    const $contenedorPrincipal =$("#bar-code-contenedor-principal");
    
    $contenedorPrincipal.html(componenteError);

    $contenedorPrincipal.find('.btn-reintentar, button').attr('onclick', '').off('click').on('click', function (e) {
        e.preventDefault();
        $contenedorPrincipal.html(ESTRUCTURA_ORIGINAL_SCANNER);
        InicializarAccionesInterfaz();
        IniciarScannerCodigoBarras().catch(err => console.error("Error al reintentar flujo:", err));
    });
}