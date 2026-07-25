/* ==========================================================================
   STRATEGYINTERFACE.JS - BASE ABSTRACT STRATEGY INTERFACE
   ========================================================================== */

export class StrategyInterface {
  /**
   * Evaluates buy/sell signal for a stock based on current market state and VR parameters.
   * @param {Object} params
   * @param {number} params.currentPrice Current stock price
   * @param {Object} params.holdingItem Current holding state { qty, avgPrice, evaluationAmount }
   * @param {Object} params.strategyParams VR strategy parameters { v1, pool, G, bandRatio, cycleWeeks, deposit }
   * @returns {Object} Signal evaluation result
   */
  evaluate({ currentPrice, holdingItem, strategyParams }) {
    throw new Error('evaluate() method must be implemented by concrete strategy class.');
  }

  /**
   * Calculates next cycle target V2 value based on VR Formula:
   * V2 = V1 + (pool / G) + ((E - V1) / (2 * sqrt(G))) + deposit
   */
  calculateNextV({ v1, pool, E, G = 10, deposit = 0 }) {
    throw new Error('calculateNextV() method must be implemented by concrete strategy class.');
  }
}
