
ui.renderFinance = function () {
    document.getElementById('view-title').innerText = 'Financeiro';
    document.getElementById('view-container').innerHTML = `
        <div id="finance-content" class="animate-in space-y-6"></div>
    `;
    financeLoadMonth(); 
};
