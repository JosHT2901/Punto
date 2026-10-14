function ObtenerEstados(localidades) {
    const mapa = new Map();
    localidades.forEach(item => {
        if (item.Clave_Estado && !mapa.has(item.Clave_Estado)) {
            mapa.set(item.Clave_Estado, { clave: item.Clave_Estado, estado: item.Estado });
        }
    });
    return Array.from(mapa.values()).sort((a, b) => a.estado.localeCompare(b.estado));
}

function ObtenerMunicipiosPorEstado(localidades, claveEstado) {
    const claveBusqueda = String(claveEstado);
    const municipiosUnicos = new Set();
    const resultado = [];

    for (let i = 0; i < localidades.length; i++) {
        const item = localidades[i];
        
        if (String(item.Clave_Estado) === claveBusqueda && item.Municipio && !municipiosUnicos.has(item.Municipio)) {
            municipiosUnicos.add(item.Municipio);
            resultado.push({
                clave: item.Clave_Municipio || item.Municipio, 
                municipio: item.Municipio
            });
        }
    }

    return resultado.sort((a, b) => a.municipio.localeCompare(b.municipio));
}

function ObtenerLocalidadesPorMunicipio(localidades, municipioNombre) {
    const muniNormalizado = String(municipioNombre).toLowerCase().trim();
    const keys = new Set();
    const resultado = [];

    for (let i = 0; i < localidades.length; i++) {
        const item = localidades[i];

        if (item.Municipio && String(item.Municipio).toLowerCase().trim() === muniNormalizado) {
            const localidadNombre = item.Localidad || '';
            const codigoPostal = item.Codigo || '';
            const key = `${localidadNombre}-${codigoPostal}`;

            if (!keys.has(key)) {
                keys.add(key);
                resultado.push({ 
                    localidad: localidadNombre, 
                    codigo: codigoPostal 
                });
            }
        }
    }

    return resultado.sort((a, b) => a.localidad.localeCompare(b.localidad));
}