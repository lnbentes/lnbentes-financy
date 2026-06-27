
async function financeLoadMonth() {
    const { year, month, search, minAmount, maxAmount, txType } = financeState;
    try {

        const [summary, txList, accounts] = await Promise.all([
            api.finance.transactions.summary({ year, month }),
            api.finance.transactions.list({
                year, month, search,
                min_amount: minAmount,
                max_amount: maxAmount,
                type: txType,
            }),
            api.finance.accounts.list(),
        ]);
        financeState.summary      = summary;
        financeState.transactions = txList;
        state.transactions        = txList;
        state.accounts            = accounts;
    } catch (e) {
        console.error('Erro ao carregar financeiro:', e);
    }
    financeRenderContent();
}
