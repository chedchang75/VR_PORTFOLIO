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
  "usdExchangeRate": 1462.59,
  "stocks": [
    {
      "id": "stk_1",
      "code": "TQQQ",
      "name": "ProShares UltraPro QQQ",
      "currency": "USD",
      "currentPrice": 64,
      "targetBuyPrice": 65,
      "targetSellPrice": 85,
      "strategyType": "VR",
      "cycleWeeks": 2,
      "vrBandPercent": 15,
      "G": 15,
      "v1": 327365.03,
      "vrTargetValue": 47918.9,
      "holdings": 4257,
      "avgPrice": 39.349557432526844,
      "history": [
        {
          "week": 0,
          "date": "25.10.27~11.9",
          "price": 52.89,
          "g": 15,
          "evalE": 227321.22,
          "targetV": 225572.43,
          "minBand": 191736.57,
          "maxBand": 259408.29,
          "poolDelta": 47918.9,
          "poolCumulative": 47918.9,
          "totalAsset": 227321.22,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4298,
          "avgPrice": 52.89
        },
        {
          "week": 2,
          "date": "25.11.10~11.23",
          "price": 47.48,
          "g": 15,
          "evalE": 204069.04,
          "targetV": 225990.95,
          "minBand": 192092.31,
          "maxBand": 259889.59,
          "poolDelta": 0,
          "poolCumulative": 47918.9,
          "totalAsset": 204069.04,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4298,
          "avgPrice": 52.89
        },
        {
          "week": 4,
          "date": "25.11.24~12.7",
          "price": 56.15,
          "g": 15,
          "evalE": 241332.7,
          "targetV": 231166.15,
          "minBand": 196491.23,
          "maxBand": 265841.07,
          "poolDelta": 0,
          "poolCumulative": 47918.9,
          "totalAsset": 241332.7,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4298,
          "avgPrice": 52.89
        },
        {
          "week": 6,
          "date": "25.12.8~12.21",
          "price": 53.52,
          "g": 15,
          "evalE": 230028.96,
          "targetV": 234213.93,
          "minBand": 199081.84,
          "maxBand": 269346.02,
          "poolDelta": 0,
          "poolCumulative": 47918.9,
          "totalAsset": 230028.96,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4298,
          "avgPrice": 52.89
        },
        {
          "week": 8,
          "date": "25.12.22~1.4",
          "price": 52.35,
          "g": 15,
          "evalE": 225000.3,
          "targetV": 236219.05,
          "minBand": 200786.19,
          "maxBand": 271651.91,
          "poolDelta": 0,
          "poolCumulative": 47918.9,
          "totalAsset": 225000.3,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4298,
          "avgPrice": 52.89
        },
        {
          "week": 10,
          "date": "25.1.5~1.18",
          "price": 54.14,
          "g": 15,
          "evalE": 232693.72,
          "targetV": 238958.53,
          "minBand": 203114.75,
          "maxBand": 274802.31,
          "poolDelta": 0,
          "poolCumulative": 47918.9,
          "totalAsset": 232693.72,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4298,
          "avgPrice": 52.89
        },
        {
          "week": 12,
          "date": "25.1.19~2.1",
          "price": 54,
          "g": 15,
          "evalE": 232092,
          "targetV": 241266.66,
          "minBand": 205076.66,
          "maxBand": 277456.66,
          "poolDelta": 0,
          "poolCumulative": 47918.9,
          "totalAsset": 232092,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4298,
          "avgPrice": 37.338211382113826
        },
        {
          "week": 14,
          "date": "25.2.2~2.15",
          "price": 48.47,
          "g": 15,
          "evalE": 206336.79,
          "targetV": 240710.28,
          "minBand": 204603.74,
          "maxBand": 276816.82,
          "poolDelta": -7489.4,
          "poolCumulative": 40429.5,
          "totalAsset": 216079.26,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4257,
          "avgPrice": 37.91656488549619
        },
        {
          "week": 16,
          "date": "25.2.16~3.1",
          "price": 49.52,
          "g": 15,
          "evalE": 220760.16,
          "targetV": 240830.03,
          "minBand": 204705.53,
          "maxBand": 276954.53,
          "poolDelta": 0,
          "poolCumulative": 40429.5,
          "totalAsset": 220760.16,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4458,
          "avgPrice": 37.91656488549619
        },
        {
          "week": 18,
          "date": "25.3.2~3.15",
          "price": 45.93,
          "g": 15,
          "evalE": 207511.74,
          "targetV": 239041.1,
          "minBand": 203184.94,
          "maxBand": 274897.27,
          "poolDelta": -2742.8,
          "poolCumulative": 37686.7,
          "totalAsset": 207511.74,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4518,
          "avgPrice": 38.20323529411765
        },
        {
          "week": 20,
          "date": "25.3.16~3.29",
          "price": 38.78,
          "g": 15,
          "evalE": 182964.04,
          "targetV": 233746.03,
          "minBand": 198684.13,
          "maxBand": 268807.93,
          "poolDelta": -8520,
          "poolCumulative": 29166.7,
          "totalAsset": 182964.04,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4718,
          "avgPrice": 38.723436819172115
        },
        {
          "week": 22,
          "date": "25.3.30~4.12",
          "price": 49.17,
          "g": 15,
          "evalE": 238867.86,
          "targetV": 236000.02,
          "minBand": 200600.02,
          "maxBand": 271400.02,
          "poolDelta": -5275.2,
          "poolCumulative": 23891.5,
          "totalAsset": 238867.86,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4858,
          "avgPrice": 38.68021754263836
        },
        {
          "week": 24,
          "date": "25.4.13~4.26",
          "price": 62.52,
          "g": 15,
          "evalE": 303722.16,
          "targetV": 249669.01,
          "minBand": 212218.66,
          "maxBand": 287119.36,
          "poolDelta": 50000,
          "poolCumulative": 73891.5,
          "totalAsset": 303722.16,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4858,
          "avgPrice": 38.68021754263836
        },
        {
          "week": 26,
          "date": "25.4.27~5.10",
          "price": 76.28,
          "g": 15,
          "evalE": 340056.24,
          "targetV": 267933.92,
          "minBand": 227743.83,
          "maxBand": 308124.01,
          "poolDelta": 25048,
          "poolCumulative": 98939.5,
          "totalAsset": 340056.24,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4458,
          "avgPrice": 38.68021754263836
        },
        {
          "week": 28,
          "date": "25.5.11~5.24",
          "price": 77.84,
          "g": 15,
          "evalE": 339226.72,
          "targetV": 284252.55,
          "minBand": 241614.67,
          "maxBand": 326890.43,
          "poolDelta": 7782,
          "poolCumulative": 106721.5,
          "totalAsset": 339226.72,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4358,
          "avgPrice": 38.68021754263835
        },
        {
          "week": 30,
          "date": "25.5.25~6.7",
          "price": 73.05,
          "g": 15,
          "evalE": 316817.85,
          "targetV": 297235.68,
          "minBand": 252650.33,
          "maxBand": 341821.03,
          "poolDelta": 24963,
          "poolCumulative": 131684.5,
          "totalAsset": 316817.85,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4337,
          "avgPrice": 38.68021754263835
        },
        {
          "week": 32,
          "date": "25.6.8~6.21",
          "price": 82.87,
          "g": 15,
          "evalE": 352777.59,
          "targetV": 313633.68,
          "minBand": 266588.63,
          "maxBand": 360678.73,
          "poolDelta": 6729,
          "poolCumulative": 138413.5,
          "totalAsset": 352777.59,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4257,
          "avgPrice": 39.349557432526844
        },
        {
          "week": 34,
          "date": "25.6.22~7.5",
          "price": 73.35,
          "g": 15,
          "evalE": 312250.95,
          "targetV": 322682.74,
          "minBand": 274280.33,
          "maxBand": 371085.15,
          "poolDelta": 0,
          "poolCumulative": 138413.5,
          "totalAsset": 312250.95,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4257,
          "avgPrice": 39.349557432526844
        },
        {
          "week": 36,
          "date": "25.7.6~7.19",
          "price": 67.53,
          "g": 15,
          "evalE": 287475.21,
          "targetV": 327365.03,
          "minBand": 278260.28,
          "maxBand": 376469.78,
          "poolDelta": 0,
          "poolCumulative": 138413.5,
          "totalAsset": 287475.21,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 4257,
          "avgPrice": 39.349557432526844
        }
      ],
      "qtyStep": 20
    },
    {
      "id": "stk_2",
      "code": "005930",
      "name": "삼성전자",
      "currency": "KRW",
      "currentPrice": 249500,
      "targetBuyPrice": 70000,
      "targetSellPrice": 82000,
      "strategyType": "VR",
      "cycleWeeks": 2,
      "vrBandPercent": 10,
      "G": 10,
      "v1": 79285000,
      "vrTargetValue": 5000000,
      "holdings": 314,
      "avgPrice": 249500,
      "history": [
        {
          "week": 0,
          "date": "26.7.13~7.26",
          "price": 252500,
          "g": 10,
          "evalE": 79285000,
          "targetV": 79285000,
          "minBand": 71356500,
          "maxBand": 87213500,
          "poolDelta": 0,
          "poolCumulative": 5000000,
          "totalAsset": 79285000,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 314,
          "avgPrice": 249500
        }
      ],
      "qtyStep": 2
    },
    {
      "code": "423920",
      "name": "TIGER반도체레버러지",
      "currency": "KRW",
      "currentPrice": 104410,
      "targetBuyPrice": 93969,
      "targetSellPrice": 114851.00000000001,
      "strategyType": "VR",
      "cycleWeeks": 2,
      "vrBandPercent": 15,
      "G": 10,
      "qtyStep": 5,
      "buyLimitPercent": 25,
      "v1": 30278900,
      "vrTargetValue": 13000000,
      "holdings": 290,
      "avgPrice": 104410,
      "history": [
        {
          "week": 0,
          "date": "26.7.13~7.26",
          "price": 104410,
          "g": 10,
          "evalE": 30278900,
          "targetV": 30278900,
          "minBand": 25737065,
          "maxBand": 34820735,
          "poolDelta": 0,
          "poolCumulative": 13000000,
          "totalAsset": 30278900,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 290,
          "avgPrice": 104410
        }
      ],
      "id": "stk_1784983259776"
    },
    {
      "code": "122630",
      "name": "KODEX200레버러지",
      "currency": "KRW",
      "currentPrice": 113390,
      "targetBuyPrice": 102051,
      "targetSellPrice": 124729.00000000001,
      "strategyType": "VR",
      "cycleWeeks": 2,
      "vrBandPercent": 10,
      "G": 10,
      "qtyStep": 5,
      "buyLimitPercent": 25,
      "v1": 29821570,
      "vrTargetValue": 3000000,
      "holdings": 263,
      "avgPrice": 113390,
      "history": [
        {
          "week": 0,
          "date": "26.7.13~7.26",
          "price": 113390,
          "g": 15,
          "evalE": 29821570,
          "targetV": 29821570,
          "minBand": 25348334.5,
          "maxBand": 34294805.5,
          "poolDelta": 0,
          "poolCumulative": 3000000,
          "totalAsset": 29821570,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 263,
          "avgPrice": 113390
        }
      ],
      "id": "stk_1784984477141"
    },
    {
      "code": "000660",
      "name": "하이닉스",
      "currency": "KRW",
      "currentPrice": 1759000,
      "targetBuyPrice": 1583100,
      "targetSellPrice": 1934900.0000000002,
      "strategyType": "VR",
      "cycleWeeks": 2,
      "vrBandPercent": 20,
      "G": 15,
      "qtyStep": 1,
      "buyLimitPercent": 25,
      "v1": 46306000,
      "vrTargetValue": 10000000,
      "holdings": 26,
      "avgPrice": 1759000,
      "history": [
        {
          "week": 0,
          "date": "26.7.13~7.26",
          "price": 1781000,
          "g": 15,
          "evalE": 46306000,
          "targetV": 46306000,
          "minBand": 39360100,
          "maxBand": 53251900,
          "poolDelta": 0,
          "poolCumulative": 10000000,
          "totalAsset": 46306000,
          "profitPercent": 0,
          "profitAmount": 0,
          "qty": 26,
          "avgPrice": 1759000
        }
      ],
      "id": "stk_1784984793701"
    }
  ],
  "transactions": [
    {
      "stockId": "stk_1",
      "type": "SELL",
      "date": "2026-06-15",
      "quantity": 20,
      "price": 84.74,
      "fee": 0,
      "id": "tx_1784980556648"
    },
    {
      "stockId": "stk_1",
      "type": "SELL",
      "date": "2026-06-15",
      "quantity": 20,
      "price": 84.32,
      "fee": 0,
      "id": "tx_1784980556648"
    },
    {
      "stockId": "stk_1",
      "type": "SELL",
      "date": "2026-06-15",
      "quantity": 20,
      "price": 83.9,
      "fee": 0,
      "id": "tx_1784980556648"
    },
    {
      "stockId": "stk_1",
      "type": "SELL",
      "date": "2026-06-15",
      "quantity": 20,
      "price": 83.49,
      "fee": 0,
      "id": "tx_1784980556648"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-06-15",
      "quantity": 20,
      "price": 84.74,
      "fee": 0,
      "id": "tx_1784980491767"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-06-15",
      "quantity": 20,
      "price": 84.32,
      "fee": 0,
      "id": "tx_1784980491767"
    },
    {
      "stockId": "stk_1",
      "type": "SELL",
      "date": "2026-06-15",
      "quantity": 20,
      "price": 83.9,
      "fee": 0,
      "id": "tx_1784980491767"
    },
    {
      "stockId": "stk_1",
      "type": "SELL",
      "date": "2026-06-15",
      "quantity": 20,
      "price": 83.49,
      "fee": 0,
      "id": "tx_1784980491766"
    },
    {
      "stockId": "stk_1",
      "type": "SELL",
      "date": "2026-06-01",
      "quantity": 100,
      "price": 85.89,
      "fee": 0,
      "id": "tx_1784980190319"
    },
    {
      "stockId": "stk_1",
      "type": "SELL",
      "date": "2026-05-14",
      "quantity": 100,
      "price": 77.82,
      "fee": 0,
      "id": "tx_1784980121502"
    },
    {
      "stockId": "stk_1",
      "type": "SELL",
      "date": "2026-04-27",
      "quantity": 400,
      "price": 62.62,
      "fee": 0,
      "id": "tx_1784980049553"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-03-30",
      "quantity": 140,
      "price": 37.68,
      "fee": 0,
      "id": "tx_1784979843772"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-03-20",
      "quantity": 200,
      "price": 42.6,
      "fee": 0,
      "id": "tx_1784979675527"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-03-30",
      "quantity": 140,
      "price": 37.68,
      "fee": 0,
      "id": "tx_1784979634024"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-03-20",
      "quantity": 200,
      "price": 42.6,
      "fee": 0,
      "id": "tx_1784979634024"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-03-09",
      "quantity": 20,
      "price": 45.51,
      "fee": 0,
      "id": "tx_1784979467341"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-03-09",
      "quantity": 20,
      "price": 45.71,
      "fee": 0,
      "id": "tx_1784979467341"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-03-03",
      "quantity": 20,
      "price": 45.92,
      "fee": 0,
      "id": "tx_1784979467341"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-03-09",
      "quantity": 20,
      "price": 45.51,
      "fee": 0,
      "id": "tx_1784979346634"
    },
    {
      "stockId": "stk_1",
      "type": "SELL",
      "date": "2026-03-09",
      "quantity": 20,
      "price": 45.71,
      "fee": 0,
      "id": "tx_1784979346634"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-03-03",
      "quantity": 20,
      "price": 45.92,
      "fee": 0,
      "id": "tx_1784979346634"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 20,
      "price": 46.21,
      "fee": 0,
      "id": "tx_1784978246210"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 20,
      "price": 46.42,
      "fee": 0,
      "id": "tx_1784978246210"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 20,
      "price": 46.63,
      "fee": 0,
      "id": "tx_1784978246210"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 20,
      "price": 46.84,
      "fee": 0,
      "id": "tx_1784978246210"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 20,
      "price": 47.04,
      "fee": 0,
      "id": "tx_1784978246210"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 60,
      "price": 47.11,
      "fee": 0,
      "id": "tx_1784978246210"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 20,
      "price": 46.21,
      "fee": 0,
      "id": "tx_1784977785784"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 20,
      "price": 46.42,
      "fee": 0,
      "id": "tx_1784977785784"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 20,
      "price": 46.63,
      "fee": 0,
      "id": "tx_1784977785783"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 20,
      "price": 46.84,
      "fee": 0,
      "id": "tx_1784977785782"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 20,
      "price": 47.04,
      "fee": 0,
      "id": "tx_1784977785782"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 60,
      "price": 47.11,
      "fee": 0,
      "id": "tx_1784977785781"
    },
    {
      "stockId": "stk_1",
      "type": "BUY",
      "date": "2026-02-05",
      "quantity": 60,
      "price": 47.11,
      "fee": 0,
      "id": "tx_1784977534008"
    },
    {
      "id": "tx_1",
      "stockId": "stk_1",
      "date": "2026-01-25",
      "type": "BUY",
      "quantity": 2240,
      "price": 36.4,
      "fee": 5
    },
    {
      "id": "tx_2",
      "stockId": "stk_2",
      "date": "2026-01-25",
      "type": "BUY",
      "quantity": 50,
      "price": 71000,
      "fee": 500
    },
    {
      "id": "tx_3",
      "stockId": "stk_3",
      "date": "2026-01-25",
      "type": "BUY",
      "quantity": 30,
      "price": 105,
      "fee": 1.2
    }
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

  deleteStock(stockId) {
    if (this.data.stocks) {
      this.data.stocks = this.data.stocks.filter(s => s.id !== stockId);
      this.saveData();
    }
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
