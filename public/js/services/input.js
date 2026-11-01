/**
 * Servicio Centralizado para Validación, Restricción y Formato de Inputs
 */
const InputService = {

    /**
     * Limita la cantidad máxima de caracteres permitidos en un input
     */
    maxLength(selector, max) {
        $(document).on('input.inputServiceMax', selector, function () {
            if (this.value.length > max) {
                this.value = this.value.substring(0, max);
            }
        });
    },

    /**
     * Permite únicamente letras (incluye acentos y ñ) y espacios
     */
    soloLetras(selector) {
        $(document).on('input.inputServiceLetras', selector, function () {
            const $el = $(this);
            const valor = $el.val();
            const filtrado = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            if (valor !== filtrado) {
                $el.val(filtrado);
            }
        });
    },

    /**
     * Permite solo números enteros
     */
    soloNumeros(selector, placeholder = '0', textAlign = 'right') {
        const $el = $(selector);
        $el.attr({
            'inputmode': 'numeric',
            'pattern': '[0-9]*',
            'autocomplete': 'off',
            'placeholder': placeholder
        }).css('text-align', textAlign);

        $(document).on('input.inputServiceNumeros', selector, function () {
            let valor = $(this).val().replace(/[^0-9]/g, '');
            if (valor.length > 1 && valor.startsWith('0')) {
                valor = parseInt(valor, 10).toString();
            }
            $(this).val(valor);
        });
    },

    /**
     * Permite números con decimales controlados y formato visual automático
     */
    numerosDecimales(selector, decimales = 2, textAlign = 'right', placeholderManual = '') {
        const $input = $(selector);
        const placeholderFinal = placeholderManual || (decimales > 0 ? '0.' + '0'.repeat(decimales) : '0');

        $input
            .attr({
                'inputmode': 'decimal',
                'placeholder': placeholderFinal,
                'maxlength': decimales > 0 ? 7 + decimales : 6 // Opcional: 6 enteros + 1 punto + decimales
            })
            .css('text-align', textAlign);

        $(document).on('focus.inputServiceDec', selector, function () {
            $(this).val($(this).val().replace(/,/g, ''));
        });

        $(document).on('input.inputServiceDec', selector, function () {
            let valor = $(this).val().replace(/,/g, '').replace(/[^0-9.]/g, '');
            const partes = valor.split('.');

            // 1. Limitar la parte entera a máximo 6 dígitos
            if (partes[0].length > 6) {
                partes[0] = partes[0].substring(0, 6);
            }

            // 2. Manejar múltiples puntos decimales
            if (partes.length > 2) {
                valor = partes[0] + '.' + partes.slice(1).join('');
            } else if (partes.length === 2) {
                // 3. Limitar los decimales según el parámetro recibido
                let parteDecimal = partes[1];
                if (decimales > 0) {
                    parteDecimal = parteDecimal.substring(0, decimales);
                }
                valor = partes[0] + '.' + parteDecimal;
            } else {
                valor = partes[0];
            }

            $(this).val(valor);
        });

        $(document).on('blur.inputServiceDec', selector, function () {
            let valor = $(this).val();
            if (valor.endsWith('.')) valor = valor.slice(0, -1);
            $(this).val(InputService.formatearNumero(valor, decimales));
        });
    },
    /**
     * Permite solo letras y números, sin espacios ni símbolos
     */
    alfanumerico(selector) {
        $(document).on('input.inputServiceAlfa', selector, function () {
            const $el = $(this);
            const valor = $el.val();
            const filtrado = valor.replace(/[^a-zA-Z0-9]/g, '');
            if (valor !== filtrado) {
                $el.val(filtrado);
            }
        });
    },

    /**
     * Permite letras, números y guiones medios
     */
    alfanumericoGuiones(selector) {
        $(document).on('input.inputServiceAlfaGuiones', selector, function () {
            const $el = $(this);
            const valor = $el.val();
            const filtrado = valor.replace(/[^a-zA-Z0-9-]/g, '');
            if (valor !== filtrado) {
                $el.val(filtrado);
            }
        });
    },

    alfanumericoConEspacios(selector) {
        $(document).on('input.inputServiceAlfaEspacios', selector, function () {
            const $el = $(this);
            let valor = $el.val();
            // 💡 Se añadieron á, é, í, ó, ú, Á, É, Í, Ó, Ú, ñ y Ñ
            let filtrado = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g, '').replace(/ {2,}/g, ' ');
            if (filtrado.startsWith(' ')) {
                filtrado = filtrado.trimStart();
            }
            if (valor !== filtrado) {
                $el.val(filtrado);
            }
        });
    },

    /**
     * Convierte todo el texto del input a MAYÚSCULAS en tiempo real
     */
    aMayusculas(selector) {
        $(document).on('input.inputServiceMayus', selector, function () {
            const $el = $(this);
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const valor = $el.val().toUpperCase();
            if ($el.val() !== valor) {
                $el.val(valor);
                this.setSelectionRange(start, end);
            }
        });
    },

    /**
     * Fuerza el texto a minúsculas manteniendo la posición del cursor
     */
    aMinusculas(selector) {
        $(document).on('input.inputServiceMinus blur.inputServiceMinus', selector, function(e) {
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const valor = this.value.toLowerCase();
            if (this.value !== valor) {
                this.value = valor;
                if (e.type === 'input') this.setSelectionRange(start, end);
            }
        });
    },

    /**
     * Da formato tipo "Título" (Primera letra de cada palabra en mayúscula)
     */
    formatoTipoOperacion(selector) {
        const formatTitle = (val) => val.split(' ').map(word => {
            if (!word) return '';
            return word[0].toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');

        $(document).on('input.inputServiceTitle blur.inputServiceTitle', selector, function(e) {
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const valor = formatTitle(this.value);
            if (this.value !== valor) {
                this.value = valor;
                if (e.type === 'input') this.setSelectionRange(start, end);
            }
        });
    },

    /**
     * Formato especial para correos electrónicos (sin espacios, minúsculas, caracteres válidos)
     */
    correo(selector) {
        $(document).on('input.inputServiceEmail', selector, function() {
            const $el = $(this);
            let valor = $el.val();
            let filtrado = valor.replace(/\s/g, '').replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase();
            if (valor !== filtrado) {
                $el.val(filtrado);
            }
        });
    },

    /**
     * Permite solo letras con espacios (incluye acentos)
     */
    soloLetrasConEspacios(selector) {
        $(document).on('input.inputServiceLetrasEsp', selector, function () {
            const $el = $(this);
            let valor = $el.val();
            let filtrado = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '').replace(/\s{2,}/g, ' ');
            if (valor !== filtrado) {
                $el.val(filtrado);
            }
        });
    },

    /**
     * Permite letras, espacios y puntos
     */
    soloLetrasEspaciosYPuntos(selector) {
        $(document).on('input.inputServiceLetrasPtos', selector, function () {
            const $el = $(this);
            let valor = $el.val();
            let filtrado = valor
                .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ. ]/g, '')
                .replace(/\s{2,}/g, ' ')
                .replace(/\.{2,}/g, '.')
                .replace(/^\./, '');
            if (valor !== filtrado) {
                $el.val(filtrado);
            }
        });
    },

    /**
     * Formato inteligente para Razón Social (Manejo de conectores y siglas)
     */
    formatoRazonSocial(selector) {
        const conectoresMinuscula = ['de', 'y', 'la', 'las', 'el', 'los', 'del'];
    
        $(document).on('input.inputServiceRazon', selector, function () {
            const cursor = this.selectionStart;
            let valor = this.value;
    
            // Se agregó [0-9] para permitir números dentro de la razón social
            valor = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9. ]/g, '').replace(/\s{2,}/g, ' ');
            
            valor = valor.split(' ').map((palabra, index) => {
                if (!palabra) return '';
                // Si la palabra es un número o siglas con puntos (ej. S.A. de C.V.), la respetamos
                if (/^\d+$/.test(palabra) || /^([A-Z]\.)+$/.test(palabra.toUpperCase())) {
                    return palabra.toUpperCase();
                }
                const lower = palabra.toLowerCase();
                if (index !== 0 && conectoresMinuscula.includes(lower)) {
                    return lower;
                }
                return lower.charAt(0).toUpperCase() + lower.slice(1);
            }).join(' ');
    
            this.value = valor;
            this.setSelectionRange(cursor, cursor);
        });
    
        $(document).on('blur.inputServiceRazon', selector, function () {
            this.value = this.value.trim();
        });
    },

    /**
     * Inicializa validación en tiempo real para un input web general
     */
    web(selector) {
        $(document).on('input.inputServiceWeb', selector, function () {
            const $el = $(this);
            let valor = $el.val();
            const valorFiltrado = valor.replace(/[^a-zA-Z0-9\s\.\,\-\_\@\#]/g, '');
            if (valor !== valorFiltrado) {
                $el.val(valorFiltrado);
            }
            $el.toggleClass('input-invalid', valorFiltrado.trim() === '');
        });
    },

    /**
     * Valida un input de teléfono inicializado con International Telephone Input (ITI)
     */
    validarTelefonoITI(selector, mensaje = 'Número de teléfono inválido') {
        const $input = $(selector);
        
        $input.off('blur.inputServiceITI').on('blur.inputServiceITI', function () {
            const iti = $input.data('iti');
            if (iti) iti.isValidNumber();
        });

        return function () {
            const iti = $input.data('iti');
            if (!iti) return { valido: false, mensaje: 'Input no inicializado' };
            const valor = $input.val().trim();
            if (!valor) return { valido: false, mensaje: mensaje };
            
            return iti.isValidNumber() 
                ? { valido: true, mensaje: '' } 
                : { valido: false, mensaje: mensaje };
        };
    },

    /**
     * Permite solo letras, números, guiones, slash y espacios con límite de letras consecutivas
     */
    numeroCalle(selector) {
        $(document).on('input.inputServiceCalle', selector, function () {
            const start = this.selectionStart;
            const longitudOriginal = this.value.length;
            let valor = $(this).val();

            valor = valor.replace(/[^0-9A-Za-zÑñáéíóúÁÉÍÓÚ\-\/ ]+/g, '');
            valor = valor.replace(/ {2,}/g, ' ');
            valor = valor.toUpperCase();
            valor = valor.replace(/([A-ZÑÁÉÍÓÚ]{2})[A-ZÑÁÉÍÓÚ]+/g, '$1');

            $(this).val(valor);

            const longitudNueva = valor.length;
            const ajusteCursor = start - (longitudOriginal - longitudNueva);
            this.setSelectionRange(ajusteCursor, ajusteCursor);
        });
    },

    /**
     * Permite cualquier carácter excepto espacios en blanco
     */
    sinEspacios(selector) {
        $(document).on('input.inputServiceSinEsp', selector, function () {
            const $el = $(this);
            const valor = $el.val();
            const filtrado = valor.replace(/\s/g, '');
            if (valor !== filtrado) {
                $el.val(filtrado);
            }
        });
    },

    /**
     * Convierte un string base64 a Blob
     */
    base64ToBlob(base64) {
        if (!base64 || !base64.includes(';base64,')) return null;
        const partes = base64.split(';base64,');
        const tipoMime = partes[0].split(':')[1];
        const decodificado = window.atob(partes[1]);
        const longitud = decodificado.length;
        const buffer = new Uint8Array(longitud);

        for (let i = 0; i < longitud; i++) {
            buffer[i] = decodificado.charCodeAt(i);
        }

        return new Blob([buffer], { type: tipoMime });
    },

    /**
     * Formatea un número o string a formato de miles con decimales
     */
    formatearNumero(valor, decimales = 2) {
        if (valor === '' || valor === null || valor === undefined) return '';
        let numero = parseFloat(valor.toString().replace(/,/g, ''));
        if (isNaN(numero)) return valor;

        let partes = numero.toFixed(decimales).split('.');
        partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        
        return partes.join('.');
    }
};