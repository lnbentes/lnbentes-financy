// components/modals/modal.js - Fábrica genérica de modais
// Uso:
//   modal.open({ title, body, footer, size, onClose })
//   modal.close()

const modal = {
    _overlay: null,

    /**
     * Abre um modal.
     * @param {object} options
     * @param {string}   options.title        - Título do modal
     * @param {string}   options.body         - HTML interno do corpo
     * @param {string}   [options.footer]     - HTML do rodapé (botões)
     * @param {string}   [options.size]       - 'sm' | 'md' | 'lg' | 'xl'
     * @param {Function} [options.onClose]    - Callback ao fechar
     * @returns {HTMLElement} overlay criado
     */
    open({ title = '', body = '', footer = '', size = 'md', onClose } = {}) {
        this.close(); // Fecha modal anterior se existir

        const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };
        const maxW = widths[size] || widths.md;

        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = [
            'fixed inset-0 z-[100] flex items-center justify-center p-4',
            'bg-black/50 backdrop-blur-sm',
        ].join(' ');

        overlay.innerHTML = `
            <div class="bg-white dark:bg-earth-900 rounded-3xl shadow-2xl border border-earth-200 dark:border-earth-700
                        w-full ${maxW} max-h-[90vh] flex flex-col
                        translate-y-0 opacity-100 transition-all duration-200">

                <!-- Header -->
                <div class="flex items-center justify-between px-6 py-5 border-b border-earth-100 dark:border-earth-800 shrink-0">
                    <h2 class="text-xl font-bold text-earth-800 dark:text-earth-100">${title}</h2>
                    <button id="modal-close-btn"
                        class="p-2 rounded-xl text-earth-400 hover:text-earth-600 hover:bg-earth-100 dark:hover:bg-earth-800 transition-colors">
                        <ion-icon name="close-outline" class="text-xl"></ion-icon>
                    </button>
                </div>

                <!-- Body -->
                <div class="px-6 py-5 overflow-y-auto flex-1">
                    ${body}
                </div>

                <!-- Footer (opcional) -->
                ${footer ? `
                <div class="px-6 py-4 border-t border-earth-100 dark:border-earth-800 flex justify-end gap-3 shrink-0">
                    ${footer}
                </div>` : ''}
            </div>
        `;

        // Fecha ao clicar fora
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
                if (onClose) onClose();
            }
        });

        overlay.querySelector('#modal-close-btn').addEventListener('click', () => {
            this.close();
            if (onClose) onClose();
        });

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        this._overlay = overlay;

        return overlay;
    },

    close() {
        if (this._overlay) {
            this._overlay.remove();
            this._overlay = null;
        }
        document.body.style.overflow = '';
    },
};
