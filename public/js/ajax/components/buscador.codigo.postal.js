// 1. Limpiamos la suscripción previa de messenger para evitar duplicados
$.messenger.off('codigo_postal');

$.messenger.on('codigo_postal', function (data, sourceWindow, origin) {
    const localidadesRecibidas = data && data.localidades ? data.localidades : [];

    if (Array.isArray(localidadesRecibidas) && localidadesRecibidas.length > 0) {
        console.log("Total de localidades procesadas:", localidadesRecibidas.length);
        
        const estados = ObtenerEstados(localidadesRecibidas);
        
        // Variables para almacenar la selección actual del usuario
        let estadoSeleccionadoNombre = '';
        let municipioSeleccionadoNombre = '';
        let localidadSeleccionadaObjeto = null;
        
        // Limpiamos contenedor principal
        $('#buscador-codigo-postal-contenedor-select-estado').empty();
        
        InsertarCustomSelect({
            contenedor: '#buscador-codigo-postal-contenedor-select-estado',
            id: 'select-estado',
            placeholder: 'Selecciona un estado',
            buscador: true,
            disabled: false,
            opciones: estados.map(item => ({ value: item.clave, text: item.estado })),
            onChange: function(claveEstado) {
                // Guardamos el nombre del estado seleccionado
                const estObj = estados.find(e => e.clave == claveEstado);
                estadoSeleccionadoNombre = estObj ? estObj.estado : '';
                municipioSeleccionadoNombre = '';
                localidadSeleccionadaObjeto = null;

                // Vaciamos contenedores inferiores
                $('#buscador-codigo-postal-contenedor-select-municipio').empty();
                $('#buscador-codigo-postal-contenedor-select-localidad').empty();
                $('#buscador-codigo-postal-encontrado').empty();

                // Obtenemos los municipios del nuevo estado
                const municipios = ObtenerMunicipiosPorEstado(localidadesRecibidas, claveEstado);
                
                InsertarCustomSelect({
                    contenedor: '#buscador-codigo-postal-contenedor-select-municipio',
                    id: 'select-municipio',
                    placeholder: 'Selecciona un municipio',
                    opciones: municipios.map(m => ({ value: m.municipio, text: m.municipio })),
                    buscador: true,
                    disabled: false,
                    onChange: function (municipioNombre) {
                        // Guardamos el municipio seleccionado
                        municipioSeleccionadoNombre = municipioNombre;
                        localidadSeleccionadaObjeto = null;

                        // Limpiamos localidad y resultado previo
                        $('#buscador-codigo-postal-contenedor-select-localidad').empty();
                        $('#buscador-codigo-postal-encontrado').empty();

                        const localidadesFiltradas = ObtenerLocalidadesPorMunicipio(localidadesRecibidas, municipioNombre);
                        
                        InsertarCustomSelect({
                            contenedor: '#buscador-codigo-postal-contenedor-select-localidad',
                            id: 'buscar-codigo-postal-select-localidad',
                            placeholder: 'Selecciona una localidad',
                            opciones: localidadesFiltradas.map((item, index) => ({
                                value: index,           
                                text: item.localidad    
                            })),
                            buscador: true,
                            disabled: false,
                            onChange: function (indexSeleccionado) {
                                localidadSeleccionadaObjeto = localidadesFiltradas[indexSeleccionado];
                                
                                if (localidadSeleccionadaObjeto) {
                                    // Pintamos la estructura HTML en el contenedor correspondiente
                                    $('#buscador-codigo-postal-encontrado').html(`
                                        <div class="flex justify-start items-center fw-700 fs-8 flex-1 px-3">
                                            <span id="buscador-codigo-postal-span-codigo">${localidadSeleccionadaObjeto.codigo}</span>
                                        </div>
                                        <div class="flex">
                                            <button type="button" class="btn btn-secondary js-wizard-next fw-600" data-target-step="3" id="crear-cliente-identidad-boton-siguiente">Enviar</button>
                                        </div>
                                    `);
                                }
                            }
                        });
                    }
                });
            }
        });

        // 2. Registramos el evento de clic dentro del contexto para tener acceso a los nombres seleccionados
        $(document).off('click', '#crear-cliente-identidad-boton-siguiente').on('click', '#crear-cliente-identidad-boton-siguiente', function(e) {
            e.preventDefault();
            
            const codigoPostalSeleccionado = $('#buscador-codigo-postal-span-codigo').text().trim();

            if (codigoPostalSeleccionado && localidadSeleccionadaObjeto) {
                console.log("Enviando datos completos de ubicación al padre...");
                
                $.messenger.send(
                    window.parent,
                    'resultado_codigo_postal',
                    { 
                        codigo: codigoPostalSeleccionado,
                        estado: estadoSeleccionadoNombre,
                        municipio: municipioSeleccionadoNombre,
                        localidad: localidadSeleccionadaObjeto.localidad
                    },
                    '*'
                );
            } else {
                console.warn("Faltan datos por seleccionar o no hay código postal.");
            }
        });

    } else {
        console.warn("No se encontraron localidades en la carga útil recibida.");
    }
});

