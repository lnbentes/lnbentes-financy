// views/finance/state.js - Estado local e helpers de formatação da view Financeiro

const financeState = {
    year:         new Date().getFullYear(),
    month:        new Date().getMonth() + 1,
    search:       '',
    minAmount:    '',
    maxAmount:    '',
    txType:       '',
    summary:      { income: 0, expense: 0, balance: 0, category_breakdown: [] },
    transactions: [],
    _searchTimer: null,
};

const PT_MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function fmtBRL(value) {
    return parseFloat(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}
