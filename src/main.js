const fmtUsd = (v) => Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const state = {
  taxIncome: 280000,
  taxYears: 10,
  mcAssets: 1500000,
  mcWithdraw: 4,
  mcYears: 30,
  feeAssets: 2000000,
  legacyFee: 1,
  fidFee: 0.35
};

const el = Object.fromEntries(['taxIncome','taxYears','mcAssets','mcWithdraw','mcYears','feeAssets','legacyFee','fidFee','taxYearsLabel','mcWithdrawLabel','mcYearsLabel','legacyFeeLabel','fidFeeLabel','successPct','oppCost','cityName'].map(id => [id, document.getElementById(id)]));
let taxChart, monteChart, feeChart;

const brackets = {
  now: [[11600,0.1],[47150,0.12],[100525,0.22],[191950,0.24],[243725,0.32],[609350,0.35],[Infinity,0.37]],
  sunset: [[9950,0.1],[40525,0.15],[86375,0.25],[164925,0.28],[209425,0.33],[523600,0.35],[Infinity,0.396]]
};
function progressiveTax(income, table){ let t=0,l=0; for(const [u,r] of table){ const amt=Math.max(0,Math.min(income,u)-l); t = math.add(t, math.multiply(amt,r)); if(income<=u) break; l=u; } return t; }

function buildTax(){
  const labels = Array.from({length: state.taxYears}, (_,i)=>`Y${i+1}`);
  const kept=[], exposure=[];
  for(let i=0;i<state.taxYears;i++){
    const inc = state.taxIncome * Math.pow(1.03,i);
    const now = progressiveTax(inc, brackets.now);
    const sun = progressiveTax(inc, brackets.sunset);
    kept.push(inc - sun);
    exposure.push(Math.max(0, sun-now));
  }
  taxChart.data.labels=labels;
  taxChart.data.datasets[0].data=kept;
  taxChart.data.datasets[1].data=exposure;
  taxChart.update();
}

function randn(){ let u=0,v=0; while(!u)u=Math.random(); while(!v)v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function runMonteCarlo(){
  const n=100, years=state.mcYears, paths=[], finals=[];
  const annualW = state.mcAssets * (state.mcWithdraw/100);
  for(let p=0;p<n;p++){
    let bal=state.mcAssets; const path=[bal];
    for(let y=1;y<=years;y++){
      const r = 0.06 + randn()*0.12;
      bal = Math.max(0, bal*(1+r) - annualW);
      path.push(bal);
    }
    finals.push(bal); paths.push(path);
  }
  const success = finals.filter(v=>v>0).length/n;
  el.successPct.textContent = `${(success*100).toFixed(1)}%`;

  const sorted=[...paths].sort((a,b)=>a[a.length-1]-b[b.length-1]);
  const bear=sorted[Math.floor(n*0.1)], base=sorted[Math.floor(n*0.5)], bull=sorted[Math.floor(n*0.9)];
  monteChart.data.labels = Array.from({length:years+1},(_,i)=>i);
  monteChart.data.datasets[0].data=bear;
  monteChart.data.datasets[1].data=base;
  monteChart.data.datasets[2].data=bull;
  monteChart.update();
}

function buildFeeAudit(){
  const years=30, p=state.feeAssets, gross=0.07;
  const legacy=p*Math.pow(1+gross-(state.legacyFee/100), years);
  const fid=p*Math.pow(1+gross-(state.fidFee/100), years);
  const opp=fid-legacy;
  el.oppCost.textContent = fmtUsd(opp);
  feeChart.data.datasets[0].data=[legacy, opp];
  feeChart.update();
}

function updateLabels(){
  el.taxYearsLabel.textContent = state.taxYears;
  el.mcWithdrawLabel.textContent = `${state.mcWithdraw}%`;
  el.mcYearsLabel.textContent = state.mcYears;
  el.legacyFeeLabel.textContent = `${state.legacyFee}%`;
  el.fidFeeLabel.textContent = `${state.fidFee}%`;
}

function initCharts(){
  Chart.defaults.color='#e2e8f0';
  taxChart = new Chart(document.getElementById('taxChart'), {type:'bar', data:{labels:[], datasets:[{label:'Wealth Kept',data:[], backgroundColor:'#10B981'},{label:'Tax Exposure',data:[], backgroundColor:'#f59e0b'}]}, options:{responsive:true, animation:{duration:650}, scales:{x:{stacked:true},y:{stacked:true}}, plugins:{tooltip:{callbacks:{label:(ctx)=>`${ctx.dataset.label}: ${fmtUsd(ctx.parsed.y)}`}}}}});
  monteChart = new Chart(document.getElementById('monteChart'), {type:'line', data:{labels:[], datasets:[{label:'Bear',data:[],borderColor:'#ef4444',tension:.25},{label:'Baseline',data:[],borderColor:'#3b82f6',tension:.25},{label:'Bull',data:[],borderColor:'#10B981',tension:.25}]}, options:{responsive:true, animation:{duration:650}, plugins:{tooltip:{callbacks:{label:(ctx)=>`${ctx.dataset.label}: ${fmtUsd(ctx.parsed.y)}`}}}}});
  feeChart = new Chart(document.getElementById('feeChart'), {type:'doughnut', data:{labels:['Legacy Net Wealth','Opportunity Cost'], datasets:[{data:[0,0], backgroundColor:['#10B981','#1e293b']}]}, options:{responsive:true, animation:{duration:650}, plugins:{tooltip:{callbacks:{label:(ctx)=>`${ctx.label}: ${fmtUsd(ctx.parsed)}`}}}}});
}

function bind(){
  ['taxIncome','taxYears','mcAssets','mcWithdraw','mcYears','feeAssets','legacyFee','fidFee'].forEach(id=>{
    el[id].addEventListener('input',e=>{
      state[id]=Number(e.target.value);
      updateLabels(); buildTax(); runMonteCarlo(); buildFeeAudit();
    });
  });
}

function setCity(){
  if(!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async ({coords})=>{
    try{
      const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
      const data=await res.json();
      const city=data.address?.city||data.address?.town||data.address?.village;
      if(city) el.cityName.textContent=city;
    }catch{ /* fallback */ }
  });
}

initCharts(); updateLabels(); bind(); buildTax(); runMonteCarlo(); buildFeeAudit(); setCity();
