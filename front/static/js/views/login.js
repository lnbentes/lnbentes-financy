// views/login.js - Renderização da tela de login

ui.renderLogin = function () {
    const container = document.getElementById('login-wrapper');
    container.innerHTML = `
        <div class="bg-white dark:bg-earth-900 p-8 rounded-3xl shadow-xl border border-earth-200 dark:border-earth-800 w-full max-auto max-w-md animate-in">
            <div class="flex flex-col items-center mb-8">
                <div class="w-16 h-16 bg-forest-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4">
                    <ion-icon name="leaf"></ion-icon>
                </div>
                <h1 class="text-3xl font-serif font-bold text-forest-900 dark:text-forest-100">BeTo's House</h1>
                <p class="text-earth-500">Eco-Home Management System</p>
            </div>

            <form id="login-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Usuário</label>
                    <input type="text" id="login-username" class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">Senha</label>
                    <input type="password" id="login-password" class="w-full px-4 py-3 rounded-xl border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 focus:ring-2 focus:ring-forest-500 outline-none transition-all" required>
                </div>
                <button type="submit" class="w-full bg-forest-600 hover:bg-forest-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-forest-500/20 active:scale-[0.98]">
                    Entrar
                </button>
            </form>

            <div id="login-error" class="mt-4 text-red-500 text-sm text-center hidden"></div>

            <div class="mt-8 text-center text-sm text-earth-500">
                Ainda não tem conta? <a href="#" class="text-forest-600 font-bold">Solicite acesso</a>
            </div>
        </div>
    `;
};
