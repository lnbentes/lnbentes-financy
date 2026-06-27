// core/theme.js - Gerenciamento de tema claro/escuro
// Depende de: core/state.js (state)

const theme = {
    apply() {
        if (state.isDarkMode) {
            document.documentElement.classList.add('dark');
            const icon = document.getElementById('theme-icon');
            if (icon) icon.setAttribute('name', 'sunny-outline');
        } else {
            document.documentElement.classList.remove('dark');
            const icon = document.getElementById('theme-icon');
            if (icon) icon.setAttribute('name', 'moon-outline');
        }
    },

    toggle() {
        state.isDarkMode = !state.isDarkMode;
        localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
        this.apply();
    },
};
