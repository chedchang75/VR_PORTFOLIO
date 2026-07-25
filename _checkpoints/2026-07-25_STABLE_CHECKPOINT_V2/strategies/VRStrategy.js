/* ==========================================================================
   VRSTRATEGY.JS - ACCURATE VALUE REBALANCING (VR) GRID ENGINE IMPLEMENTATION
   ========================================================================== */

import { StrategyInterface } from './StrategyInterface.js';

export class VRStrategy extends StrategyInterface {
  /**
   * Calculates next cycle target V2 value based on User VR Formula:
   * V2 = V1 + (pool / G) + ((E - V1) / (2 * sqrt(G))) + deposit
   */
  calculateNextV({ v1, pool, E, G = 10, deposit = 0 }) {
    const safeG = Math.max(1, Math.min(20, Number(G) || 10));
    const term1 = Number(v1) || 0;
    const term2 = (Number(pool) || 0) / safeG;
    const term3 = ((Number(E) || 0) - term1) / (2 * Math.sqrt(safeG));
    const term4 = Number(deposit) || 0;

    const v2 = term1 + term2 + term3 + term4;
    return Math.round(v2 * 100) / 100;
  }

  /**
   * Generates step-by-step Buy and Sell Grid Order Matrix (as requested in Attachment 2)
   * 
   * @param {Object} params
   * @param {number} params.minBandVal Minimum Band value (최소값)
   * @param {number} params.maxBandVal Maximum Band value (최대값)
   * @param {number} params.baseQty Base stock count of previous cycle (직전 주차 주식보유개수)
   * @param {number} params.pool Available Cash Pool (보유 현금)
   * @param {number} params.qtyStep Stock quantity interval per order step (개수간격, default: 20)
   * @param {number} params.buyLimitRatio Max buying limit ratio of Pool (매수한도 %, default: 0.25)
   * @returns {Object} { buyGrid: [], sellGrid: [], remainingPoolLimit }
   */
  generateGridOrders({ minBandVal, maxBandVal, baseQty, pool, qtyStep = 20, buyLimitRatio = 0.25 }) {
    const step = Math.max(1, Number(qtyStep) || 20);
    const initialQty = Math.max(1, Number(baseQty) || 100);
    const initialPool = Number(pool) || 0;
    const maxBuyCostLimit = initialPool * buyLimitRatio; // 25% of pool limit

    const buyGrid = [];
    let currentQtyBuy = initialQty;
    let currentPoolBuy = initialPool;
    let totalSpentBuy = 0;

    // Generate Buy Grid Steps (Within 25% Pool Limit)
    while (totalSpentBuy < maxBuyCostLimit && currentPoolBuy > 0) {
      // Buy Trigger Price = Minimum Band / Current Stock Count
      const buyPrice = minBandVal / currentQtyBuy;
      const buyCost = step * buyPrice;

      if (totalSpentBuy + buyCost > maxBuyCostLimit) break;

      totalSpentBuy += buyCost;
      currentPoolBuy -= buyCost;
      currentQtyBuy += step;

      buyGrid.push({
        stepQty: step,
        remainingQty: currentQtyBuy, // 잔여개수
        buyPrice: Math.round(buyPrice * 100) / 100, // 매수점
        buyCost: Math.round(buyCost * 100) / 100,
        pool: Math.round(currentPoolBuy * 100) / 100 // 남을 Pool
      });

      if (buyGrid.length >= 30) break; // Safety cap
    }

    const sellGrid = [];
    let currentQtySell = initialQty;
    let currentPoolSell = initialPool;

    // Generate Sell Grid Steps (Within Available Stock Qty)
    while (currentQtySell > step) {
      // Sell Trigger Price = Maximum Band / Current Stock Count
      const sellPrice = maxBandVal / currentQtySell;
      const sellIncome = step * sellPrice;

      currentPoolSell += sellIncome;
      currentQtySell -= step;

      sellGrid.push({
        stepQty: step,
        remainingQty: currentQtySell, // 잔여개수
        sellPrice: Math.round(sellPrice * 100) / 100, // 매도점
        sellIncome: Math.round(sellIncome * 100) / 100,
        pool: Math.round(currentPoolSell * 100) / 100 // Pool
      });

      if (sellGrid.length >= 30) break; // Safety cap
    }

    return {
      buyGrid,
      sellGrid,
      maxBuyCostLimit,
      remainingPoolLimit: Math.round((initialPool - maxBuyCostLimit) * 100) / 100
    };
  }

  /**
   * Evaluates buy/sell signal by comparing real-time evaluation E with Min/Max Bands and Grid Matrix.
   */
  evaluate({ currentPrice, holdingItem, strategyParams }) {
    const { qty = 0, avgPrice = 0, evaluationAmount = 0 } = holdingItem;

    // Strategy Parameters
    const v1 = Number(strategyParams.v1) || (qty > 0 ? (qty * (avgPrice || currentPrice)) : 100000);
    const pool = Number(strategyParams.pool) || 30000;
    const G = Number(strategyParams.G) || 10;
    const deposit = Number(strategyParams.deposit) || 0;
    const bandRatio = (Number(strategyParams.bandPercent) || 15) / 100;
    const cycleWeeks = Number(strategyParams.cycleWeeks) || 2;
    const qtyStep = Number(strategyParams.qtyStep) || 20; // 개수간격 (기본 20)
    const buyLimitPercent = Number(strategyParams.buyLimitPercent) || 25; // 매수한도 (기본 25%)

    // Calculate Current Period Target V2
    const currentE = qty > 0 ? (qty * currentPrice) : evaluationAmount;
    const v2 = this.calculateNextV({ v1, pool, E: currentE, G, deposit });

    // Calculate Min & Max Band Limits
    const minBandVal = v2 * (1 - bandRatio);
    const maxBandVal = v2 * (1 + bandRatio);

    // Generate Step-by-Step Grid Order Tables (Attachment 2)
    const baseQty = qty > 0 ? qty : 100;
    const gridOrders = this.generateGridOrders({
      minBandVal,
      maxBandVal,
      baseQty,
      pool,
      qtyStep,
      buyLimitRatio: buyLimitPercent / 100
    });

    // 1st Step Triggers
    const firstBuyTrigger = gridOrders.buyGrid[0] ? gridOrders.buyGrid[0].buyPrice : (minBandVal / baseQty);
    const firstSellTrigger = gridOrders.sellGrid[0] ? gridOrders.sellGrid[0].sellPrice : (maxBandVal / baseQty);

    let signalType = 'HOLD';
    let message = `${cycleWeeks}주 주기 관망 (현재가 ₩${currentPrice.toLocaleString()} / 1차 매수점: ₩${firstBuyTrigger.toFixed(2)}, 1차 매도점: ₩${firstSellTrigger.toFixed(2)})`;
    let targetQty = 0;

    // Check Trigger
    if (currentPrice <= firstBuyTrigger && currentPrice > 0) {
      signalType = 'BUY';
      targetQty = qtyStep;
      message = `[VR 매수신호] 현재가가 1차 매수점(₩${firstBuyTrigger.toFixed(2)}) 이하 달성! ${qtyStep}주 매수 주문 권장 (예수금 25% 한도 내)`;
    } else if (currentPrice >= firstSellTrigger && currentPrice > 0 && qty > 0) {
      signalType = 'SELL';
      targetQty = qtyStep;
      message = `[VR 매도신호] 현재가가 1차 매도점(₩${firstSellTrigger.toFixed(2)}) 이상 달성! ${qtyStep}주 매도 주문 권장`;
    }

    return {
      signalType,
      message,
      targetQty,
      v1,
      v2,
      minBandVal,
      maxBandVal,
      buyTargetPrice: Math.round(firstBuyTrigger * 100) / 100,
      sellTargetPrice: Math.round(firstSellTrigger * 100) / 100,
      cycleWeeks,
      G,
      bandPercent: bandRatio * 100,
      pool,
      qtyStep,
      buyLimitPercent,
      gridOrders
    };
  }
}
