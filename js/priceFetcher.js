/**
 * Real-time Stock Price & USD/KRW Exchange Rate Fetcher via Direct Public APIs
 */

export class PriceFetcher {
  /**
   * Fetches real-time USD to KRW exchange rate
   */
  async fetchUSDExchangeRate() {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates && data.rates.KRW) {
          return parseFloat(data.rates.KRW.toFixed(2));
        }
      }
    } catch (e) {
      console.warn('Open ER API exchange rate fetch failed:', e);
    }

    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates && data.rates.KRW) {
          return parseFloat(data.rates.KRW.toFixed(2));
        }
      }
    } catch (e) {
      console.warn('ExchangeRate-API fallback failed:', e);
    }

    return 1462.59;
  }

  /**
   * Fetches real-time price for a single stock code using direct public APIs.
   */
  async fetchPrice(code) {
    if (!code) return null;
    const cleanCode = String(code).trim().toUpperCase();

    // 1. Direct Naver Mobile API for Korean stocks (6 digits)
    if (/^\d{6}$/.test(cleanCode)) {
      try {
        const res = await fetch(`https://m.stock.naver.com/api/stock/${cleanCode}/basic`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.closePrice) {
            const parsed = parseFloat(String(data.closePrice).replace(/,/g, ''));
            if (!isNaN(parsed) && parsed > 0) return parsed;
          }
        }
      } catch (e) {
        console.warn(`Direct Naver API fetch failed for ${cleanCode}:`, e);
      }
    }

    // 2. Direct Yahoo Finance API (supports TQQQ and 000660.KS)
    let symbol = cleanCode;
    if (/^\d{6}$/.test(cleanCode)) {
      symbol = `${cleanCode}.KS`;
    }

    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const res = await fetch(yahooUrl);
      if (res.ok) {
        const data = await res.json();
        const result = data?.chart?.result?.[0];
        const regPrice = result?.meta?.regularMarketPrice;
        if (regPrice && !isNaN(regPrice) && regPrice > 0) {
          return parseFloat(regPrice);
        }
        const quotes = result?.indicators?.quote?.[0]?.close;
        if (quotes && quotes.length > 0) {
          const valid = quotes.filter(p => p !== null && !isNaN(p) && p > 0);
          if (valid.length > 0) return parseFloat(valid[valid.length - 1]);
        }
      }
    } catch (e) {
      console.warn(`Direct Yahoo API fetch failed for ${symbol}:`, e);
    }

    return null;
  }

  /**
   * Fetches both stock prices and real-time USD/KRW exchange rate concurrently
   */
  async fetchAllPricesAndExchangeRate(stocks) {
    const stockPrices = {};
    
    const results = await Promise.allSettled([
      this.fetchUSDExchangeRate(),
      ...stocks.map(s => this.fetchPrice(s.code))
    ]);

    const rateResult = results[0];
    const rate = (rateResult.status === 'fulfilled' && rateResult.value) ? rateResult.value : 1462.59;

    stocks.forEach((stock, idx) => {
      const pResult = results[idx + 1];
      if (pResult && pResult.status === 'fulfilled' && pResult.value !== null && !isNaN(pResult.value)) {
        stockPrices[stock.id] = pResult.value;
      }
    });

    return {
      exchangeRate: rate,
      stockPrices
    };
  }
}
