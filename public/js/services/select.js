/*************************************************
 * CUSTOM SELECT - MOTOR PROFESIONAL (V3.5.2)
 * - Soporte para texto multilínea en opciones
 * - Soporte para limpiar valor con setValue('', '')
 * - Bloqueo/Desbloqueo funcional con pointer-events y opacidad
 *************************************************/
(function () {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'disabled' || mutation.attributeName === 'class') {
                const $target =$(mutation.target);
                const isDisabled = $target.is(':disabled') || $target.hasClass('disabled');$target.toggleClass('disabled', isDisabled);
                if (isDisabled) {
                    $target.css({ 'pointer-events': 'none', 'opacity': '0.6' });
                    closeSelect($target);
                } else {
                    $target.css({ 'pointer-events': 'auto', 'opacity': '1' });
                }
            }
        });
    });

    function ajustarOpcionesIndividualmente($select) {
        const $optionsContainer =$select.find('.custom-select-options');
        if (!$optionsContainer.is(':visible')) return;

        const $opciones = $select.find('.custom-option:visible');$opciones.each(function() {
            const $opt = $(this);$opt.css({ 
                'font-size': '14px', 
                'white-space': 'normal', 
                'word-wrap': 'break-word',
                'overflow': 'visible',
                'text-overflow': 'unset',
                'display': 'block',
                'line-height': '1.4'
            });
        });
    }

    function handleGlobalScroll(e) {
        if ($(e.target).closest('.custom-options-list').length) return;
        closeAll();
    }

    function initCustomSelectEvents() {
        $(document).on('mousedown', '.custom-select-trigger', function (e) {
            const $select =$(this).closest('.custom-select');
            // Verificación estricta de bloqueo
            if ($select.hasClass('disabled') || $select.css('pointer-events') === 'none') return;
            e.preventDefault(); 
            
            const isOpen = $select.hasClass('open');$('.custom-select.open').not($select).each(function() { closeSelect($(this)); });

            if (isOpen) {
                closeSelect($select);
            } else {
                $select.addClass('open');
                const $options = $select.find('.custom-select-options');$options.show().css({ 'display': 'flex', 'flex-direction': 'column' });
                posicionarDropdown($select[0],$options[0]);
                ajustarOpcionesIndividualmente($select);
                window.addEventListener('scroll', handleGlobalScroll, true);

                const $input =$select.find('.custom-select-search-input');
                if ($input.length) { 
                    setTimeout(() => $input.val('').focus(), 50);$select.find('.custom-option').show(); 
                }
            }
        });

        $(document).on('click', '.custom-select-trigger', e => {             e.preventDefault();             e.stopPropagation();         });$(document).on('click', '.custom-select-search', e => {
            e.preventDefault();
            e.stopPropagation();
        });

        $(document).on('input', '.custom-select-search-input', function () {
            const value = $(this).val().toLowerCase().trim();
            const $select =$(this).closest('.custom-select');
            const $opciones = $select.find('.custom-option');$opciones.each(function () {
                const text = $(this).text().toLowerCase();$(this).toggle(text.indexOf(value) > -1);
            });
            
            clearTimeout(this.t);
            this.t = setTimeout(() => ajustarOpcionesIndividualmente($select), 50);
        });

        $(document).on('click', '.custom-option', function (e) {
            const $el =$(this);
            const $select =$el.closest('.custom-select');
            if ($select.hasClass('disabled') || $select.css('pointer-events') === 'none') return;
            e.stopPropagation();
            
            const value = $el.data('value');
            const text = $el.text().trim();
            
            setValue($select, value, text);
            closeSelect($select);$select.focus();
            
            setTimeout(() => {
                const event = $.Event('keydown', { 
                    which: 13, 
                    keyCode: 13, 
                    isTrigger: true 
                });
                $select.trigger(event);$select.trigger('change');
            }, 60);

            const callback = $select.data('onchange');
            if (typeof callback === 'function') callback(value);
        });

        $(document).on('click', e => {
            if (!$(e.target).closest('.custom-select').length) closeAll();
        });
    }

    function posicionarDropdown(selectEl, optionsEl) {
        const trigger = selectEl.querySelector('.custom-select-trigger');
        const rect = trigger.getBoundingClientRect();
        const margen = 8;
        const $list =$(optionsEl).find('.custom-options-list');
        const $search =$(optionsEl).find('.custom-select-search');

        Object.assign(optionsEl.style, {
            position: 'fixed',
            left: rect.left + 'px',
            width: rect.width + 'px',
            zIndex: '99999'
        });
        
        const espacioAbajo = window.innerHeight - rect.bottom - margen - 15;
        const espacioArriba = rect.top - margen - 15;
        const abreAbajo = (espacioAbajo >= 250 || espacioAbajo >= espacioArriba);
        const hMax = abreAbajo ? espacioAbajo : espacioArriba;

        if (abreAbajo) {
            optionsEl.style.top = rect.bottom + margen + 'px';
            optionsEl.style.bottom = 'auto';
        } else {
            optionsEl.style.bottom = (window.innerHeight - rect.top) + margen + 'px';
            optionsEl.style.top = 'auto';
        }

        optionsEl.style.maxHeight = hMax + 'px';
        const searchH = $search.length ? $search.outerHeight() : 0;
        $list.css({ 'max-height': (hMax - searchH) + 'px', 'overflow-y': 'auto' });
    }

    function setValue($select, value, text) {
        if (value === '' || value === null || value === undefined) {
            const placeholder = $select.attr('data-placeholder') || 'Selecciona...';
            $select.attr('data-value', '');$select.find('.custom-select-text').text(placeholder).addClass('placeholder').css({ 
                'white-space': 'nowrap', 
                'overflow': 'hidden', 
                'text-overflow': 'ellipsis' 
            });
            $select.find('.custom-select-trigger').css({ 'height': '100\%', 'min-height': '100\%' });$select.find('.custom-option').removeClass('active');
            return;
        }

        $select.attr('data-value', String(value));
        $select.find('.custom-select-text').text(text).removeClass('placeholder').css({              'white-space': 'normal',              'overflow': 'visible',              'text-overflow': 'unset'          });$select.find('.custom-select-trigger').css({ 'height': '100%', 'min-height': '100%' });

        $select.find('.custom-option').removeClass('active').filter(function() {
            return String($(this).data('value')) === String(value);
        }).addClass('active');
    }

    function closeSelect($select) {$select.removeClass('open').find('.custom-select-options').hide();
        if ($('.custom-select.open').length === 0) {
            window.removeEventListener('scroll', handleGlobalScroll, true);
        }
    }

    function closeAll() {
        $('.custom-select.open').each(function () { closeSelect($(this)); });
    }

    window.CustomSelect = {
        getValue(selector) { return $(selector).attr('data-value') || ''; },
        setValue(selector, value, triggerChange = true) {
            const $select =$(selector);
            if (!$select.length) return false;

            if (value === '' || value === null || value === undefined) {
                setValue($select, '', '');
                if (triggerChange) {
                    const callback = $select.data('onchange');
                    if (typeof callback === 'function') callback('');
                    $select.trigger('change');
                }
                return true;
            }

            const $option =$select.find('.custom-option').filter(function() {
                return String($(this).data('value')) === String(value);
            });
            if (!$option.length) return false;
            
            setValue($select, value,$option.text().trim());
            if (triggerChange) {
                const callback = $select.data('onchange');
                if (typeof callback === 'function') callback(value);
                $select.trigger('change');
            }
            return true;
        },
        reset(selector, triggerChange = false) {
            const $select =$(selector);
            if (!$select.length) return;
            setValue($select, '', '');
            if (triggerChange) {
                const callback = $select.data('onchange');
                if (typeof callback === 'function') callback('');
                $select.trigger('change');
            }
        },
        disabled(selector, estado = true) {
            const $select =$(selector);
            if (!$select.length) return;
            if (estado) {
                $select.addClass('disabled').css({ 'pointer-events': 'none', 'opacity': '0.6' });
                closeSelect($select);
            } else {
                $select.removeClass('disabled').css({ 'pointer-events': 'auto', 'opacity': '1' });
            }
        },
        _observe: (el) => observer.observe(el, { attributes: true })
    };

    $(document).ready(initCustomSelectEvents);
})();

function InsertarCustomSelect(config) {
    const { contenedor, id, placeholder = 'Selecciona...', opciones = [], buscador = true, onChange, disabled = false } = config;
    if (!contenedor || !id || $('#' + id).length) return;

    const opIni = opciones.find(op => op.selected === true);
    const valIni = opIni ? opIni.value : '';
    const txtIni = opIni ? opIni.text : placeholder;

    const estilosDisabled = disabled ? 'disabled; pointer-events: none; opacity: 0.6;' : '';

    const html = `
        <div class="custom-select ${disabled ? 'disabled' : ''}" id="${id}" data-value="${valIni}" data-placeholder="${placeholder}" style="${disabled ? 'pointer-events: none; opacity: 0.6;' : ''}">
            <div class="custom-select-trigger" style="min-height:100%; display:flex; align-items:center; border:2px solid #ccc; border-radius:4px; background:#fff; cursor:pointer; padding: 5px 10px; user-select:none; height:auto;">
                <span class="custom-select-text ${!opIni ? 'placeholder' : ''}" style="flex:1; ${!opIni ? 'white-space:nowrap; overflow:hidden; text-overflow:ellipsis;' : 'white-space:normal;'} font-size:14px; line-height:1.2;">${txtIni}</span>
                <i class="vf-ic_fluent_caret_down_24_filled" style="font-size:12px; margin-left:10px; flex-shrink:0;"></i>
            </div>
            <div class="custom-select-options" style="display:none; background:#fff; border:2px solid #ccc; border-radius:4px; z-index:9999; overflow:hidden;">
                ${buscador ? `
                <div class="custom-select-search" style="padding: 10px; border-bottom:1px solid #eee; background:#f9f9f9; flex-shrink:0;">
                    <input type="text" class="custom-select-search-input" style="width:100%; height:32px; border:2px solid #ddd; border-radius:4px; padding:0 8px; font-size:14px;" placeholder="Buscar..." autocomplete="off">
                </div>` : ''}
                <div class="custom-options-list contenedor" style="flex-grow:1;">
                    ${opciones.map(op => `
                        <div class="custom-option ${op.selected ? 'active' : ''}" data-value="${op.value}" style="padding:10px; cursor:pointer; font-size:14px; transition: background 0.2s; white-space:normal; word-wrap:break-word; border-bottom:1px solid #f0f0f0;">${op.text}</div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    $(contenedor).append(html);
    const $el =$('#' + id);
    if (typeof onChange === 'function') $el.data('onchange', onChange);
    window.CustomSelect._observe($el[0]);
}