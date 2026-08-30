// core/state.js - Estado global da aplicação

const state = {
    user: null,
    currentView: 'dashboard',
    transactions: [],
    accounts: [],
    categories: [],
    isDarkMode: localStorage.getItem('theme') === 'dark',
};
