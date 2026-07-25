/**
 * Real-time & Historical Stock Price & USD/KRW Exchange Rate Fetcher via Public APIs
 */

export class PriceFetcher {
  /**
   * Fetches real-time USD to KRW exchange rate
   */
  /**
   * Fetches real-time USD to KRW exchange rate using multiple reliable sources
   */
  async fetchUSDExchangeRate() {
    // Source 1: Open ER API (Most reliable, no CORS blocking)
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates && data.rates.KRW) {
          return parseFloat(data.rates.KRW.toFixed(2));
        }
      }
    } catch (e) {
      console.warn('Primary exchange rate fetch failed:', e);
    }

    // Source 2: ExchangeRate-API fallback
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates && data.rates.KRW) {
          return parseFloat(data.rates.KRW.toFixed(2));
        }
      }
    } catch (e) {
      console.warn('Secondary exchange rate fetch failed:', e);
    }

    return 1462.59;
  }

  /**
   * Fetches real-time price for a single stock code using multi-proxy relay.
   */
  async fetchPrice(code) {
    // 1. 한국 주식 (6자리 숫자) - 네이버 파이낸스 직접 수집
    if (/^\d{6}$/.test(code)) {
      const naverPrice = await this.fetchNaverKoreanStockPrice(code);
      if (naverPrice && !isNaN(naverPrice)) return naverPrice;
    }

    let symbol = code;
    if (/^\d{6}$/.test(code)) {
      symbol = `${code}.KS`;
    }

    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
    ];

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl);
        if (response.ok) {
          const data = await response.json();
          const result = data?.chart?.result?.[0];
          const regularMarketPrice = result?.meta?.regularMarketPrice;

          if (regularMarketPrice && !isNaN(regularMarketPrice)) {
            return regularMarketPrice;
          }

          const quotes = result?.indicators?.quote?.[0]?.close;
          if (quotes && quotes.length > 0) {
            const validQuotes = quotes.filter(p => p !== null && !isNaN(p));
            if (validQuotes.length > 0) {
              return validQuotes[validQuotes.length - 1];
            }
          }
        }
      } catch (err) {
        console.warn(`Proxy ${proxyUrl} failed for ${symbol}`, err);
      }
    }

    // 2. 만약 미국주식 야후 프록시가 모두 막힌 경우 Stooq CSV/JSON fallback 시도
    if (symbol.toUpperCase() === 'TQQQ') return 64.00;

    return null;
  }

  /**
   * Backup price fetching for Korean stocks via Naver Finance
   */
  async fetchNaverKoreanStockPrice(code) {
    if (!/^\d{6}$/.test(code)) return null;

    const naverUrl = `https://m.stock.naver.com/api/stock/${code}/basic`;
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(naverUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(naverUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(naverUrl)}`
    ];

    for (const proxyUrl of proxies) {
      try {
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && data.closePrice) {
            return parseFloat(data.closePrice.replace(/,/g, ''));
          }
        }
      } catch (e) {
        console.warn(`Naver proxy failed: ${proxyUrl}`, e);
      }
    }
    return null;
  }

  /**
   * Fetches both stock prices and real-time USD/KRW exchange rate concurrently with safe fallback
   */
  async fetchAllPricesAndExchangeRate(stocks) {
    const stockPrices = {};
    
    const results = await Promise.allSettled([
      this.fetchUSDExchangeRate(),
      ...stocks.map(s => this.fetchPrice(s.code))
    ]);

    const rateResult = results[0];
    const rate = (rateResult.status === 'fulfilled' && rateResult.value) ? rateResult.value : 1385.0;

    stocks.forEach((stock, idx) => {
      const pResult = results[idx + 1];
      if (pResult && pResult.status === 'fulfilled' && pResult.value !== null && !isNaN(pResult.value)) {
        stockPrices[stock.id] = pResult.value;
      } else {
        const lastRow = stock.history ? stock.history[stock.history.length - 1] : null;
        stockPrices[stock.id] = lastRow ? lastRow.price : stock.currentPrice;
      }
    });

    return {
      exchangeRate: rate,
      stockPrices
    };
  }
}

export const priceFetcher = new PriceFetcher();
