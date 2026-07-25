/**
 * Main Mobile App Logic & UI Renderer with Integrated VRStrategy Engine, Chart.js & Real-time/Historical Price API
 */

import { appStore } from './store.js';
import { VRStrategy } from '../strategies/VRStrategy.js';
import { priceFetcher } from './priceFetcher.js';

const vrEngine = new VRStrategy();
let modalHistoryChartInstance = null; // 모달 내 Chart.js 인스턴스 참조
let onTradeSuccessCallback = null; // 매매 작성 완료 시 연동 콜백

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  bindNavigation();
  bindModalEvents();
  bindDetailModalTabs();
  bindRefreshEvents();
  bindBackupEvents();
  bindInit0WeekEvents();
  bindEditWeekEvents();
  bindAddWeekEvents();
  bindClearHistoryEvents();
  bindRecalculateAllEvents();
  bindBatchTradeEvents();
  bindAddNewStockEvents();
  
  // 최초 실행 시 실시간 환율 & 종목 현재가 자동 연동
  refreshRealtimePrices();

  renderDashboard();
  renderTransactions();
  renderStrategies();
  renderSimulator();
}

// ⭐ PC / 모바일 포트폴리오 백업(내보내기) & 복원(불러오기) 이벤트
function bindBackupEvents() {
  const btnExport = document.getElementById('btn-export-json');
  const btnImport = document.getElementById('btn-import-json');
  const btnGithubSync = document.getElementById('btn-github-sync');
  const fileInput = document.getElementById('import-json-file');

  if (btnGithubSync) {
    btnGithubSync.addEventListener('click', async () => {
      if (confirm('☁️ GitHub 저장소 (chedchang75/VR_PORTFOLIO)의 최신 데이터로 동기화하시겠습니까?')) {
        const res = await appStore.syncFromGitHubRepository();
        alert(res.message);
        if (res.success) {
          renderDashboard();
          renderTransactions();
          renderStrategies();
        }
      }
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appStore.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `VR_Portfolio_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      alert('📤 PC/모바일 포트폴리오 백업 파일(JSON)이 다운로드되었습니다!');
    });
  }

  if (btnImport && fileInput) {
    btnImport.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          if (importedData && importedData.stocks) {
            appStore.data = importedData;
            appStore.saveData();
            renderDashboard();
            renderTransactions();
            renderStrategies();
            alert('📥 백업 파일의 종목 및 매매일지 데이터가 성공적으로 100% 동기화 복원되었습니다!');
          } else {
            alert('올바른 백업 JSON 파일 형식이 아닙니다.');
          }
        } catch (err) {
          console.error('Failed to parse backup JSON:', err);
          alert('파일을 읽는 도중 오류가 발생했습니다.');
        }
      };
      reader.readAsText(file);
    });
  }
}

// ⭐ 신규 종목 포트폴리오 추가 모달 이벤트 바인딩
function bindAddNewStockEvents() {
  const btnAdd = document.getElementById('btn-add-new-stock');
  const modal = document.getElementById('add-stock-modal');
  const form = document.getElementById('add-stock-form');

  if (btnAdd && modal) {
    btnAdd.addEventListener('click', () => {
      modal.classList.add('active');
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const code = document.getElementById('new-stock-code').value.trim().toUpperCase();
      const name = document.getElementById('new-stock-name').value.trim();
      const currency = document.getElementById('new-stock-currency').value;
      const price = parseFloat(document.getElementById('new-stock-price').value || 0);
      const cycleWeeks = parseInt(document.getElementById('new-stock-cycle').value || 2);
      const gVal = cycleWeeks === 2 ? 15 : 10;

      if (!code || !name) {
        alert('종목 코드와 종목명을 입력해주세요.');
        return;
      }

      const newStock = {
        code,
        name,
        currency,
        currentPrice: price,
        targetBuyPrice: price * 0.9,
        targetSellPrice: price * 1.1,
        strategyType: 'VR',
        cycleWeeks,
        vrBandPercent: 15,
        G: gVal,
        qtyStep: 20,
        buyLimitPercent: 25,
        v1: 0,
        vrTargetValue: 0,
        holdings: 0,
        avgPrice: price,
        history: []
      };

      appStore.addStock(newStock);
      modal.classList.remove('active');
      form.reset();

      renderDashboard();
      renderStrategies();

      alert(`✅ [${name} (${code})] 신규 종목이 포트폴리오에 성공적으로 추가되었습니다!\n💡 종목 클릭 ➔ '🌱 0주차 설정'에서 보유수량과 예수금을 등록하실 수 있습니다.`);
    });
  }
}

// 메인 3개 탭 네비게이션 처리 (상단 자산 카드 토글 추가)
function bindNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabViews = document.querySelectorAll('.tab-view');
  const summaryCard = document.querySelector('.summary-card');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      navItems.forEach(n => n.classList.remove('active'));
      tabViews.forEach(v => v.classList.remove('active'));

      item.classList.add('active');
      const activeView = document.getElementById(`view-${targetTab}`);
      if (activeView) {
        activeView.classList.add('active');
      }

      // ⭐ [요청1] 대시보드 탭일 때만 상단 요약 자산정보 카드 표시, 매매일지/전략설정 탭은 숨김!
      if (summaryCard) {
        if (targetTab === 'dashboard') {
          summaryCard.style.display = 'block';
        } else {
          summaryCard.style.display = 'none';
        }
      }
    });
  });
}

// 상세 모달 내부 탭 이벤트
function bindDetailModalTabs() {
  const tabBtns = document.querySelectorAll('.detail-tab-btn');
  const tabContents = document.querySelectorAll('.detail-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-detail-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const content = document.getElementById(`detail-tab-${targetTab}`);
      if (content) {
        content.classList.add('active');

        if (targetTab === 'progress-history' && window.currentModalStock) {
          const historyData = appStore.getStockHistory(window.currentModalStock.id);
          renderModalVRHistoryChart(historyData, window.currentModalStock.currency);
          renderModalWeeklyHistoryTable(historyData, window.currentModalStock.currency);
        }
      }
    });
  });
}

// 실시간 시세 & 환율 갱신 이벤트 바인딩
function bindRefreshEvents() {
  const btnRefresh = document.getElementById('btn-refresh-prices');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      refreshRealtimePrices();
    });
  }
}

// ⭐ 전체 수식 재계산(업데이트) 버튼 이벤트 바인딩
function bindRecalculateAllEvents() {
  const btnRecalc = document.getElementById('btn-modal-recalculate-all');
  if (btnRecalc) {
    btnRecalc.addEventListener('click', () => {
      if (!window.currentModalStock) return;
      const stock = window.currentModalStock;

      btnRecalc.textContent = '⏳ 연쇄 수식 업데이트 중...';
      btnRecalc.disabled = true;

      setTimeout(() => {
        try {
          appStore.recalculateAllWeeklyHistory(stock.id);
          
          const updatedStock = appStore.getStocks().find(s => s.id === stock.id);
          if (updatedStock) {
            window.currentModalStock = updatedStock;
            const historyData = appStore.getStockHistory(updatedStock.id);
            renderModalVRHistoryChart(historyData, updatedStock.currency);
            renderModalWeeklyHistoryTable(historyData, updatedStock.currency);
            openStockDetailModal(updatedStock);
          }

          alert(`⚡ [${stock.name}] 종목의 전체 주차가 변경된 예수금(Pool)을 즉시 적용하여 목표가치 V 수식이 정교하게 연쇄 업데이트되었습니다!`);
        } catch (e) {
          console.error('Failed to recalculate weekly formulas', e);
          alert('수식 업데이트 중 오류가 발생했습니다.');
        } finally {
          btnRecalc.textContent = '⚡ 전체 수식 업데이트';
          btnRecalc.disabled = false;
        }
      }, 100);
    });
  }
}

// ⭐ 유저 직접 종가/수량/예수금변화액 입력 기반 주차 추가 모달 이벤트
function bindAddWeekEvents() {
  const btnAddWeekly = document.getElementById('btn-modal-add-weekly');
  const addModal = document.getElementById('add-week-modal');
  const addForm = document.getElementById('add-week-form');
  const btnCalcTrade = document.getElementById('btn-add-week-calc-trade');
  const qtyInput = document.getElementById('add-week-qty');

  if (qtyInput) {
    qtyInput.addEventListener('input', () => {
      if (!window.currentModalStock) return;
      const stock = window.currentModalStock;
      const currentHistory = appStore.getStockHistory(stock.id);
      const sortedHistory = [...currentHistory].sort((a, b) => a.week - b.week);
      const lastRow = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;
      const baseQty = lastRow ? lastRow.qty : stock.holdings;

      const currentQty = parseFloat(qtyInput.value || 0);
      const diff = currentQty - baseQty;
      const diffLabel = document.getElementById('add-week-qty-delta-label');
      if (diffLabel) {
        diffLabel.textContent = diff === 0 ? '(변화량: 0주)' : diff > 0 ? `(변화량: +${diff.toLocaleString()}주)` : `(변화량: ${diff.toLocaleString()}주)`;
        diffLabel.style.color = diff > 0 ? 'var(--profit-red)' : diff < 0 ? 'var(--loss-blue)' : '#34d399';
      }
    });
  }

  if (btnAddWeekly) {
    btnAddWeekly.addEventListener('click', () => {
      if (!window.currentModalStock) return;
      const stock = window.currentModalStock;
      const currentHistory = appStore.getStockHistory(stock.id);
      const cycleStep = stock.cycleWeeks || 2;

      const sortedHistory = [...currentHistory].sort((a, b) => a.week - b.week);
      const lastRow = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;

      let nextWeekNum = 0;
      let dateText = '25.1.25~2.7';

      if (lastRow) {
        nextWeekNum = lastRow.week + cycleStep;
        const parts = lastRow.date.split('~');
        if (parts.length === 2) {
          const startParts = parts[0].split('.');
          const endParts = parts[1].split('.');

          let startYear = 2025;
          if (startParts.length >= 3) {
            startYear = 2000 + parseInt(startParts[0]);
          }

          let lastEndMonth = parseInt(endParts[0]);
          let lastEndDay = parseInt(endParts[1]);

          const nextStart = new Date(startYear, lastEndMonth - 1, lastEndDay + 1);
          const nextEnd = new Date(nextStart);
          nextEnd.setDate(nextEnd.getDate() + (cycleStep * 7 - 1));

          const formatDateStr = (d) => `${String(d.getFullYear()).slice(2)}.${d.getMonth() + 1}.${d.getDate()}`;
          dateText = `${formatDateStr(nextStart)}~${nextEnd.getMonth() + 1}.${nextEnd.getDate()}`;
        }
      }

      document.getElementById('add-week-modal-title').textContent = `➕ ${nextWeekNum}주차 기록 직접 입력 추가`;
      document.getElementById('add-week-num-display').value = `${nextWeekNum}주차`;
      document.getElementById('add-week-date-range').value = dateText;
      document.getElementById('add-week-price').value = stock.currentPrice || (lastRow ? lastRow.price : 36.4);
      document.getElementById('add-week-qty').value = lastRow ? lastRow.qty : stock.holdings;
      document.getElementById('add-week-pool-delta').value = 0;

      const diffLabel = document.getElementById('add-week-qty-delta-label');
      if (diffLabel) diffLabel.textContent = '(변화량: 0주)';

      addModal.classList.add('active');
    });
  }

  if (btnCalcTrade) {
    btnCalcTrade.addEventListener('click', () => {
      if (!window.currentModalStock) return;
      const stock = window.currentModalStock;
      
      onTradeSuccessCallback = (batchResult) => {
        const { netPoolDelta, netQtyDelta, lastPrice, txCount } = batchResult;

        const currentHistory = appStore.getStockHistory(stock.id);
        const sortedHistory = [...currentHistory].sort((a, b) => a.week - b.week);
        const lastRow = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;
        const baseQty = lastRow ? lastRow.qty : stock.holdings;

        const newQty = baseQty + netQtyDelta;

        document.getElementById('add-week-pool-delta').value = Math.round(netPoolDelta * 100) / 100;
        document.getElementById('add-week-qty').value = newQty;

        // ⭐ 사용자 요구사항: 매매 작성 후에도 유저가 입력해둔 종가(Close Price)가 절대 덮어씌워지지 않고 그대로 유지되도록 보장!
        const existingPriceInput = document.getElementById('add-week-price');
        if (existingPriceInput && (!existingPriceInput.value || parseFloat(existingPriceInput.value) <= 0)) {
          if (lastPrice && lastPrice > 0) {
            existingPriceInput.value = lastPrice;
          }
        }

        const diffLabel = document.getElementById('add-week-qty-delta-label');
        if (diffLabel) {
          diffLabel.textContent = netQtyDelta === 0 ? '(변화량: 0주)' : netQtyDelta > 0 ? `(변화량: +${netQtyDelta.toLocaleString()}주)` : `(변화량: ${netQtyDelta.toLocaleString()}주)`;
          diffLabel.style.color = netQtyDelta > 0 ? 'var(--profit-red)' : netQtyDelta < 0 ? 'var(--loss-blue)' : '#34d399';
        }

        addModal.classList.add('active');

        alert(`✅ 총 ${txCount}건의 매매 내역이 저장되어 예수금 변화액(${netPoolDelta >= 0 ? '+' : ''}${netPoolDelta.toLocaleString()}), 수량 변동(${netQtyDelta >= 0 ? '+' : ''}${netQtyDelta}주 ➔ 총 ${newQty.toLocaleString()}주)이 주차 창에 자동 반영되었습니다! 자유롭게 수동 수정하실 수 있습니다.`);
      };

      openTradeModal(stock);
    });
  }

  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!window.currentModalStock) return;

      const stock = window.currentModalStock;
      const currentHistory = appStore.getStockHistory(stock.id);
      const cycleStep = stock.cycleWeeks || 2;
      const bandRatio = (stock.vrBandPercent || 15) / 100;

      const sortedHistory = [...currentHistory].sort((a, b) => a.week - b.week);
      const lastRow = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;

      const dateText = document.getElementById('add-week-date-range').value;
      const userPrice = parseFloat(document.getElementById('add-week-price').value);
      const userQty = parseFloat(document.getElementById('add-week-qty').value);
      const userPoolDelta = parseFloat(document.getElementById('add-week-pool-delta').value || 0);

      let nextWeekNum = 0;
      if (lastRow) {
        nextWeekNum = lastRow.week + cycleStep;
      }

      const prevV = lastRow ? lastRow.targetV : (stock.v1 || (userQty * stock.avgPrice));
      const gVal = lastRow ? lastRow.g : (stock.G || 15);
      
      // ⭐ 핵심: 이번 주차에 변경된 예수금을 바로 대입하여 이번 주차 목표가치 V2 산출!
      const prevPoolCumulative = lastRow ? (lastRow.poolCumulative || stock.vrTargetValue || 47918.9) : (stock.vrTargetValue || 47918.9);
      const updatedPoolForThisWeek = prevPoolCumulative + userPoolDelta;

      const evalE = userQty * userPrice;

      const nextV = vrEngine.calculateNextV({
        v1: prevV,
        pool: updatedPoolForThisWeek, // ⭐ 갱신된 예수금(Pool) 바로 대입!
        E: evalE,
        G: gVal,
        deposit: 0
      });

      const minBand = nextV * (1 - bandRatio);
      const maxBand = nextV * (1 + bandRatio);

      appStore.addWeeklyRecord(stock.id, {
        week: nextWeekNum,
        date: dateText,
        price: userPrice,
        g: gVal,
        evalE: Math.round(evalE * 100) / 100,
        targetV: Math.round(nextV * 100) / 100,
        minBand: Math.round(minBand * 100) / 100,
        maxBand: Math.round(maxBand * 100) / 100,
        poolDelta: userPoolDelta,
        poolCumulative: Math.round(updatedPoolForThisWeek * 100) / 100,
        totalAsset: Math.round(evalE * 100) / 100,
        profitPercent: 0,
        profitAmount: 0,
        qty: userQty,
        avgPrice: stock.avgPrice
      });

      addModal.classList.remove('active');

      const updatedStock = appStore.getStocks().find(s => s.id === stock.id);
      if (updatedStock) {
        window.currentModalStock = updatedStock;
        const historyData = appStore.getStockHistory(updatedStock.id);
        renderModalVRHistoryChart(historyData, updatedStock.currency);
        renderModalWeeklyHistoryTable(historyData, updatedStock.currency);
      }
    });
  }
}

// ⭐ 다중 행렬 매매 입력 모달(Batch Trade Modal) 전용 로직
function bindBatchTradeEvents() {
  const btnAddRow = document.getElementById('btn-add-trade-row');
  if (btnAddRow) {
    btnAddRow.addEventListener('click', () => {
      addBatchTradeRow();
    });
  }
}

function addBatchTradeRow(type = 'BUY', dateStr = null, qty = null, price = null) {
  const tbody = document.getElementById('batch-trade-tbody');
  if (!tbody) return;

  const stock = window.currentModalStock || (appStore.getStocks()[0]);
  const defaultStockPrice = stock ? stock.currentPrice : 36.4;
  const todayDefaultStr = new Date().toISOString().split('T')[0];

  const rows = tbody.querySelectorAll('.batch-trade-row');
  const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;

  let finalType = type;
  let finalDate = dateStr !== null ? dateStr : (lastRow ? lastRow.querySelector('.batch-date-input').value : todayDefaultStr);
  let finalQty = qty !== null ? qty : (lastRow ? lastRow.querySelector('.batch-qty-input').value : '');
  let finalPrice = price !== null ? price : (lastRow ? lastRow.querySelector('.batch-price-input').value : defaultStockPrice);

  if (lastRow && type === 'BUY' && rows.length === 1) {
    finalType = 'SELL';
  }

  const tr = document.createElement('tr');
  tr.className = 'batch-trade-row';
  tr.innerHTML = `
    <td>
      <select class="form-select batch-type-select" style="padding:4px 6px; font-size:0.75rem;">
        <option value="BUY" ${finalType === 'BUY' ? 'selected' : ''}>매수</option>
        <option value="SELL" ${finalType === 'SELL' ? 'selected' : ''}>매도</option>
      </select>
    </td>
    <td>
      <input type="date" class="form-input batch-date-input" value="${finalDate}" style="padding:4px 6px; font-size:0.75rem;">
    </td>
    <td>
      <input type="number" step="1" class="form-input batch-qty-input" placeholder="수량" value="${finalQty}" style="padding:4px 6px; font-size:0.75rem; text-align:right;">
    </td>
    <td>
      <input type="number" step="0.01" class="form-input batch-price-input" placeholder="단가" value="${finalPrice}" style="padding:4px 6px; font-size:0.75rem; text-align:right;">
    </td>
    <td style="text-align:center;">
      <button type="button" class="btn-delete-trade-row" style="background:none; border:none; color:#f87171; cursor:pointer; font-size:0.9rem;">🗑️</button>
    </td>
  `;

  tbody.appendChild(tr);

  tr.querySelectorAll('input, select').forEach(elem => {
    elem.addEventListener('input', calculateBatchTotals);
    elem.addEventListener('change', calculateBatchTotals);
  });

  tr.querySelector('.btn-delete-trade-row').addEventListener('click', () => {
    tr.remove();
    calculateBatchTotals();
  });

  calculateBatchTotals();
}

function calculateBatchTotals() {
  const rows = document.querySelectorAll('.batch-trade-row');
  const stock = window.currentModalStock || (appStore.getStocks()[0]);
  const currency = stock ? stock.currency : 'USD';

  let totalBuyCost = 0;
  let totalSellIncome = 0;

  rows.forEach(tr => {
    const type = tr.querySelector('.batch-type-select').value;
    const qty = parseFloat(tr.querySelector('.batch-qty-input').value || 0);
    const price = parseFloat(tr.querySelector('.batch-price-input').value || 0);

    if (qty > 0 && price > 0) {
      const amount = qty * price;
      if (type === 'BUY') {
        totalBuyCost += amount;
      } else if (type === 'SELL') {
        totalSellIncome += amount;
      }
    }
  });

  const netPoolDelta = totalSellIncome - totalBuyCost; // 매도(+), 매수(-)

  const buyEl = document.getElementById('batch-sum-buy');
  const sellEl = document.getElementById('batch-sum-sell');
  const poolEl = document.getElementById('batch-total-pool-delta');

  if (buyEl) buyEl.textContent = formatCurrency(totalBuyCost, currency);
  if (sellEl) sellEl.textContent = formatCurrency(totalSellIncome, currency);
  if (poolEl) {
    const poolText = `${netPoolDelta >= 0 ? '+' : ''}${formatCurrency(netPoolDelta, currency)}`;
    poolEl.textContent = poolText;
    poolEl.style.color = netPoolDelta < 0 ? 'var(--profit-red)' : netPoolDelta > 0 ? 'var(--loss-blue)' : '#34d399';
  }
}

// 전체 주차 삭제 (초기화) 이벤트 바인딩
function bindClearHistoryEvents() {
  const btnClear = document.getElementById('btn-modal-clear-history');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (!window.currentModalStock) return;
      const stock = window.currentModalStock;
      
      if (confirm(`[${stock.name}] 종목의 모든 주차별 히스토리 기록을 정말로 전체 삭제(초기화)하시겠습니까?`)) {
        stock.history = [];
        appStore.saveData();

        const updatedHistory = appStore.getStockHistory(stock.id);
        renderModalVRHistoryChart(updatedHistory, stock.currency);
        renderModalWeeklyHistoryTable(updatedHistory, stock.currency);
      }
    });
  }
}

// 최초 0주차 설정 모달 이벤트 바인딩
function bindInit0WeekEvents() {
  const initModal = document.getElementById('init-0week-modal');
  const btnInitOpen = document.getElementById('btn-modal-init-0week');
  const formInit = document.getElementById('init-0week-form');

  if (btnInitOpen) {
    btnInitOpen.addEventListener('click', () => {
      if (window.currentModalStock) {
        const stock = window.currentModalStock;
        document.getElementById('init-qty').value = stock.holdings || 2240;
        document.getElementById('init-pool').value = stock.vrTargetValue || 47918.9;
        document.getElementById('init-target-v').value = stock.v1 || (stock.holdings * stock.avgPrice) || '';
        initModal.classList.add('active');
      }
    });
  }

  if (formInit) {
    const handleInitSubmit = async (e) => {
      if (e) e.preventDefault();
      if (!window.currentModalStock) return;

      const submitBtn = formInit.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = '⏳ 0주차 데이터 저장 중...';
        submitBtn.disabled = true;
      }

      try {
        const stock = window.currentModalStock;
        const startDate = document.getElementById('init-start-date').value || '2025-01-25';
        const qtyVal = document.getElementById('init-qty').value;
        const poolVal = document.getElementById('init-pool').value;
        const userTargetVVal = document.getElementById('init-target-v').value;

        const qty = parseFloat(qtyVal) || 2240;
        const pool = parseFloat(poolVal) || 47918.9;
        const userTargetV = userTargetVVal ? parseFloat(userTargetVVal) : null;

        const cycleWeeks = stock.cycleWeeks || 2;
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + (cycleWeeks * 7 - 1));

        const yyyy = end.getFullYear();
        const mStr = String(end.getMonth() + 1).padStart(2, '0');
        const dStr = String(end.getDate()).padStart(2, '0');
        const endDateYmd = `${yyyy}-${mStr}-${dStr}`;

        let finalClosePrice = stock.currentPrice || stock.avgPrice || 36.4;

        appStore.setInitial0WeekHistory(stock.id, {
          startDate,
          qty,
          pool,
          closePrice: finalClosePrice,
          userTargetV
        });

        initModal.classList.remove('active');

        const updatedStock = appStore.getStocks().find(s => s.id === stock.id);
        if (updatedStock) {
          window.currentModalStock = updatedStock;
          const historyData = appStore.getStockHistory(updatedStock.id);
          renderModalVRHistoryChart(historyData, updatedStock.currency);
          renderModalWeeklyHistoryTable(historyData, updatedStock.currency);
          openStockDetailModal(updatedStock);
        }

        renderDashboard();
      } catch (err) {
        console.error('Critical error in 0-week submission:', err);
        alert('0주차 설정 저장 중 오류가 발생했습니다.');
      } finally {
        if (submitBtn) {
          submitBtn.textContent = '0주차 데이터 저장 및 시작';
          submitBtn.disabled = false;
        }
      }
    };

    formInit.addEventListener('submit', handleInitSubmit);
  }
}

// 주차별 수동 수정 모달 이벤트 바인딩
function bindEditWeekEvents() {
  const editModal = document.getElementById('edit-week-modal');
  const editForm = document.getElementById('edit-week-form');
  const btnDeleteWeek = document.getElementById('btn-delete-week');

  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!window.currentModalStock) return;

      const stock = window.currentModalStock;
      const weekNum = parseInt(document.getElementById('edit-week-num').value);
      const dateRange = document.getElementById('edit-date-range').value;
      const price = parseFloat(document.getElementById('edit-price').value);
      const gVal = parseFloat(document.getElementById('edit-g').value);
      const qty = parseFloat(document.getElementById('edit-qty').value);
      const poolDelta = parseFloat(document.getElementById('edit-pool-delta').value);
      const userTargetV = parseFloat(document.getElementById('edit-target-v').value);

      const bandRatio = (stock.vrBandPercent || 15) / 100;
      const evalE = qty * price;
      const targetV = !isNaN(userTargetV) && userTargetV > 0 ? userTargetV : evalE;
      const minBand = targetV * (1 - bandRatio);
      const maxBand = targetV * (1 + bandRatio);

      // DB 업데이트
      appStore.updateWeeklyRecord(stock.id, weekNum, {
        date: dateRange,
        price: price,
        g: gVal,
        qty: qty,
        poolDelta: poolDelta,
        evalE: Math.round(evalE * 100) / 100,
        targetV: Math.round(targetV * 100) / 100,
        minBand: Math.round(minBand * 100) / 100,
        maxBand: Math.round(maxBand * 100) / 100,
        totalAsset: Math.round(evalE * 100) / 100
      });

      editModal.classList.remove('active');

      const updatedStock = appStore.getStocks().find(s => s.id === stock.id);
      if (updatedStock) {
        window.currentModalStock = updatedStock;
        const historyData = appStore.getStockHistory(updatedStock.id);
        renderModalVRHistoryChart(historyData, updatedStock.currency);
        renderModalWeeklyHistoryTable(historyData, updatedStock.currency);
      }
    });
  }

  if (btnDeleteWeek) {
    btnDeleteWeek.addEventListener('click', () => {
      if (!window.currentModalStock) return;
      const stock = window.currentModalStock;
      const weekNum = parseInt(document.getElementById('edit-week-num').value);

      if (confirm(`${weekNum}주차 기록을 정말 삭제하시겠습니까?`)) {
        appStore.deleteWeeklyRecord(stock.id, weekNum);
        editModal.classList.remove('active');

        const updatedStock = appStore.getStocks().find(s => s.id === stock.id);
        if (updatedStock) {
          window.currentModalStock = updatedStock;
          const historyData = appStore.getStockHistory(updatedStock.id);
          renderModalVRHistoryChart(historyData, updatedStock.currency);
          renderModalWeeklyHistoryTable(historyData, updatedStock.currency);
        }
      }
    });
  }
}

// 외부 API를 통한 실시간 시세 및 원/달러 환율 갱신
async function refreshRealtimePrices() {
  const statusLabel = document.getElementById('refresh-status-label');
  const btnRefresh = document.getElementById('btn-refresh-prices');

  if (statusLabel) statusLabel.textContent = '⏳ 실시간 시세 & 환율 수집 중...';
  if (btnRefresh) btnRefresh.style.transform = 'rotate(360deg)';

  const stocks = appStore.getStocks();
  try {
    const { exchangeRate, stockPrices } = await priceFetcher.fetchAllPricesAndExchangeRate(stocks);
    
    if (exchangeRate && !isNaN(exchangeRate)) {
      appStore.setExchangeRate(exchangeRate);
    }

    let updatedCount = 0;
    Object.keys(stockPrices).forEach(stockId => {
      const newPrice = stockPrices[stockId];
      if (newPrice && !isNaN(newPrice)) {
        appStore.updateStockPrice(stockId, newPrice);
        updatedCount++;
      }
    });

    renderDashboard();
    renderSimulator();
    checkTriggeredAlerts();

    if (window.currentModalStock) {
      const updatedStock = appStore.getStocks().find(s => s.id === window.currentModalStock.id);
      if (updatedStock) openStockDetailModal(updatedStock);
    }

    if (statusLabel) {
      statusLabel.textContent = `✅ 시세·환율 갱신 완료 ($1=₩${appStore.getExchangeRate().toLocaleString()})`;
      setTimeout(() => {
        statusLabel.textContent = '종목 클릭 시 VR 상세/진행현황 조회';
      }, 4000);
    }
  } catch (e) {
    console.warn('Realtime fetch fallback applied', e);
    if (statusLabel) statusLabel.textContent = 'ℹ️ 최신 종가 데이터 기반 운용 중';
  } finally {
    if (btnRefresh) btnRefresh.style.transform = 'none';
  }
}

// 실시간 가격 기반 매수/매도 알림 엔진 검사
function checkTriggeredAlerts() {
  const stocks = appStore.getStocks();
  stocks.forEach(stock => {
    const vrEval = vrEngine.evaluate({
      currentPrice: stock.currentPrice,
      holdingItem: {
        qty: stock.holdings,
        avgPrice: stock.avgPrice,
        evaluationAmount: stock.holdings * stock.currentPrice
      },
      strategyParams: {
        v1: stock.v1 || (stock.holdings * stock.avgPrice || 100000),
        pool: stock.vrTargetValue || 30000,
        G: stock.G || 10,
        bandPercent: stock.vrBandPercent || 15,
        qtyStep: 20,
        buyLimitPercent: 25
      }
    });

    if (vrEval.signalType !== 'HOLD') {
      console.log(`[ALERT TRIGGERED] ${stock.name}: ${vrEval.message}`);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`[VR 매매 알림] ${stock.name}`, {
          body: vrEval.message,
          icon: '/favicon.ico'
        });
      }
    }
  });
}

// 종목 카드용 VR 밴드(Min/Max/V) 채널 포함 경량 미니 차트 (Sparkline SVG)
function generateMiniSparklineSVG(historyData, isUp = true) {
  if (!historyData || historyData.length === 0) {
    return `<div style="font-size:0.65rem; color:var(--text-sub); text-align:center; width:80px; height:46px; display:flex; align-items:center; justify-content:center;">기록없음</div>`;
  }

  const sorted = [...historyData].sort((a, b) => a.week - b.week);
  
  // 주가(price) 및 1주당 minBand/maxBand/targetV 비교
  const prices = sorted.map(h => h.price);
  const minBandPrices = sorted.map(h => (h.qty > 0 ? h.minBand / h.qty : h.price * 0.85));
  const maxBandPrices = sorted.map(h => (h.qty > 0 ? h.maxBand / h.qty : h.price * 1.15));
  const targetVPrices = sorted.map(h => (h.qty > 0 ? h.targetV / h.qty : h.price));

  const allY = [...prices, ...minBandPrices, ...maxBandPrices, ...targetVPrices];
  const minVal = Math.min(...allY);
  const maxVal = Math.max(...allY);
  const range = (maxVal - minVal) || 1;

  const width = 80;
  const height = 46;
  const padding = 3;

  const getCoord = (val, idx) => {
    const x = padding + (idx / Math.max(sorted.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    return { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) };
  };

  const pricePts = prices.map((p, i) => getCoord(p, i));
  const maxBandPts = maxBandPrices.map((p, i) => getCoord(p, i));
  const minBandPts = minBandPrices.map((p, i) => getCoord(p, i));
  const targetVPts = targetVPrices.map((p, i) => getCoord(p, i));

  // 주가 경로
  const pricePathD = `M ${pricePts.map(pt => `${pt.x},${pt.y}`).join(' L ')}`;
  
  // 목표V 경로
  const targetVPathD = `M ${targetVPts.map(pt => `${pt.x},${pt.y}`).join(' L ')}`;

  // 상단/하단 밴드 경로
  const maxBandPathD = `M ${maxBandPts.map(pt => `${pt.x},${pt.y}`).join(' L ')}`;
  const minBandPathD = `M ${minBandPts.map(pt => `${pt.x},${pt.y}`).join(' L ')}`;

  // 밴드 영역 Fill D (MaxBand ~ MinBand 닫힌 다각형)
  const maxTopPts = maxBandPts.map(pt => `${pt.x},${pt.y}`).join(' L ');
  const minBottomPts = [...minBandPts].reverse().map(pt => `${pt.x},${pt.y}`).join(' L ');
  const bandFillD = `M ${maxTopPts} L ${minBottomPts} Z`;

  const strokeColor = isUp ? '#34d399' : '#f87171';
  const lastPricePt = pricePts[pricePts.length - 1];

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible; display:block;" title="상단:매도밴드 / 하단:매수밴드 / 중앙:V가치 / 실선:현재가">
      <!-- VR 밴드 채널 배경 영역 (Fill) -->
      <path d="${bandFillD}" fill="rgba(139, 92, 246, 0.14)" />
      
      <!-- 상단 매도 밴드 (+15%) 점선 -->
      <path d="${maxBandPathD}" fill="none" stroke="#f43f5e" stroke-width="1" stroke-dasharray="2 2" opacity="0.75" />
      
      <!-- 하단 매수 밴드 (-15%) 점선 -->
      <path d="${minBandPathD}" fill="none" stroke="#3b82f6" stroke-width="1" stroke-dasharray="2 2" opacity="0.75" />

      <!-- V 가치 중앙 점선 -->
      <path d="${targetVPathD}" fill="none" stroke="#c084fc" stroke-width="1" stroke-dasharray="3 2" opacity="0.85" />

      <!-- 현재 주가 실선 (Main Price Line) -->
      <path d="${pricePathD}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      
      <!-- 최신 주가 포인트 닷 -->
      <circle cx="${lastPricePt.x}" cy="${lastPricePt.y}" r="2.5" fill="${strokeColor}" stroke="#0f172a" stroke-width="1" />
    </svg>
  `;
}

// 대시보드 렌더링
function renderDashboard() {
  const stocks = appStore.getStocks();
  const currentExchangeRate = appStore.getExchangeRate();

  let totalInvestmentKRW = 0;
  let totalEvaluationKRW = 0;
  let totalUSDAsset = 0;
  let totalKRWAsset = 0;

  let totalUSDPool = 0;
  let totalKRWPool = 0;

  const stockListContainer = document.getElementById('stock-list-container');
  if (!stockListContainer) return;

  stockListContainer.innerHTML = '';

  stocks.forEach(stock => {
    const isUSD = stock.currency === 'USD';
    const rate = isUSD ? currentExchangeRate : 1;

    const historyData = appStore.getStockHistory(stock.id);
    const sortedHistory = [...historyData].sort((a, b) => a.week - b.week);
    const lastRow = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;

    // ⭐ 실시간 가격(stock.currentPrice)이 존재하면 최우선 적용, 없으면 히스토리 최신 종가 사용
    const basePrice = (stock.currentPrice && !isNaN(stock.currentPrice)) ? stock.currentPrice : (lastRow ? lastRow.price : stock.avgPrice);
    const baseQty = lastRow ? lastRow.qty : stock.holdings;
    const basePool = lastRow ? (lastRow.poolCumulative || stock.vrTargetValue || 0) : (stock.vrTargetValue || 0);

    const invCurrency = baseQty * stock.avgPrice;
    const evalCurrency = baseQty * basePrice;

    const invKRW = invCurrency * rate;
    const evalKRW = evalCurrency * rate;
    const pnlKRW = evalKRW - invKRW;
    const pnlPercent = invKRW > 0 ? (pnlKRW / invKRW) * 100 : 0;

    totalInvestmentKRW += invKRW;
    totalEvaluationKRW += evalKRW;

    if (isUSD) {
      totalUSDAsset += evalCurrency;
      totalUSDPool += basePool;
    } else {
      totalKRWAsset += evalCurrency;
      totalKRWPool += basePool;
    }

    const vrEval = vrEngine.evaluate({
      currentPrice: basePrice,
      holdingItem: {
        qty: baseQty,
        avgPrice: stock.avgPrice,
        evaluationAmount: baseQty * basePrice
      },
      strategyParams: {
        v1: stock.v1 || (baseQty * stock.avgPrice || 100000),
        pool: basePool,
        G: stock.G || 10,
        bandPercent: stock.vrBandPercent || 15,
        qtyStep: stock.qtyStep || 20,
        buyLimitPercent: stock.buyLimitPercent || 25
      }
    });

    const sparklineSvg = generateMiniSparklineSVG(historyData, pnlPercent >= 0);

    const card = document.createElement('div');
    card.className = 'glass-card stock-card';
    card.innerHTML = `
      <div class="stock-card-top" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="mini-sparkline-container" style="background:rgba(15, 23, 42, 0.6); padding:4px 6px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); flex-shrink:0;">
            ${sparklineSvg}
          </div>
          <div class="stock-name-group">
            <span class="stock-name" style="font-size:1.05rem; font-weight:700;">${stock.name}</span>
            <span class="stock-code" style="font-size:0.78rem; color:var(--text-sub); display:block; margin-top:2px;">${stock.code} · ${stock.currency}</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
          <div class="stock-badge ${pnlPercent >= 0 ? 'badge-up' : 'badge-down'}" style="white-space:nowrap;">
            ${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%
          </div>
          <button class="btn-delete-stock-card" title="종목 삭제" style="background:rgba(239,68,68,0.18); border:1px solid rgba(239,68,68,0.4); color:#f87171; border-radius:8px; padding:4px 8px; font-size:0.75rem; cursor:pointer; font-weight:700; white-space:nowrap; flex-shrink:0; display:inline-flex; align-items:center; gap:3px;">🗑️ 삭제</button>
        </div>
      </div>

      <div class="stock-card-details">
        <div class="stock-detail-item">
          <span class="stock-detail-label">현재가 (실시간)</span>
          <span class="stock-detail-val">${formatCurrency(basePrice, stock.currency)}</span>
        </div>
        <div class="stock-detail-item">
          <span class="stock-detail-label">평단가</span>
          <span class="stock-detail-val">${formatCurrency(stock.avgPrice, stock.currency)}</span>
        </div>
        <div class="stock-detail-item">
          <span class="stock-detail-label">보유수량</span>
          <span class="stock-detail-val">${baseQty.toLocaleString()}주</span>
        </div>
      </div>

      <div class="signal-status-bar">
        <span>전략: <strong>${stock.strategyType || 'VR'} (${stock.cycleWeeks || 2}주)</strong></span>
        <span class="signal-indicator">
          <span class="signal-dot dot-${vrEval.signalType.toLowerCase()}"></span>
          ${vrEval.signalType === 'BUY' ? `매수 도달 (${formatCurrency(vrEval.buyTargetPrice, stock.currency)})` : 
            vrEval.signalType === 'SELL' ? `매도 도달 (${formatCurrency(vrEval.sellTargetPrice, stock.currency)})` : 
            '관망 (대기)'}
        </span>
      </div>
    `;

    const btnDelete = card.querySelector('.btn-delete-stock-card');
    if (btnDelete) {
      btnDelete.addEventListener('click', (e) => {
        e.stopPropagation(); // 모달 팝업 방지
        if (confirm(`[${stock.name} (${stock.code})] 종목을 포트폴리오에서 정말로 삭제하시겠습니까?`)) {
          appStore.deleteStock(stock.id);
          renderDashboard();
          renderSimulator();
          alert(`🗑️ [${stock.name}] 종목이 삭제되었습니다.`);
        }
      });
    }

    card.addEventListener('click', () => {
      try {
        const latestStock = appStore.getStocks().find(s => s.id === stock.id) || stock;
        openStockDetailModal(latestStock);
      } catch (err) {
        console.error('Failed to open stock detail modal:', err);
        const modal = document.getElementById('stock-detail-modal');
        if (modal) modal.classList.add('active');
      }
    });

    stockListContainer.appendChild(card);
  });

  const totalPoolKRW = (totalUSDPool * currentExchangeRate) + totalKRWPool;
  const totalNetAssetsKRW = totalEvaluationKRW + totalPoolKRW;

  const totalPnLKRW = totalEvaluationKRW - totalInvestmentKRW;
  const formattedRateStr = `실시간 환율: $1 = ₩${currentExchangeRate.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    if (el) el.textContent = formattedRateStr;
  });
  document.getElementById('total-assets-val').textContent = `₩${Math.round(totalNetAssetsKRW).toLocaleString()}`;
  
  const usdConvertedKRW = totalUSDAsset * currentExchangeRate;
  document.getElementById('usd-assets-val').textContent = `$${totalUSDAsset.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById('usd-converted-krw').textContent = `(₩${Math.round(usdConvertedKRW).toLocaleString()})`;

  document.getElementById('krw-assets-val').textContent = `₩${Math.round(totalKRWAsset).toLocaleString()}`;
  
  const usdPoolConvertedKRW = totalUSDPool * currentExchangeRate;

  const usdPoolEl = document.getElementById('usd-pool-val');
  if (usdPoolEl) {
    usdPoolEl.textContent = `예수금: $${totalUSDPool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (₩${Math.round(usdPoolConvertedKRW).toLocaleString()})`;
  }

  const krwPoolEl = document.getElementById('krw-pool-val');
  if (krwPoolEl) {
    krwPoolEl.textContent = `예수금: ₩${Math.round(totalKRWPool).toLocaleString()}`;
  }

  document.getElementById('total-invest-val').textContent = `₩${Math.round(totalInvestmentKRW).toLocaleString()}`;
  
  const pnlElement = document.getElementById('total-pnl-val');
  pnlElement.textContent = `₩${Math.round(totalPnLKRW).toLocaleString()} (${totalPnLPercent >= 0 ? '+' : ''}${totalPnLPercent.toFixed(2)}%)`;
  pnlElement.className = `summary-item-val ${totalPnLKRW >= 0 ? 'val-up' : 'val-down'}`;
}

// 종목 클릭 시 VR 매수/매도 기준 상세 모달 렌더링
function openStockDetailModal(stock) {
  window.currentModalStock = stock;
  const modal = document.getElementById('stock-detail-modal');
  if (!modal) return;

  // ⭐ [요청3] 종목 상세 창을 열 때 항상 '📈 VR 진행현황' 탭이 디폴트로 active 선택되도록 설정
  const tabBtns = document.querySelectorAll('.detail-tab-btn');
  const tabContents = document.querySelectorAll('.detail-tab-content');
  tabBtns.forEach(b => b.classList.remove('active'));
  tabContents.forEach(c => c.classList.remove('active'));

  const defaultTabBtn = document.querySelector('.detail-tab-btn[data-detail-tab="progress-history"]');
  const defaultTabContent = document.getElementById('detail-tab-progress-history');
  if (defaultTabBtn) defaultTabBtn.classList.add('active');
  if (defaultTabContent) defaultTabContent.classList.add('active');

  document.getElementById('modal-stock-name').textContent = stock.name;
  document.getElementById('modal-stock-code').textContent = `${stock.code} · 현재가: ${formatCurrency(stock.currentPrice, stock.currency)}`;

  // 1. 종목별 VR 운용 옵션값 바인딩 & 접기/펼치기 아코디언 이벤트
  const optCycle = document.getElementById('opt-cycle-weeks');
  const optBand = document.getElementById('opt-band-percent');
  const optG = document.getElementById('opt-g-val');
  const optQtyStep = document.getElementById('opt-qty-step');
  const optBuyLimit = document.getElementById('opt-buy-limit-percent');
  const btnToggleOptions = document.getElementById('btn-toggle-options-accordion');
  const optionsBody = document.getElementById('vr-options-body');
  const toggleIcon = document.getElementById('accordion-toggle-icon');

  if (optCycle) optCycle.value = stock.cycleWeeks || 2;
  if (optBand) optBand.value = stock.vrBandPercent || 15;
  if (optG) optG.value = stock.G || 15;
  if (optQtyStep) optQtyStep.value = stock.qtyStep || 20;
  if (optBuyLimit) optBuyLimit.value = stock.buyLimitPercent || 25;

  // ⭐ [요청3] 옵션 접기/펼치기 토글 이벤트
  if (btnToggleOptions && optionsBody) {
    btnToggleOptions.onclick = () => {
      const isHidden = optionsBody.style.display === 'none';
      optionsBody.style.display = isHidden ? 'block' : 'none';
      if (toggleIcon) toggleIcon.textContent = isHidden ? '▲ (접기)' : '▼ (클릭하여 수정)';
    };
  }

  const btnSaveOpt = document.getElementById('btn-save-strategy-options');
  if (btnSaveOpt) {
    btnSaveOpt.onclick = () => {
      appStore.updateStockStrategyOptions(stock.id, {
        cycleWeeks: optCycle.value,
        vrBandPercent: optBand.value,
        G: optG.value,
        qtyStep: optQtyStep ? optQtyStep.value : 20,
        buyLimitPercent: optBuyLimit ? optBuyLimit.value : 25
      });
      const updated = appStore.getStocks().find(s => s.id === stock.id);
      if (updated) openStockDetailModal(updated);
      alert(`✅ [${stock.name}] VR 운용 옵션(주기:${optCycle.value}주, 밴드:±${optBand.value}%, G:${optG.value}, 간격:${optQtyStep ? optQtyStep.value : 20}주, 매수한도:${optBuyLimit ? optBuyLimit.value : 25}%)이 성공적으로 저장되었습니다!`);
    };
  }

  // ⭐ [요청사항 완벽반영] 가장 마지막 주차(최신 주차)의 실제 레코드 수치 직접 대입!
  const historyData = appStore.getStockHistory(stock.id);
  const sortedHistory = [...historyData].sort((a, b) => a.week - b.week);
  const lastRow = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;
  const prevRow = sortedHistory.length > 1 ? sortedHistory[sortedHistory.length - 2] : null;

  // ⭐ 실시간 가격(stock.currentPrice)이 존재하면 최우선 적용, 없으면 히스토리 최신 종가 사용
  const basePrice = (stock.currentPrice && !isNaN(stock.currentPrice)) ? stock.currentPrice : (lastRow ? lastRow.price : stock.avgPrice);
  const baseQty = lastRow ? lastRow.qty : stock.holdings;
  const basePool = lastRow ? (lastRow.poolCumulative || stock.vrTargetValue || 47918.9) : (stock.vrTargetValue || 47918.9);
  const userQtyStep = parseInt(stock.qtyStep || (optQtyStep ? optQtyStep.value : 20));
  const userBuyLimitPercent = parseFloat(stock.buyLimitPercent || (optBuyLimit ? optBuyLimit.value : 25));
  const baseEvalE = baseQty * basePrice;

  // 마지막 주차의 실제 목표가치, 최소/최대 밴드 직접 추출
  const lastV2 = lastRow ? lastRow.targetV : (stock.v1 || baseEvalE);
  const lastV1 = prevRow ? prevRow.targetV : (stock.v1 || baseEvalE);
  const lastMinBand = lastRow ? lastRow.minBand : (lastV2 * (1 - (stock.vrBandPercent || 15) / 100));
  const lastMaxBand = lastRow ? lastRow.maxBand : (lastV2 * (1 + (stock.vrBandPercent || 15) / 100));

  // ⭐ 1차 매수/매도 도달가 산출 (마지막 주차 밴드 / 마지막 주차 수량)
  const buyTargetPrice = lastMinBand / baseQty;
  const sellTargetPrice = lastMaxBand / baseQty;

  // 1. 요약 탭 프로그램 최종 DATA 배너 & 종합 계좌 카드 동적 바인딩
  const lastWeekTitle = lastRow ? `${lastRow.week}주차 (${lastRow.date})` : '0주차';
  const sumTitleEl = document.getElementById('summary-data-basis-title');
  const sumSubEl = document.getElementById('summary-data-basis-sub');
  if (sumTitleEl) sumTitleEl.textContent = `📌 프로그램 인식 최종 DATA: ${lastWeekTitle}`;
  if (sumSubEl) sumSubEl.textContent = `종가: ${formatCurrency(basePrice, stock.currency)} · 보유수량: ${baseQty.toLocaleString()}주 · 누적예수금: ${formatCurrency(basePool, stock.currency)}`;

  document.getElementById('modal-v1-val').textContent = formatCurrency(lastV1, stock.currency);
  document.getElementById('modal-v2-val').textContent = formatCurrency(lastV2, stock.currency);
  
  const evalEl = document.getElementById('modal-eval-e-val');
  if (evalEl) {
    evalEl.textContent = `${formatCurrency(baseEvalE, stock.currency)} (${baseQty.toLocaleString()}주 × ${formatCurrency(basePrice, stock.currency)})`;
  }

  document.getElementById('modal-min-band').textContent = formatCurrency(lastMinBand, stock.currency);
  document.getElementById('modal-max-band').textContent = formatCurrency(lastMaxBand, stock.currency);
  document.getElementById('modal-buy-target').textContent = formatCurrency(buyTargetPrice, stock.currency);
  document.getElementById('modal-sell-target').textContent = formatCurrency(sellTargetPrice, stock.currency);

  const accTotalAsset = baseEvalE + basePool;
  const buyLimitVal = basePool * (userBuyLimitPercent / 100);

  const totalAssetEl = document.getElementById('modal-total-account-asset');
  const poolEl = document.getElementById('modal-pool-cumulative');
  const gCycleEl = document.getElementById('modal-g-cycle-info');
  const buyLimitEl = document.getElementById('modal-buy-limit-val');

  if (totalAssetEl) totalAssetEl.textContent = formatCurrency(accTotalAsset, stock.currency);
  if (poolEl) poolEl.textContent = formatCurrency(basePool, stock.currency);
  if (gCycleEl) gCycleEl.textContent = `G=${stock.G || 15} / ${stock.cycleWeeks || 2}주 / ±${stock.vrBandPercent || 15}%`;
  if (buyLimitEl) buyLimitEl.textContent = `${formatCurrency(buyLimitVal, stock.currency)} (${userBuyLimitPercent}%)`;

  // 매수 그리드 탭 인라인 매수 한도 입력기 연동
  const gridBuyLimitInput = document.getElementById('grid-buy-limit-input');
  if (gridBuyLimitInput) {
    gridBuyLimitInput.value = userBuyLimitPercent;
    gridBuyLimitInput.oninput = () => {
      const newLimit = parseFloat(gridBuyLimitInput.value || 25);
      renderInteractiveBuyGrid(lastMinBand, baseQty, basePool, userQtyStep, stock.currency, newLimit);
    };
  }

  // 2. VR 진행현황 탭 렌더링 (차트 & 주차별 테이블)
  const chartTitle = document.getElementById('modal-chart-title');
  if (chartTitle) chartTitle.textContent = `${stock.name} VR 밴드 추이 (${stock.cycleWeeks || 2}주차 주기 / G=${stock.G || 15})`;
  
  renderModalVRHistoryChart(historyData, stock.currency);
  renderModalWeeklyHistoryTable(historyData, stock.currency);

  // 4. 매수 그리드 기준표 렌더링 (차수별 수량 유저 수동 선택/입력 가능 & 매수 한도 적용)
  renderInteractiveBuyGrid(lastMinBand, baseQty, basePool, userQtyStep, stock.currency, userBuyLimitPercent);

  // 5. 매도 그리드 기준표 렌더링 (차수별 수량 유저 수동 선택/입력 가능)
  renderInteractiveSellGrid(lastMaxBand, baseQty, basePool, userQtyStep, stock.currency);

  modal.classList.add('active');
}

// ⭐ 체결 체크 시 인라인 스타일 덮어쓰기 무력화 & 100% 강제 딤드 스위처
function setRowDimmedState(tr, isDimmed) {
  const numInputs = tr.querySelectorAll('input[type="number"]');
  if (isDimmed) {
    tr.classList.add('row-dimmed');
    tr.style.setProperty('opacity', '0.22', 'important');
    tr.style.setProperty('filter', 'grayscale(100%) brightness(0.4)', 'important');
    tr.style.setProperty('background-color', 'rgba(15, 23, 42, 0.95)', 'important');
    
    numInputs.forEach(inp => {
      inp.disabled = true;
      inp.style.setProperty('opacity', '0.3', 'important');
    });

    tr.querySelectorAll('td, td *, span, div').forEach(el => {
      if (!el.classList.contains('executed-chk')) {
        el.style.setProperty('color', '#64748b', 'important');
        el.style.setProperty('text-decoration', 'line-through', 'important');
      }
    });
  } else {
    tr.classList.remove('row-dimmed');
    tr.style.removeProperty('opacity');
    tr.style.removeProperty('filter');
    tr.style.removeProperty('background-color');

    numInputs.forEach(inp => {
      inp.disabled = false;
      inp.style.removeProperty('opacity');
    });

    tr.querySelectorAll('td, td *, span, div').forEach(el => {
      el.style.removeProperty('color');
      el.style.removeProperty('text-decoration');
    });

    // 원본 인라인 브랜드 컬러 복원
    const buyPriceVal = tr.querySelector('.buy-price-val');
    if (buyPriceVal) buyPriceVal.style.color = 'var(--loss-blue)';
    const buyPoolVal = tr.querySelector('.buy-rem-pool-val');
    if (buyPoolVal) buyPoolVal.style.color = '#a5b4fc';
    const sellPriceVal = tr.querySelector('.sell-price-val');
    if (sellPriceVal) sellPriceVal.style.color = 'var(--profit-red)';
  }
}

// ⭐ 매수 그리드 표 인라인 수량 선택 & 실시간 재계산 렌더러 (남은 매수한도 표기)
function renderInteractiveBuyGrid(minBandVal, baseQty, initialPool, defaultStepQty, currency = 'USD', buyLimitPercent = 25) {
  const buyTbody = document.getElementById('buy-grid-tbody');
  if (!buyTbody) return;

  buyTbody.innerHTML = '';
  const buyLimitRatio = Math.max(0.05, Math.min(1.0, buyLimitPercent / 100));
  const maxBuyCostLimit = initialPool * buyLimitRatio;

  const limitTextEl = document.getElementById('buy-grid-limit-text');
  if (limitTextEl) {
    limitTextEl.textContent = `* 예수금(Pool ${formatCurrency(initialPool, currency)})의 ${buyLimitPercent}% 매수한도(${formatCurrency(maxBuyCostLimit, currency)}) 내에서 설정된 수량간격으로 체결되는 매수 구간표입니다.`;
  }

  let currentQty = baseQty;
  let totalSpent = 0;
  const initialRowsCount = 30; // 최대 30차까지 렌더링

  for (let idx = 0; idx < initialRowsCount; idx++) {
    const buyPrice = minBandVal / currentQty;
    const buyCost = defaultStepQty * buyPrice;

    if (totalSpent + buyCost > maxBuyCostLimit && idx > 0) break;

    totalSpent += buyCost;
    currentQty += defaultStepQty;
    const remainingLimit = Math.max(0, maxBuyCostLimit - totalSpent);

    const tr = document.createElement('tr');
    tr.className = 'interactive-buy-row';
    tr.innerHTML = `
      <td style="text-align:center;">
        <input type="checkbox" class="executed-chk" title="체결 완료 딤드 처리">
      </td>
      <td style="font-weight:700; font-size:0.8rem;">${idx + 1}차</td>
      <td class="buy-price-val" style="font-weight:700; color:var(--loss-blue);">${formatCurrency(buyPrice, currency)}</td>
      <td>
        <div style="display:flex; align-items:center; justify-content:center; gap:2px;">
          <span>+</span>
          <input type="number" step="1" min="1" class="buy-qty-input form-input" value="${defaultStepQty}" style="width:65px; padding:2px 4px; font-size:0.75rem; text-align:center; font-weight:700; border-color:#6366f1;">
          <span>주</span>
        </div>
      </td>
      <td class="buy-cost-val">${formatCurrency(buyCost, currency)}</td>
      <td class="buy-rem-qty-val" style="font-weight:600;">${currentQty.toLocaleString()}주</td>
      <td class="buy-rem-pool-val" style="font-weight:700; color:#a5b4fc;">${formatCurrency(remainingLimit, currency)}</td>
    `;

    const chk = tr.querySelector('.executed-chk');
    chk.addEventListener('change', () => {
      setRowDimmedState(tr, chk.checked);
    });

    buyTbody.appendChild(tr);
  }

  // 차수별 수량 변경 시 실시간 전체 재계산 이벤트 연동
  buyTbody.querySelectorAll('.buy-qty-input').forEach(input => {
    input.addEventListener('input', () => {
      recalculateBuyGridTable(minBandVal, baseQty, initialPool, currency, buyLimitPercent);
    });
  });
}

function recalculateBuyGridTable(minBandVal, baseQty, initialPool, currency = 'USD', buyLimitPercent = 25) {
  const rows = document.querySelectorAll('.interactive-buy-row');
  let currentQty = baseQty;
  let totalSpent = 0;
  const buyLimitRatio = Math.max(0.05, Math.min(1.0, buyLimitPercent / 100));
  const maxBuyCostLimit = initialPool * buyLimitRatio;

  rows.forEach(tr => {
    const qtyInput = tr.querySelector('.buy-qty-input');
    const stepQty = Math.max(1, parseFloat(qtyInput.value || 1));

    const buyPrice = minBandVal / currentQty;
    const buyCost = stepQty * buyPrice;

    totalSpent += buyCost;
    currentQty += stepQty;
    const remainingLimit = Math.max(0, maxBuyCostLimit - totalSpent);

    tr.querySelector('.buy-price-val').textContent = formatCurrency(buyPrice, currency);
    tr.querySelector('.buy-cost-val').textContent = formatCurrency(buyCost, currency);
    tr.querySelector('.buy-rem-qty-val').textContent = `${currentQty.toLocaleString()}주`;
    tr.querySelector('.buy-rem-pool-val').textContent = formatCurrency(remainingLimit, currency);
  });
}

// ⭐ 매도 그리드 표 인라인 수량 선택 & 실시간 재계산 렌더러 (최대 30차 가이드)
function renderInteractiveSellGrid(maxBandVal, baseQty, initialPool, defaultStepQty, currency = 'USD') {
  const sellTbody = document.getElementById('sell-grid-tbody');
  if (!sellTbody) return;

  sellTbody.innerHTML = '';
  let currentQty = baseQty;
  let currentPool = initialPool;
  const initialRowsCount = 30; // ⭐ [요청2] 아래로 스크롤할 때 최대 30차까지 넉넉하게 확인 가능!

  for (let idx = 0; idx < initialRowsCount; idx++) {
    if (currentQty <= 1) break; // 보유 주식이 남아있는 한 30차까지 생성

    const stepQty = Math.min(defaultStepQty, currentQty);
    const sellPrice = maxBandVal / currentQty;
    const sellIncome = stepQty * sellPrice;

    currentPool += sellIncome;
    currentQty -= stepQty;

    const tr = document.createElement('tr');
    tr.className = 'interactive-sell-row';
    tr.innerHTML = `
      <td style="text-align:center;">
        <input type="checkbox" class="executed-chk" title="체결 완료 딤드 처리">
      </td>
      <td style="font-weight:700; font-size:0.8rem;">${idx + 1}차</td>
      <td class="sell-price-val" style="font-weight:700; color:var(--profit-red);">${formatCurrency(sellPrice, currency)}</td>
      <td>
        <div style="display:flex; align-items:center; justify-content:center; gap:2px;">
          <span>-</span>
          <input type="number" step="1" min="1" class="sell-qty-input form-input" value="${stepQty}" style="width:65px; padding:2px 4px; font-size:0.75rem; text-align:center; font-weight:700; border-color:#ef4444;">
          <span>주</span>
        </div>
      </td>
      <td class="sell-income-val">${formatCurrency(sellIncome, currency)}</td>
      <td class="sell-rem-qty-val" style="font-weight:600;">${Math.max(0, currentQty).toLocaleString()}주</td>
      <td class="sell-rem-pool-val">${formatCurrency(currentPool, currency)}</td>
    `;

    const chk = tr.querySelector('.executed-chk');
    chk.addEventListener('change', () => {
      setRowDimmedState(tr, chk.checked);
    });

    sellTbody.appendChild(tr);
  }

  // 차수별 수량 변경 시 실시간 전체 재계산 이벤트 연동
  sellTbody.querySelectorAll('.sell-qty-input').forEach(input => {
    input.addEventListener('input', () => {
      recalculateSellGridTable(maxBandVal, baseQty, initialPool, currency);
    });
  });
}

function recalculateSellGridTable(maxBandVal, baseQty, initialPool, currency = 'USD') {
  const rows = document.querySelectorAll('.interactive-sell-row');
  let currentQty = baseQty;
  let currentPool = initialPool;

  rows.forEach(tr => {
    const qtyInput = tr.querySelector('.sell-qty-input');
    const stepQty = Math.max(1, parseFloat(qtyInput.value || 1));

    const sellPrice = maxBandVal / currentQty;
    const sellIncome = stepQty * sellPrice;

    currentPool += sellIncome;
    currentQty -= stepQty;

    tr.querySelector('.sell-price-val').textContent = formatCurrency(sellPrice, currency);
    tr.querySelector('.sell-income-val').textContent = formatCurrency(sellIncome, currency);
    tr.querySelector('.sell-rem-qty-val').textContent = `${Math.max(0, currentQty).toLocaleString()}주`;
    tr.querySelector('.sell-rem-pool-val').textContent = formatCurrency(currentPool, currency);
  });
}

// 모달 전용 VR Chart.js 렌더링 (⭐ 차트 마일스톤 점 표기 최소화 적용!)
function renderModalVRHistoryChart(historyData, currency = 'USD') {
  const canvas = document.getElementById('modalVrHistoryChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (modalHistoryChartInstance) {
    modalHistoryChartInstance.destroy();
  }

  if (!historyData || historyData.length === 0) {
    return;
  }

  const sortedData = [...historyData].sort((a, b) => a.week - b.week);
  const labels = sortedData.map(h => `${h.week}주차 (${h.date.split('~')[0]})`);
  const evalEData = sortedData.map(h => h.evalE);
  const targetVData = sortedData.map(h => h.targetV);
  const minBandData = sortedData.map(h => h.minBand);
  const maxBandData = sortedData.map(h => h.maxBand);

  modalHistoryChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '평가금 (E)',
          data: evalEData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2.2,
          pointRadius: 0, // ⭐ 마일스톤 점 숨김 (최소화)
          pointHoverRadius: 5,
          pointBackgroundColor: '#ef4444',
          tension: 0.2
        },
        {
          label: 'V (목표가치)',
          data: targetVData,
          borderColor: '#10b981',
          borderWidth: 1.8,
          borderDash: [5, 5],
          pointRadius: 0, // ⭐ 마일스톤 점 숨김 (최소화)
          pointHoverRadius: 4,
          pointBackgroundColor: '#10b981',
          tension: 0.2
        },
        {
          label: '최소 밴드 (Min)',
          data: minBandData,
          borderColor: '#a855f7',
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.2
        },
        {
          label: '최대 밴드 (Max)',
          data: maxBandData,
          borderColor: '#a855f7',
          borderWidth: 1.5,
          borderDash: [3, 3],
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: { size: 10, weight: 'bold' },
            boxWidth: 12,
            usePointStyle: false
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatCurrency(context.parsed.y, currency)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { size: 9 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            color: '#94a3b8',
            font: { size: 9 },
            callback: function(val) {
              return currency === 'KRW' ? `₩${(val / 10000).toFixed(0)}만` : `$${(val / 1000).toFixed(0)}k`;
            }
          }
        }
      }
    }
  });
}

function renderModalWeeklyHistoryTable(historyData, currency = 'USD') {
  const tbody = document.getElementById('modal-progress-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!historyData || historyData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="15" style="text-align:center; padding:16px; color:var(--text-muted);">주차별 히스토리 기록이 없습니다. 🌱 0주차 설정을 먼저 실행해주세요.</td></tr>`;
    return;
  }

  const sortedHistory = [...historyData].sort((a, b) => b.week - a.week);

  sortedHistory.forEach(row => {
    const tr = document.createElement('tr');
    const poolDeltaVal = row.poolDelta || 0;
    const poolDeltaText = poolDeltaVal < 0 
      ? `<span style="color:var(--profit-red); font-weight:700;">-${formatCurrency(Math.abs(poolDeltaVal), currency)}</span>` 
      : poolDeltaVal > 0 
      ? `<span style="color:var(--loss-blue); font-weight:700;">+${formatCurrency(poolDeltaVal, currency)}</span>` 
      : `<span style="color:var(--text-muted);">-</span>`;

    tr.innerHTML = `
      <td style="font-weight:700; color:var(--accent-blue);">${row.week}주차</td>
      <td style="font-size:0.72rem;">${row.date}</td>
      <td style="font-weight:700;">${formatCurrency(row.price, currency)}</td>
      <td>${row.g}</td>
      <td style="font-weight:700; color:var(--profit-red);">${formatCurrency(row.evalE, currency)}</td>
      <td style="font-weight:700; color:#8b5cf6;">${formatCurrency(row.targetV, currency)}</td>
      <td style="color:var(--loss-blue);">${formatCurrency(row.minBand, currency)}</td>
      <td style="color:var(--profit-red);">${formatCurrency(row.maxBand, currency)}</td>
      <td>${poolDeltaText}</td>
      <td>${formatCurrency(row.poolCumulative || row.pool || 0, currency)}</td>
      <td style="font-weight:600;">${formatCurrency(row.totalAsset, currency)}</td>
      <td style="font-weight:700; color:${row.profitPercent >= 0 ? 'var(--profit-red)' : 'var(--loss-blue)'};">${row.profitPercent >= 0 ? '+' : ''}${row.profitPercent.toFixed(2)}%</td>
      <td>${row.qty.toLocaleString()}주</td>
      <td>${formatCurrency(row.avgPrice, currency)}</td>
      <td style="white-space:nowrap;">
        <button class="btn-secondary btn-edit-week" data-week="${row.week}" style="padding:2px 6px; font-size:0.68rem; background:rgba(99,102,241,0.2); border-color:#6366f1; color:#a5b4fc; margin-right:4px;">✏️ 수정</button>
        <button class="btn-secondary btn-delete-row-week" data-week="${row.week}" style="padding:2px 6px; font-size:0.68rem; background:rgba(239,68,68,0.2); border-color:#ef4444; color:#f87171;">🗑️ 삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-edit-week').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const weekNum = parseInt(btn.getAttribute('data-week'));
      openEditWeekModal(weekNum);
    });
  });

  tbody.querySelectorAll('.btn-delete-row-week').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const weekNum = parseInt(btn.getAttribute('data-week'));
      if (window.currentModalStock) {
        const stock = window.currentModalStock;
        if (confirm(`[${weekNum}주차] 기록을 삭제하시겠습니까?`)) {
          appStore.deleteWeeklyRecord(stock.id, weekNum);
          const updatedStock = appStore.getStocks().find(s => s.id === stock.id);
          if (updatedStock) {
            window.currentModalStock = updatedStock;
            const updatedHistory = appStore.getStockHistory(updatedStock.id);
            renderModalVRHistoryChart(updatedHistory, updatedStock.currency);
            renderModalWeeklyHistoryTable(updatedHistory, updatedStock.currency);
          }
        }
      }
    });
  });
}

function openEditWeekModal(weekNum) {
  if (!window.currentModalStock) return;
  const stock = window.currentModalStock;
  const history = appStore.getStockHistory(stock.id);
  const record = history.find(h => h.week === weekNum);
  if (!record) return;

  const modal = document.getElementById('edit-week-modal');
  document.getElementById('edit-week-modal-title').textContent = `✏️ ${weekNum}주차 기록 수동 수정`;
  document.getElementById('edit-week-num').value = weekNum;
  document.getElementById('edit-week-label').value = `${weekNum}주차`;
  document.getElementById('edit-date-range').value = record.date;
  document.getElementById('edit-price').value = record.price;
  document.getElementById('edit-g').value = record.g || 15;
  document.getElementById('edit-qty').value = record.qty;
  document.getElementById('edit-pool-delta').value = record.poolDelta || 0;
  document.getElementById('edit-target-v').value = record.targetV;

  modal.classList.add('active');
}

// 거래 내역 뷰 렌더링 (종목별 필터링 기능 탑재)
function renderTransactions(filterStockId = 'ALL') {
  const txs = appStore.getTransactions();
  const stocks = appStore.getStocks();
  const txContainer = document.getElementById('tx-list-container');
  const filterSelect = document.getElementById('tx-stock-filter-select');

  if (!txContainer) return;

  // 종목 드롭다운 필터 옵션 채우기 (최초 1회 동적 생성)
  if (filterSelect && filterSelect.options.length <= 1) {
    stocks.forEach(stk => {
      const opt = document.createElement('option');
      opt.value = stk.id;
      opt.textContent = `${stk.name} (${stk.code})`;
      filterSelect.appendChild(opt);
    });

    filterSelect.addEventListener('change', () => {
      renderTransactions(filterSelect.value);
    });
  }

  const filteredTxs = filterStockId === 'ALL' ? txs : txs.filter(t => t.stockId === filterStockId);

  txContainer.innerHTML = '';
  if (filteredTxs.length === 0) {
    txContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.85rem;">
      ${filterStockId === 'ALL' ? '기록된 거래 내역이 없습니다.' : '선택한 종목의 매매일지 거래 내역이 없습니다.'}
    </div>`;
    return;
  }

  filteredTxs.forEach(tx => {
    const stock = stocks.find(s => s.id === tx.stockId) || { name: '알 수 없음', currency: 'KRW' };
    const item = document.createElement('div');
    item.className = 'tx-item';
    item.innerHTML = `
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="tx-type-badge ${tx.type === 'BUY' ? 'tx-buy' : 'tx-sell'}">${tx.type === 'BUY' ? '매수' : '매도'}</span>
          <strong style="font-size:0.95rem;">${stock.name}</strong>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${tx.date}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.95rem; font-weight:600;">${tx.quantity.toLocaleString()}주 @ ${formatCurrency(tx.price, stock.currency)}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">수수료: ${formatCurrency(tx.fee || 0, stock.currency)}</div>
      </div>
    `;
    txContainer.appendChild(item);
  });
}

// 종목 전략 설정 뷰 렌더링
function renderStrategies() {
  const stocks = appStore.getStocks();
  const container = document.getElementById('strategy-list-container');
  if (!container) return;

  container.innerHTML = '';
  stocks.forEach(stock => {
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.style.marginBottom = '12px';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h4 style="font-size:1rem; font-weight:700;">${stock.name} (${stock.code})</h4>
        <span style="font-size:0.8rem; background:rgba(99,102,241,0.2); color:#8b5cf6; padding:2px 8px; border-radius:12px;">${stock.strategyType || 'VR'}</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; font-size:0.82rem;">
        <div>주차 주기: <strong>${stock.cycleWeeks || 2}주차</strong></div>
        <div>VR 밴드: <strong>±${stock.vrBandPercent || 15}%</strong></div>
        <div>지수(G): <strong>${stock.G || 15}</strong></div>
        <div>매수한도: <strong>예수금 25%</strong></div>
      </div>
    `;
    container.appendChild(card);
  });
}

// 시세 시뮬레이터 렌더링
function renderSimulator() {
  const stocks = appStore.getStocks();
  const container = document.getElementById('simulator-list-container');
  if (!container) return;

  container.innerHTML = '';

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'btn-primary';
  refreshBtn.style.width = '100%';
  refreshBtn.style.justifyContent = 'center';
  refreshBtn.style.marginBottom = '14px';
  refreshBtn.innerHTML = '🔄 실시간 시세 & 환율 API 갱신';
  refreshBtn.onclick = () => refreshRealtimePrices();
  container.appendChild(refreshBtn);

  stocks.forEach(stock => {
    const item = document.createElement('div');
    item.className = 'glass-card';
    item.style.marginBottom = '12px';
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div>
          <strong>${stock.name}</strong> <span style="font-size:0.8rem; color:var(--text-muted);">${stock.code}</span>
        </div>
        <span style="font-size:0.9rem; font-weight:700; color:var(--accent-blue);" id="sim-price-${stock.id}">${formatCurrency(stock.currentPrice, stock.currency)}</span>
      </div>
      <div style="display:flex; gap:8px;">
        <input type="number" step="0.1" id="sim-input-${stock.id}" class="form-input" value="${stock.currentPrice}" style="flex:1; padding:8px 10px;">
        <button class="btn-primary" onclick="window.updateSimulatedPrice('${stock.id}')" style="padding:8px 12px; font-size:0.8rem;">수동적용</button>
      </div>
    `;
    container.appendChild(item);
  });
}

window.updateSimulatedPrice = function(stockId) {
  const input = document.getElementById(`sim-input-${stockId}`);
  if (input && input.value) {
    appStore.updateStockPrice(stockId, parseFloat(input.value));
    renderDashboard();
    renderSimulator();
    checkTriggeredAlerts();
    if (window.currentModalStock) {
      const updatedStock = appStore.getStocks().find(s => s.id === window.currentModalStock.id);
      if (updatedStock) openStockDetailModal(updatedStock);
    }
  }
};

// 모달 이벤트 및 폼 바인딩
function bindModalEvents() {
  const tradeModal = document.getElementById('trade-modal');
  const stockDetailModal = document.getElementById('stock-detail-modal');
  const init0WeekModal = document.getElementById('init-0week-modal');
  const editWeekModal = document.getElementById('edit-week-modal');
  const addWeekModal = document.getElementById('add-week-modal');
  const closeBtns = document.querySelectorAll('.close-btn');

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (tradeModal.classList.contains('active')) {
        tradeModal.classList.remove('active');
        if (onTradeSuccessCallback) {
          addWeekModal.classList.add('active');
        }
        return;
      }
      
      tradeModal.classList.remove('active');
      if (stockDetailModal) stockDetailModal.classList.remove('active');
      if (init0WeekModal) init0WeekModal.classList.remove('active');
      if (editWeekModal) editWeekModal.classList.remove('active');
      if (addWeekModal) addWeekModal.classList.remove('active');
    });
  });

  document.getElementById('btn-open-add-tx')?.addEventListener('click', () => {
    onTradeSuccessCallback = null;
    openTradeModal();
  });

  // ⭐ 다중 거래 일괄 저장 처리
  document.getElementById('tx-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const stockId = document.getElementById('tx-stock-select').value;
    const stock = appStore.getStocks().find(s => s.id === stockId);
    if (!stock) return;

    const rows = document.querySelectorAll('.batch-trade-row');
    const validTxs = [];
    let netPoolDelta = 0;
    let netQtyDelta = 0;
    let lastPrice = stock.currentPrice;

    rows.forEach(tr => {
      const type = tr.querySelector('.batch-type-select').value;
      const date = tr.querySelector('.batch-date-input').value;
      const quantity = parseFloat(tr.querySelector('.batch-qty-input').value || 0);
      const price = parseFloat(tr.querySelector('.batch-price-input').value || 0);

      if (quantity > 0 && price > 0) {
        const tradeAmount = quantity * price;
        validTxs.push({ stockId, type, date, quantity, price, fee: 0 });

        if (type === 'BUY') {
          netPoolDelta -= tradeAmount;
          netQtyDelta += quantity;
        } else if (type === 'SELL') {
          netPoolDelta += tradeAmount;
          netQtyDelta -= quantity;
        }

        lastPrice = price;
      }
    });

    if (validTxs.length === 0) {
      alert('유효한 수량과 단가를 입력한 거래 행이 최소 1개 이상 필요합니다.');
      return;
    }

    // DB에 각 거래 내역 일괄 저장
    validTxs.forEach(tx => {
      appStore.addTransaction(tx);
    });

    tradeModal.classList.remove('active');
    renderDashboard();
    renderTransactions();

    // ⭐ 주차 추가 창에서 연동된 콜백이 있으면 일괄 합산 데이터 주입!
    if (onTradeSuccessCallback) {
      const callback = onTradeSuccessCallback;
      onTradeSuccessCallback = null;
      callback({
        netPoolDelta,
        netQtyDelta,
        lastPrice,
        txCount: validTxs.length
      });
    } else if (window.currentModalStock && window.currentModalStock.id === stockId) {
      const updated = appStore.getStocks().find(s => s.id === stockId);
      if (updated) openStockDetailModal(updated);
    }
  });
}

function openTradeModal(stock = null) {
  const targetStock = stock || window.currentModalStock || (appStore.getStocks()[0]);
  populateStockSelectOptions(targetStock ? targetStock.id : null);

  const tbody = document.getElementById('batch-trade-tbody');
  if (tbody) {
    tbody.innerHTML = '';
  }

  addBatchTradeRow('BUY', null, '', targetStock ? targetStock.currentPrice : '');
  addBatchTradeRow('SELL', null, '', targetStock ? targetStock.currentPrice : '');

  const tradeModal = document.getElementById('trade-modal');
  tradeModal.classList.add('active');
}

function populateStockSelectOptions(selectedId = null) {
  const select = document.getElementById('tx-stock-select');
  if (!select) return;

  const stocks = appStore.getStocks();
  select.innerHTML = stocks.map(s => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.name} (${s.code})</option>`).join('');
}

function formatCurrency(val, currency = 'USD') {
  if (currency === 'KRW') {
    return `₩${Math.round(val).toLocaleString()}`;
  }
  return `$${parseFloat(val).toFixed(2)}`;
}