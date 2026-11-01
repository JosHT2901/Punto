$(document).ready(async function () {
    await Cargar_Informacion_Inicial();
});

async function Cargar_Informacion_Inicial() {
    try {
        MostrarCargando('Obteniendo información...',false)
        const [regimenes, empresaRes, localidades] = await Promise.all([
            CargarJSON('../../../src/json/data/regimenes.json').catch(err => {
                console.error("Error al cargar regimenes.json:", err);
                return [];
            }),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', {
                accion: 'obtener_informacion_empresa'
            }).catch(err => {
                console.error("Error al obtener información de la empresa:", err);
                return { data: { empresa: null } };
            }),
            CargarJSON('../../../src/json/data/localidades.json').catch(err => {
                console.error("Error al cargar localidades.json:", err);
                return [];
            })
        ]);

        // Asignación limpia y estructurada al ámbito global de window
        window.regimenesFiscales = Array.isArray(regimenes) ? regimenes : [];
        window.empresaData = empresaRes?.data?.empresa || empresaRes?.data || {};
        window.localidades = Array.isArray(localidades) ? localidades : [];

        console.log("Información inicial de empresa, regímenes y localidades cargada correctamente.");
        
        // Disparamos el evento indicando que los datos están listos para la UI
        $(document).trigger('datosListos.gestionEmpresa', [window.empresaData, window.regimenesFiscales, window.localidades]);

        return {
            regimenes: window.regimenesFiscales,
            empresa: window.empresaData,
            localidades: window.localidades
        };

    } catch (error) {
        console.error("Error crítico en Cargar_Informacion_Inicial:", error);
        MostrarMensaje('Ocurrió un error al cargar la información...',false,false,false)
        window.regimenesFiscales = [];
        window.empresaData = {};
        window.localidades = [];
    }
}

async function Guardar_Gestion_Empresa(datosEmpresa) {
    MostrarCargando('Procesando información...',false)
    window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', datosEmpresa)
            .then(respuesta => {
                OcultarCargando()
                if (respuesta && respuesta.ok) {
                    MostrarMensaje(respuesta.mensaje,true,false,true);
                    if (window.empresaData) {
                        Object.assign(window.empresaData, datosEmpresa);
                        Iniciar_Pagina_Empresa()
                        setTimeout(() => {
                            ModalAPI.cerrar()
                        }, 1000);
                    }
                } else {
                    MostrarAlerta(respuesta?.mensaje || 'Ocurrió un error al guardar la información', 250);
                }
            })
            .catch(error => {
                console.error("Error crítico al guardar la empresa:", error);
                OcultarCargando()
                MostrarAlerta('Error de conexión al intentar guardar la información', 250);
            }); 
}