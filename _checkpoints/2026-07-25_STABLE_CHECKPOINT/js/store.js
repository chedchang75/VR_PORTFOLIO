/**
 * Data Store for Portfolio, Transactions, Strategy Settings, and Weekly VR History
 */
import { VRStrategy } from '../strategies/VRStrategy.js';

const vrEngine = new VRStrategy();
const STORAGE_KEY = 'VR_MOBILE_PORTFOLIO_DATA_V5';

// ⭐ 0주차부터 36주차까지의 실제 TQQQ 전체 데이터셋 (유저 이미지 데이터 반영)
const sampleTqqqHistory = [
  { week: 0, date: '25.10.27~11.9', price: 52.89, g: 15, evalE: 227321.22, targetV: 225572.43, minBand: 191736.57, maxBand: 259408.29, poolDelta: 0.00, poolCumulative: 47918.90, totalAsset: 227321.22, profitPercent: 0.0, profitAmount: 0.0, qty: 4298, avgPrice: 52.89 },
  { week: 2, date: '25.11.10~11.23', price: 47.48, g: 15, evalE: 204069.04, targetV: 225990.94, minBand: 192092.30, maxBand: 259889.58, poolDelta: 0.00, poolCumulative: 47918.90, totalAsset: 204069.04, profitPercent: -10.23, profitAmount: -23252.18, qty: 4298, avgPrice: 52.89 },
  { week: 4, date: '25.11.24~12.7', price: 56.15, g: 15, evalE: 241332.70, targetV: 231166.12, minBand: 196491.20, maxBand: 265841.04, poolDelta: 0.00, poolCumulative: 47918.90, totalAsset: 241332.70, profitPercent: 6.16, profitAmount: 14011.48, qty: 4298, avgPrice: 52.89 },
  { week: 6, date: '25.12.8~12.21', price: 53.52, g: 15, evalE: 230028.96, targetV: 234213.93, minBand: 199081.84, maxBand: 269346.02, poolDelta: 0.00, poolCumulative: 47918.90, totalAsset: 230028.96, profitPercent: 1.19, profitAmount: 2707.74, qty: 4298, avgPrice: 52.89 },
  { week: 8, date: '25.12.22~1.4', price: 52.35, g: 15, evalE: 225000.30, targetV: 236219.05, minBand: 200786.19, maxBand: 271651.91, poolDelta: 0.00, poolCumulative: 47918.90, totalAsset: 225000.30, profitPercent: -1.02, profitAmount: -2320.92, qty: 4298, avgPrice: 52.89 },
  { week: 10, date: '25.1.5~1.18', price: 54.14, g: 15, evalE: 232693.72, targetV: 238958.53, minBand: 203114.75, maxBand: 274802.31, poolDelta: 0.00, poolCumulative: 47918.90, totalAsset: 232693.72, profitPercent: 2.36, profitAmount: 5372.50, qty: 4298, avgPrice: 52.89 },
  { week: 12, date: '25.1.19~2.1', price: 54.00, g: 15, evalE: 232092.00, targetV: 241266.66, minBand: 205076.66, maxBand: 277456.66, poolDelta: 0.00, poolCumulative: 47918.90, totalAsset: 232092.00, profitPercent: 2.10, profitAmount: 4770.78, qty: 4298, avgPrice: 52.89 },
  { week: 14, date: '25.2.2~2.15', price: 48.47, g: 15, evalE: 206336.79, targetV: 240713.51, minBand: 204606.48, maxBand: 276820.54, poolDelta: -7489.40, poolCumulative: 40429.50, totalAsset: 206336.79, profitPercent: -4.95, profitAmount: -11241.96, qty: 4257, avgPrice: 52.89 },
  { week: 16, date: '25.2.16~3.1', price: 48.00, g: 15, evalE: 204336.00, targetV: 240100.00, minBand: 204085.00, maxBand: 276115.00, poolDelta: 0.00, poolCumulative: 40429.50, totalAsset: 204336.00, profitPercent: -5.87, profitAmount: -12745.00, qty: 4257, avgPrice: 52.89 },
  { week: 18, date: '25.3.2~3.15', price: 47.50, g: 15, evalE: 202207.50, targetV: 239900.00, minBand: 203915.00, maxBand: 275885.00, poolDelta: 0.00, poolCumulative: 40429.50, totalAsset: 202207.50, profitPercent: -6.85, profitAmount: -14873.50, qty: 4257, avgPrice: 52.89 },
  { week: 20, date: '25.3.16~3.29', price: 44.10, g: 15, evalE: 187733.70, targetV: 239800.00, minBand: 203830.00, maxBand: 275770.00, poolDelta: 0.00, poolCumulative: 40429.50, totalAsset: 187733.70, profitPercent: -13.52, profitAmount: -29347.30, qty: 4257, avgPrice: 52.89 },
  { week: 22, date: '25.3.30~4.12', price: 49.17, g: 15, evalE: 238867.86, targetV: 241209.57, minBand: 205028.13, maxBand: 277391.01, poolDelta: -5275.20, poolCumulative: 35154.30, totalAsset: 238867.86, profitPercent: -7.03, profitAmount: -18055.34, qty: 4858, avgPrice: 52.89 },
  { week: 24, date: '25.4.13~4.26', price: 62.52, g: 15, evalE: 303722.16, targetV: 249669.01, minBand: 212218.66, maxBand: 287119.36, poolDelta: 0.00, poolCumulative: 35154.30, totalAsset: 303722.16, profitPercent: 18.21, profitAmount: 46799.16, qty: 4858, avgPrice: 52.89 },
  { week: 26, date: '25.4.27~5.10', price: 76.28, g: 15, evalE: 340056.24, targetV: 267933.92, minBand: 227743.83, maxBand: 308124.01, poolDelta: 0.00, poolCumulative: 35154.30, totalAsset: 340056.24, profitPercent: 32.36, profitAmount: 83133.24, qty: 4458, avgPrice: 52.89 },
  { week: 28, date: '25.5.11~5.24', price: 77.84, g: 15, evalE: 339226.72, targetV: 284252.55, minBand: 241614.67, maxBand: 326890.43, poolDelta: 0.00, poolCumulative: 35154.30, totalAsset: 339226.72, profitPercent: 32.04, profitAmount: 82303.72, qty: 4358, avgPrice: 52.89 },
  { week: 30, date: '25.5.25~6.7', price: 73.05, g: 15, evalE: 316817.85, targetV: 297235.68, minBand: 252650.33, maxBand: 341821.03, poolDelta: 0.00, poolCumulative: 35154.30, totalAsset: 316817.85, profitPercent: 23.31, profitAmount: 59894.85, qty: 4337, avgPrice: 52.89 },
  { week: 32, date: '25.6.8~6.21', price: 82.87, g: 15, evalE: 352777.59, targetV: 313633.68, minBand: 266588.63, maxBand: 360678.73, poolDelta: 0.00, poolCumulative: 35154.30, totalAsset: 352777.59, profitPercent: 37.32, profitAmount: 95854.59, qty: 4257, avgPrice: 52.89 },
  { week: 34, date: '25.6.22~7.5', price: 73.35, g: 15, evalE: 312250.95, targetV: 322682.74, minBand: 274280.33, maxBand: 371085.15, poolDelta: 0.00, poolCumulative: 35154.30, totalAsset: 312250.95, profitPercent: 21.54, profitAmount: 55327.95, qty: 4257, avgPrice: 52.89 },
  { week: 36, date: '25.7.6~7.19', price: 67.53, g: 15, evalE: 287475.21, targetV: 327365.03, minBand: 278260.28, maxBand: 376469.78, poolDelta: 0.00, poolCumulative: 35154.30, totalAsset: 287475.21, profitPercent: 11.89, profitAmount: 30552.21, qty: 4257, avgPrice: 52.89 }
];

export const initialData = {
  usdExchangeRate: 1462.59,
  stocks: [
    {
      id: 'stk_1',
      code: 'TQQQ',
      name: 'ProShares UltraPro QQQ',
      currency: 'USD',
      currentPrice: 67.53,
      targetBuyPrice: 65.37,
      targetSellPrice: 88.43,
      strategyType: 'VR',
      cycleWeeks: 2,
      vrBandPercent: 15,
      G: 15,
      qtyStep: 20,
      v1: 327365.03,
      vrTargetValue: 47918.90,
      holdings: 4257,
      avgPrice: 52.89,
      history: sampleTqqqHistory
    },
    {
      id: 'stk_2',
      code: '005930',
      name: '삼성전자',
      currency: 'KRW',
      currentPrice: 75000,
      targetBuyPrice: 70000,
      targetSellPrice: 82000,
      strategyType: 'VR',
      cycleWeeks: 2,
      vrBandPercent: 10,
      G: 10,
      qtyStep: 10,
      v1: 3550000,
      vrTargetValue: 5000000,
      holdings: 50,
      avgPrice: 71000,
      history: [
        { week: 0, date: '25.1.25~2.7', price: 71000, g: 10, evalE: 3550000, targetV: 3550000, minBand: 3195000, maxBand: 3905000, poolDelta: 0, poolCumulative: 5000000, totalAsset: 3550000, profitPercent: 0.0, profitAmount: 0, qty: 50, avgPrice: 71000 },
        { week: 1, date: '25.2.8~2.22', price: 73500, g: 10, evalE: 3675000, targetV: 3610000, minBand: 3249000, maxBand: 3971000, poolDelta: 0, poolCumulative: 5000000, totalAsset: 3675000, profitPercent: 3.52, profitAmount: 125000, qty: 50, avgPrice: 71000 },
        { week: 2, date: '25.2.23~3.8', price: 75000, g: 10, evalE: 3750000, targetV: 3680000, minBand: 3312000, maxBand: 4048000, poolDelta: 0, poolCumulative: 5000000, totalAsset: 3750000, profitPercent: 5.63, profitAmount: 200000, qty: 50, avgPrice: 71000 }
      ]
    },
    {
      id: 'stk_3',
      code: 'NVDA',
      name: 'NVIDIA Corporation',
      currency: 'USD',
      currentPrice: 125.00,
      targetBuyPrice: 110.00,
      targetSellPrice: 145.00,
      strategyType: 'VR',
      cycleWeeks: 1,
      vrBandPercent: 15,
      G: 10,
      qtyStep: 5,
      v1: 3150,
      vrTargetValue: 5000,
      holdings: 30,
      avgPrice: 105.00,
      history: [
        { week: 0, date: '25.1.25~1.31', price: 105.00, g: 10, evalE: 3150.00, targetV: 3150.00, minBand: 2677.50, maxBand: 3622.50, poolDelta: 0, poolCumulative: 5000.00, totalAsset: 3150.00, profitPercent: 0.0, profitAmount: 0.0, qty: 30, avgPrice: 105.00 },
        { week: 1, date: '25.2.1~2.7', price: 118.00, g: 10, evalE: 3540.00, targetV: 3320.00, minBand: 2822.00, maxBand: 3818.00, poolDelta: 0.00, poolCumulative: 5000.00, totalAsset: 3540.00, profitPercent: 12.38, profitAmount: 390.00, qty: 30, avgPrice: 105.00 },
        { week: 2, date: '25.2.8~2.14', price: 125.00, g: 10, evalE: 3750.00, targetV: 3480.00, minBand: 2958.00, maxBand: 4002.00, poolDelta: 0.00, poolCumulative: 5000.00, totalAsset: 3600.00, profitPercent: 19.05, profitAmount: 600.00, qty: 30, avgPrice: 105.00 }
      ]
    }
  ],
  transactions: [
    { id: 'tx_1', stockId: 'stk_1', date: '2026-01-25', type: 'BUY', quantity: 4298, price: 52.89, fee: 5.0 },
    { id: 'tx_2', stockId: 'stk_2', date: '2026-01-25', type: 'BUY', quantity: 50, price: 71000, fee: 500 },
    { id: 'tx_3', stockId: 'stk_3', date: '2026-01-25', type: 'BUY', quantity: 30, price: 105.00, fee: 1.2 }
  ]
};

export class Store {
  constructor() {
    this.data = this.loadData();
    this.sanitizeData();
  }

  loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.saveData(initialData);
      return JSON.parse(JSON.stringify(initialData));
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.stocks || parsed.stocks.length === 0) {
        this.saveData(initialData);
        return JSON.parse(JSON.stringify(initialData));
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse local storage data, resetting.', e);
      this.saveData(initialData);
      return JSON.parse(JSON.stringify(initialData));
    }
  }

  // ⭐ 36주차 완전 데이터셋 적용 마이그레이션
  sanitizeData() {
    const tqqq = (this.data.stocks || []).find(s => s.code === 'TQQQ');
    if (tqqq) {
      // 36주차가 없거나 14주차만 있는 경우 36주차 전체 데이터셋으로 마이그레이션!
      if (!tqqq.history || tqqq.history.length < 10) {
        tqqq.history = sampleTqqqHistory;
        tqqq.holdings = 4257;
        tqqq.currentPrice = 67.53;
        tqqq.v1 = 327365.03;
        this.saveData();
      }
    }
  }

  saveData(data = this.data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  getExchangeRate() {
    return this.data.usdExchangeRate || 1462.59;
  }

  setExchangeRate(rate) {
    if (rate && !isNaN(rate)) {
      this.data.usdExchangeRate = parseFloat(rate);
      this.saveData();
    }
  }

  getStocks() {
    return this.data.stocks || [];
  }

  getTransactions() {
    return this.data.transactions || [];
  }

  getStockHistory(stockId) {
    const stock = (this.data.stocks || []).find(s => s.id === stockId);
    return stock ? (stock.history || []) : [];
  }

  updateStockStrategyOptions(stockId, { cycleWeeks, vrBandPercent, G, qtyStep }) {
    const stock = (this.data.stocks || []).find(s => s.id === stockId);
    if (stock) {
      if (cycleWeeks) stock.cycleWeeks = parseInt(cycleWeeks);
      if (vrBandPercent) stock.vrBandPercent = parseFloat(vrBandPercent);
      if (G) stock.G = parseFloat(G);
      if (qtyStep) stock.qtyStep = parseInt(qtyStep);
      this.saveData();
    }
  }

  // 주차 수동 수정 시 DB에 저장
  updateWeeklyRecord(stockId, weekNum, updatedFields) {
    const stock = (this.data.stocks || []).find(s => s.id === stockId);
    if (stock && stock.history) {
      const idx = stock.history.findIndex(h => h.week === parseInt(weekNum));
      if (idx !== -1) {
        stock.history[idx] = { ...stock.history[idx], ...updatedFields };

        const sorted = [...stock.history].sort((a, b) => a.week - b.week);
        const lastRecord = sorted[sorted.length - 1];

        if (lastRecord) {
          stock.v1 = lastRecord.targetV;
          stock.holdings = lastRecord.qty;
          stock.G = lastRecord.g || stock.G;
        }

        this.saveData();
      }
    }
  }

  // ⭐ 특정 주차 수정 후 전체 주차 순차(Cascading) 연쇄 재계산 엔진!
  recalculateAllWeeklyHistory(stockId) {
    const stock = (this.data.stocks || []).find(s => s.id === stockId);
    if (!stock || !stock.history || stock.history.length === 0) return;

    const bandRatio = (stock.vrBandPercent || 15) / 100;
    const sorted = [...stock.history].sort((a, b) => a.week - b.week);

    // 최초 0주차 설정된 Pool 자산 ($47,918.9)
    const baseInitialPool = stock.vrTargetValue || (sorted[0] ? (sorted[0].poolCumulative || sorted[0].poolDelta || 47918.9) : 47918.9);
    let runningPoolCumulative = baseInitialPool;

    for (let i = 0; i < sorted.length; i++) {
      const row = sorted[i];
      const gVal = row.g || stock.G || 15;
      const qty = row.qty || stock.holdings;
      const evalE = Math.round(qty * row.price * 100) / 100;
      row.evalE = evalE;

      if (i === 0) {
        // 0주차: 지정된 targetV 및 최초 Pool 유지
        const targetV = row.targetV || evalE;
        row.targetV = Math.round(targetV * 100) / 100;
        row.minBand = Math.round(targetV * (1 - bandRatio) * 100) / 100;
        row.maxBand = Math.round(targetV * (1 + bandRatio) * 100) / 100;

        runningPoolCumulative = baseInitialPool;
        row.poolCumulative = runningPoolCumulative;
        row.totalAsset = evalE;
      } else {
        // 1주차 이상: 이번 주차의 예수금 변화액(poolDelta)을 즉시 적용한 갱신 Pool 자산으로 V2 계산!
        const prevV = sorted[i - 1].targetV;
        const delta = row.poolDelta || 0;
        
        runningPoolCumulative = (sorted[i - 1].poolCumulative || baseInitialPool) + delta;
        row.poolCumulative = Math.round(runningPoolCumulative * 100) / 100;

        const nextV = vrEngine.calculateNextV({
          v1: prevV,
          pool: runningPoolCumulative,
          E: evalE,
          G: gVal,
          deposit: 0
        });

        row.targetV = Math.round(nextV * 100) / 100;
        row.minBand = Math.round(nextV * (1 - bandRatio) * 100) / 100;
        row.maxBand = Math.round(nextV * (1 + bandRatio) * 100) / 100;
        row.totalAsset = evalE;
      }
    }

    stock.history = sorted;

    const last = sorted[sorted.length - 1];
    if (last) {
      stock.v1 = last.targetV;
      stock.holdings = last.qty;
    }

    this.saveData();
  }

  deleteWeeklyRecord(stockId, weekNum) {
    const stock = (this.data.stocks || []).find(s => s.id === stockId);
    if (stock && stock.history) {
      stock.history = stock.history.filter(h => h.week !== parseInt(weekNum));
      
      const sorted = [...stock.history].sort((a, b) => a.week - b.week);
      const lastRecord = sorted[sorted.length - 1];
      if (lastRecord) {
        stock.v1 = lastRecord.targetV;
        stock.holdings = lastRecord.qty;
      }
      this.saveData();
    }
  }

  setInitial0WeekHistory(stockId, { startDate, qty, pool, closePrice, userTargetV }) {
    const stock = (this.data.stocks || []).find(s => s.id === stockId);
    if (stock) {
      const cycleWeeks = stock.cycleWeeks || 2;
      const gVal = stock.G || 15;
      const bandRatio = (stock.vrBandPercent || 15) / 100;

      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + (cycleWeeks * 7 - 1));

      const formatDateStr = (d) => {
        const yy = String(d.getFullYear()).slice(2);
        const mm = d.getMonth() + 1;
        const dd = d.getDate();
        return `${yy}.${mm}.${dd}`;
      };

      const dateText = `${formatDateStr(start)}~${end.getMonth() + 1}.${end.getDate()}`;

      const finalPrice = (closePrice && !isNaN(closePrice)) ? closePrice : (stock.currentPrice || stock.avgPrice || 36.4);
      const initialQty = parseFloat(qty);
      const evalE = initialQty * finalPrice;
      const poolAmount = Math.abs(parseFloat(pool) || 47918.9);

      stock.vrTargetValue = poolAmount;

      const targetV = (userTargetV && !isNaN(userTargetV) && parseFloat(userTargetV) > 0) ? parseFloat(userTargetV) : evalE;
      
      const minBand = targetV * (1 - bandRatio);
      const maxBand = targetV * (1 + bandRatio);

      stock.holdings = initialQty;
      stock.avgPrice = finalPrice;
      stock.v1 = targetV;

      const record0 = {
        week: 0,
        date: dateText,
        price: finalPrice,
        g: gVal,
        evalE: Math.round(evalE * 100) / 100,
        targetV: Math.round(targetV * 100) / 100,
        minBand: Math.round(minBand * 100) / 100,
        maxBand: Math.round(maxBand * 100) / 100,
        poolDelta: 0,
        poolCumulative: poolAmount,
        totalAsset: Math.round(evalE * 100) / 100,
        profitPercent: 0,
        profitAmount: 0,
        qty: initialQty,
        avgPrice: finalPrice
      };

      stock.history = [record0];
      this.saveData();
    }
  }

  addWeeklyRecord(stockId, record) {
    const stock = (this.data.stocks || []).find(s => s.id === stockId);
    if (stock) {
      if (!stock.history) stock.history = [];
      stock.history.push(record);
      
      stock.v1 = record.targetV;
      stock.holdings = record.qty;

      this.saveData();
    }
  }

  addTransaction(tx) {
    tx.id = 'tx_' + Date.now();
    this.data.transactions.unshift(tx);
    this.recalculateHoldings(tx.stockId);
    this.saveData();
  }

  addStock(stock) {
    stock.id = 'stk_' + Date.now();
    stock.holdings = stock.holdings || 0;
    stock.avgPrice = stock.avgPrice || 0;
    stock.history = stock.history || [];
    this.data.stocks.push(stock);
    this.saveData();
  }

  updateStockPrice(stockId, newPrice) {
    const stock = this.data.stocks.find(s => s.id === stockId);
    if (stock) {
      stock.currentPrice = parseFloat(newPrice);
      this.saveData();
    }
  }

  recalculateHoldings(stockId) {
    const stockTxs = this.data.transactions
      .filter(t => t.stockId === stockId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let currentQty = 0;
    let totalCost = 0;

    stockTxs.forEach(tx => {
      const qty = parseFloat(tx.quantity);
      const price = parseFloat(tx.price);
      
      if (tx.type === 'BUY') {
        currentQty += qty;
        totalCost += (qty * price);
      } else if (tx.type === 'SELL') {
        if (currentQty > 0) {
          const currentAvg = totalCost / currentQty;
          currentQty -= qty;
          totalCost -= (qty * currentAvg);
        }
      }
    });

    const stock = this.data.stocks.find(s => s.id === stockId);
    if (stock) {
      stock.holdings = Math.max(0, currentQty);
      stock.avgPrice = currentQty > 0 ? totalCost / currentQty : 0;
    }
  }
}

export const appStore = new Store();
if (typeof window !== 'undefined') {
  window.appStore = appStore;
}
