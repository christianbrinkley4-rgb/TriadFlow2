const currency = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const pct = (n) => `${Number(n).toFixed(1)}%`;

const el = {
  income: document.getElementById('income'),
  filingStatus: document.getElementById('filingStatus'),
  retirementAssets: document.getElementById('retirementAssets'),
  retirementAssetsValue: document.getElementById('retirementAssetsValue'),
  taxPenalty: document.getElementById('taxPenalty'),
  currentAge: document.getElementById('currentAge'),
  retireAge: document.getElementById('retireAge'),
  currentSavings: document.getElementById('currentSavings'),
  currentSavingsValue: document.getElementById('currentSavingsValue'),
  monthlyContribution: document.getElementById('monthlyContribution'),
  monthlyContributionValue: document.getElementById('monthlyContributionValue'),
  annualReturn: document.getElementById('annualReturn'),
  annualReturnValue: document.getElementById('annualReturnValue'),
  inflationToggle: document.getElementById('inflationToggle'),
  portfolioValue: document.getElementById('portfolioValue'),
  feeRate: document.getElementById('feeRate'),
  feeRateValue: document.getElementById('feeRateValue'),
  feesLost: document.getElementById('feesLost')
};

const brackets = {
  current: {
    single: [[11600, 0.1], [47150, 0.12], [100525, 0.22], [191950, 0.24], [243725, 0.32], [609350, 0.35], [Infinity, 0.37]],
    married: [[23200, 0.1], [94300, 0.12], [201050, 0.22], [383900, 0.24], [487450, 0.32], [731200, 0.35], [Infinity, 0.37]]
  },
  postSunset: {
    single: [[9950, 0.1], [40525, 0.15], [86375, 0.25], [164925, 0.28], [209425, 0.33], [523600, 0.35], [Infinity, 0.396]],
    married: [[19900, 0.1], [81050, 0.15], [172750, 0.25], [329850, 0.28], [418850, 0.33], [628300, 0.35], [Infinity, 0.396]]
  }
};

function calculateTax(income, scheme) {
  let tax = 0;
  let lower = 0;
  for (const [upper, rate] of scheme) {
    const taxable = Math.min(income, upper) - lower;
    if (taxable > 0) tax += taxable * rate;
    if (income <= upper) break;
    lower = upper;
  }
  return tax;
}

let taxChart, trajectoryChart, feesChart;

function updateTaxModule() {
  const income = Number(el.income.value) + Number(el.retirementAssets.value) * 0.04;
  const status = el.filingStatus.value;
  const currentTax = calculateTax(income, brackets.current[status]);
  const futureTax = calculateTax(income, brackets.postSunset[status]);
  el.retirementAssetsValue.textContent = currency(Number(el.retirementAssets.value));
  el.taxPenalty.textContent = currency(Math.max(0, futureTax - currentTax));

  taxChart.data.datasets[0].data = [currentTax, futureTax];
  taxChart.update();
}

function generateTrajectory() {
  const age = Number(el.currentAge.value);
  const retireAge = Number(el.retireAge.value);
  const years = Math.max(1, retireAge - age);
  const r = Number(el.annualReturn.value) / 100;
  const monthly = Number(el.monthlyContribution.value);
  let principal = Number(el.currentSavings.value);
  const arr = [principal];

  for (let y = 1; y <= years; y++) {
    principal = principal * (1 + r) + monthly * 12;
    let val = principal;
    if (el.inflationToggle.checked) {
      val = val / Math.pow(1.03, y);
    }
    arr.push(val);
  }
  return { labels: Array.from({ length: years + 1 }, (_, i) => age + i), data: arr };
}

function updateTrajectoryModule() {
  el.currentSavingsValue.textContent = currency(Number(el.currentSavings.value));
  el.monthlyContributionValue.textContent = currency(Number(el.monthlyContribution.value));
  el.annualReturnValue.textContent = pct(el.annualReturn.value);
  const result = generateTrajectory();
  trajectoryChart.data.labels = result.labels;
  trajectoryChart.data.datasets[0].data = result.data;
  trajectoryChart.data.datasets[0].label = el.inflationToggle.checked ? 'Inflation Adjusted Value' : 'Nominal Value';
  trajectoryChart.update();
}

function updateFeeModule() {
  const p = Number(el.portfolioValue.value);
  const fee = Number(el.feeRate.value) / 100;
  el.feeRateValue.textContent = pct(el.feeRate.value);
  const annualGross = 0.07;
  const noFee = p * Math.pow(1 + annualGross, 20);
  const afterFee = p * Math.pow(1 + annualGross - fee, 20);
  const lost = Math.max(0, noFee - afterFee);
  el.feesLost.textContent = currency(lost);

  feesChart.data.datasets[0].data = [afterFee, lost];
  feesChart.update();
}

function initCharts() {
  taxChart = new Chart(document.getElementById('taxChart'), {
    type: 'bar',
    data: { labels: ['Current Brackets', 'Projected 2026+ Brackets'], datasets: [{ data: [0, 0], backgroundColor: ['#2ea0ff', '#24e5a2'] }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  trajectoryChart = new Chart(document.getElementById('trajectoryChart'), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Nominal Value', data: [], borderColor: '#2ea0ff', backgroundColor: 'rgba(46,160,255,0.25)', fill: true, tension: 0.25 }] },
    options: { responsive: true }
  });

  feesChart = new Chart(document.getElementById('feesChart'), {
    type: 'pie',
    data: { labels: ['Wealth Kept', 'Wealth Lost to Wall Street'], datasets: [{ data: [0, 0], backgroundColor: ['#24e5a2', '#2a3d65'] }] },
    options: { responsive: true }
  });
}

function bindEvents() {
  Object.values(el).forEach((node) => {
    if (node && ['INPUT', 'SELECT'].includes(node.tagName)) {
      node.addEventListener('input', () => {
        updateTaxModule();
        updateTrajectoryModule();
        updateFeeModule();
      });
    }
  });
}

initCharts();
bindEvents();
updateTaxModule();
updateTrajectoryModule();
updateFeeModule();
