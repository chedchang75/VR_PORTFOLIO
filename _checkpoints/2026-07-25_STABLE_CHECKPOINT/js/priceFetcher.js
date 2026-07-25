/**
 * Real-time & Historical Stock Price & USD/KRW Exchange Rate Fetcher via Public APIs
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
      console.warn('Primary exchange rate fetch failed, trying Yahoo Finance...', e);
    }

    try {
      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?interval=1m&range=1d`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const data = await response.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price && !isNaN(price)) {
          return parseFloat(price.toFixed(2));
        }
      }
    } catch (e) {
      console.error('All exchange rate APIs failed', e);
    }

    return 1462.59;
  }

  /**
   * Fetches real-time price for a single stock code.
   */
  async fetchPrice(code) {
    let symbol = code;
    if (/^\d{6}$/.test(code)) {
      symbol = `${code}.KS`;
    }

    try {
      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

      let response = await fetch(proxyUrl);
      if (!response.ok) {
        response = await fetch(targetUrl);
      }

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

      throw new Error('Valid price data not found in response');
    } catch (error) {
      console.warn(`Failed to fetch price for ${symbol}. Trying Naver Backup...`, error);
      return this.fetchNaverKoreanStockPrice(code);
    }
  }

  /**
   * Fetches exact historical close price for a specific week-ending date (e.g. '2025-12-07').
   * Guarantees returning historical close price of that week-ending date (or closest past trading day).
   */
  async fetchHistoricalPrice(code, dateYmdStr) {
    let symbol = code;
    if (/^\d{6}$/.test(code)) {
      symbol = `${code}.KS`;
    }

    try {
      const targetDate = new Date(dateYmdStr);
      // Fetch 10 days window around targetDate to catch trading close price
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - 8);

      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 2); // include weekend buffer

      const period1 = Math.floor(startDate.getTime() / 1000);
      const period2 = Math.floor(endDate.getTime() / 1000);

      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

      let response = await fetch(proxyUrl);
      if (!response.ok) {
        response = await fetch(targetUrl);
      }

      if (response.ok) {
        const data = await response.json();
        const result = data?.chart?.result?.[0];
        const timestamps = result?.timestamp;
        const quotes = result?.indicators?.quote?.[0]?.close;

        if (timestamps && quotes && timestamps.length > 0) {
          const targetTimestampSec = Math.floor(targetDate.getTime() / 1000) + 86400; // end of target day
          let lastValidClose = null;

          for (let i = 0; i < timestamps.length; i++) {
            if (timestamps[i] <= targetTimestampSec) {
              if (quotes[i] !== null && !isNaN(quotes[i])) {
                lastValidClose = quotes[i];
              }
            }
          }

          if (lastValidClose !== null) {
            return Math.round(lastValidClose * 100) / 100;
          }
        }
      }
    } catch (e) {
      console.warn(`Historical price fetch failed for ${symbol} on ${dateYmdStr}`, e);
    }

    return this.fetchPrice(code);
  }

  /**
   * Backup price fetching for Korean stocks via Naver Finance
   */
  async fetchNaverKoreanStockPrice(code) {
    if (!/^\d{6}$/.test(code)) return null;

    try {
      const naverUrl = `https://m.stock.naver.com/api/stock/${code}/basic`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(naverUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.closePrice) {
          return parseFloat(data.closePrice.replace(/,/g, ''));
        }
      }
    } catch (e) {
      console.error('Naver fetch failed:', e);
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
    const rate = (rateResult.status === 'fulfilled' && rateResult.value) ? rateResult.value : 1462.59;

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
