class ImageGalleryManager {
    constructor(contenedorId, config = { size: '120px', maxFiles: 12 }) {
        this.$wrapper =$(`#${contenedorId}`);
        if (!this.$wrapper.length) {
            console.error(`ImageGalleryManager: Contenedor #${contenedorId} no encontrado.`);
            return;
        }

        this.$wrapper.css({ 'width': '100%', 'flex': '1 1 100%' });
        
        this.size = config.size || '120px';
        this.maxFiles = config.maxFiles || 12;
        this.imagenesSubidas = [];
        this.namespace = `.gallery_${Math.random().toString(36).substr(2, 6)}`;
        this.idInput = `input-${Math.random().toString(36).substr(2, 9)}`;
        
        // Crear input file oculto único por instancia
        this.$fileInput =$(`<input type="file" id="${this.idInput}" multiple accept="image/*" class="d-none hidden">`).appendTo('body');
        
        this.init();
    }

    init() {
        this.$wrapper.html(`
            <div class="w-p-100 h-20 flex justify-end items-center mb-2">
                <span class="fw-600 fs-2 text-blue-03618d" id="contador-info">0 de ${this.maxFiles} imágenes subidas</span>
            </div>
            <div class="uploader-body" style="width: 100%; overflow-x: auto;">
                <div class="flex flex-wrap p-3 box-sizing" style="gap: 15px;" id="galeria-fotos"></div>
            </div>
        `);
        this.InitEvents();
        this.RenderizarGaleria();
    }

    InitEvents() {
        this.$wrapper.off(this.namespace).on(`click${this.namespace}`, ".btn-subir", () => {
            if (this.imagenesSubidas.length < this.maxFiles) {
                this.$fileInput.click();
            } else if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(`Máximo ${this.maxFiles} fotos permitidas.`, false, false, false);
            } else {
                alert(`Máximo ${this.maxFiles} fotos permitidas.`);
            }
        });
        
        this.$wrapper.on(`click${this.namespace}`, ".btn-del", (e) => {
            e.stopPropagation();
            this.EliminarImagen($(e.currentTarget).data("id"));
        });
        
        this.$fileInput.off("change").on("change", (e) => {
            this.ManejarArchivos(e.target.files);
            $(e.target).val(''); // Limpiar para permitir re-selección
        });
    }

    ManejarArchivos(files) {
        if (!files || files.length === 0) return;

        const espacioDisponible = this.maxFiles - this.imagenesSubidas.length;
        const archivosAProcesar = Array.from(files).slice(0, espacioDisponible);

        archivosAProcesar.forEach(file => {
            const esDuplicado = this.imagenesSubidas.some(img => img.file && img.file.name === file.name && img.file.size === file.size);
            
            if (!esDuplicado) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.imagenesSubidas.push({
                        id: Date.now() + Math.random().toString(36).substr(2, 5),
                        file: file,
                        preview: e.target.result,
                        esExistente: false
                    });
                    this.RenderizarGaleria();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    EliminarImagen(id) {
        this.imagenesSubidas = this.imagenesSubidas.filter(img => img.id !== id);
        this.RenderizarGaleria();
    }

    RenderizarGaleria() {
        const $galeria = this.$wrapper.find("#galeria-fotos");
        this.$wrapper.find("#contador-info").text(`${this.imagenesSubidas.length} de ${this.maxFiles} imágenes subidas`);
        $galeria.empty();

        // 1. Botón Subir (solo si no se ha alcanzado el límite)
        if (this.imagenesSubidas.length < this.maxFiles) {
            $galeria.append(`
                <a class="btn btn-subir flex items-center cursor-pointer shadow-sm justify-center" 
                   style="width:${this.size}; height:${this.size}; min-width:${this.size}; border: 2px dashed #3b82f6; border-radius: 16px; background: #eff6ff; transition: 0.3s; flex-shrink: 0;">
                    <i class="icon fs-4 vf-ic_fluent_add_24_filled flex justify-center items-center"></i>
                </a>
            `);
        }

        // 2. Renderizar vistas previas de fotos
        this.imagenesSubidas.forEach((img, index) => {
            $galeria.append(`
                <div class="thumb-container position-relative shadow-sm boton-con-div-oculto" data-id="${img.id}"
                     style="width:${this.size}; height:${this.size}; min-width:${this.size}; border-radius: 16px; overflow:hidden; cursor:grab; border: 2px solid #fff; flex-shrink: 0;">
                    <img src="${img.preview}" style="width:100%; height:100%; object-fit:cover;">
                    
                    <a class="w-30 btn-del h-30 position-absolute text-white btn-option div-oculto rounded-full flex justify-center items-center" style="right:5px; top:5px; background:rgba(239,68,68,0.9); cursor:pointer;" data-id="${img.id}">
                        <i class="icon fs-4 vf-ic_fluent_delete_24_filled flex justify-center items-center"></i>
                    </a>
                    
                    ${index === 0 ? `<div class="position-absolute bottom-0 start-0 w-p-100 bg-black text-white text-center py-1 fw-bold" style="opacity:0.8; font-size: 10px; letter-spacing: 0.5px;">PORTADA</div>` : ''}
                </div>
            `);
        });

        this.InitSortable();
    }

    InitSortable() {
        const el = this.$wrapper.find('#galeria-fotos')[0];
        if (!el || typeof Sortable === 'undefined') return;

        if (el._sortable) {
            el._sortable.destroy();
        }

        el._sortable = Sortable.create(el, {
            animation: 300,
            filter: '.btn-subir',
            ghostClass: 'opacity-50',
            onEnd: () => {
                const nuevoOrden = [];
                this.$wrapper.find(".thumb-container").each((_, container) => {
                    const id = $(container).data("id");
                    const img = this.imagenesSubidas.find(i => i.id == id);
                    if (img) nuevoOrden.push(img);
                });
                this.imagenesSubidas = nuevoOrden;
                this.RenderizarGaleria();
            }
        });
    }

    cargarImagenesExistentes(urls) {
        if (!Array.isArray(urls)) return;
        
        urls.forEach(url => {
            if (this.imagenesSubidas.length < this.maxFiles) {
                const id = Date.now() + Math.random().toString(36).substr(2, 5);
                this.imagenesSubidas.push({ 
                    id: id, 
                    file: null, 
                    preview: url,
                    esExistente: true 
                });
            }
        });
        this.RenderizarGaleria();
    }

    getFiles() { 
        return this.imagenesSubidas.map(i => i.file); 
    }

    getAllData() {
        return this.imagenesSubidas;
    }

    destroy() {
        this.$wrapper.off(this.namespace);
        this.$fileInput.remove();
        this.$wrapper.empty();
    }
}