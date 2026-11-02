(()=>{'use strict';
const D=window.NYC_DATA;const $=id=>document.getElementById(id);
if(!D||!window.Plotly){document.body.insertAdjacentHTML('afterbegin','<div class="error">Dashboard data or Plotly could not load. Keep index.html and the assets folder together.</div>');return;}
const Y=D.meta.years,B=D.meta.boroughs,V=D.meta.vehicleGroups,F=D.meta.factorNames;
const C={crashes:'#418FB6',injured:'#E5AF62',killed:'#CE7780',teal:'#4DB6AD',blue:'#418FB6',grid:'#E4EEF2'};
const state={start:2013,end:2025,borough:'ALL',trend:'indexed',actual:0,heat:'count',pair:'count',factor:'count',selectedYear:null,pairSelected:null,mapIndex:0,tour:-1,playing:false,boroughMode:'count',matrixScope:'6',includeUnknownPair:false,mapMetric:'all',heatSelected:null,factorSelected:null,roadSelected:null,factorLimit:6};
const fmt=n=>(Number.isFinite(n)?Math.round(n).toLocaleString('en-US'):'—');
const pct=(a,b,d=1)=>b>0?(100*a/b).toFixed(d)+'%':'N/A';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Single, compact tooltip for HTML-based charts; Plotly keeps its own hover tooltip.
const floatingTip=$('floatingChartTip');
let tipTarget=null;
function hideChartTip(){floatingTip.hidden=true;tipTarget=null}
function placeChartTip(e,anchor){
 const rect=anchor?.getBoundingClientRect?.();const x=e?.clientX??(rect?rect.left+rect.width/2:window.innerWidth/2);
 const y=e?.clientY??(rect?rect.top+rect.height/2:window.innerHeight/2);
 const w=floatingTip.offsetWidth,h=floatingTip.offsetHeight;
 const left=Math.max(12,Math.min(window.innerWidth-w-12,x+13));
 const top=y+h+18<window.innerHeight?y+16:Math.max(12,y-h-14);
 floatingTip.style.left=left+'px';floatingTip.style.top=top+'px';
}
function showChartTip(el,event){
 if(!el||!el.dataset.tip)return;
 tipTarget=el;floatingTip.replaceChildren();
 const parts=el.dataset.tip.split('\n');
 parts.forEach((line,i)=>{const row=document.createElement('span');row.className=i===0?'tip-heading':line.startsWith('↗')?'tip-hint':'tip-line';row.textContent=line;floatingTip.appendChild(row)});
 floatingTip.hidden=false;placeChartTip(event,el);
}
document.addEventListener('pointerover',e=>{const el=e.target.closest?.('[data-tip]');if(el!==tipTarget){if(el)showChartTip(el,e);else hideChartTip()}});
document.addEventListener('pointermove',e=>{const el=e.target.closest?.('[data-tip]');if(el && (el!==tipTarget || floatingTip.hidden))showChartTip(el,e);else if(tipTarget)placeChartTip(e,tipTarget)});
document.addEventListener('pointerout',e=>{if(tipTarget && e.target.closest?.('[data-tip]')===tipTarget && !tipTarget.contains(e.relatedTarget))hideChartTip()});
document.addEventListener('focusin',e=>{const el=e.target.closest?.('[data-tip]');if(el)showChartTip(el);else hideChartTip()});
document.addEventListener('focusout',e=>{if(tipTarget&&e.target===tipTarget)hideChartTip()});
document.addEventListener('click',e=>{const el=e.target.closest?.('[data-tip]');if(el && !el.hasAttribute('data-roaduser'))showChartTip(el,e);else if(!el)hideChartTip()},true);
window.addEventListener('scroll',()=>{if(tipTarget && document.activeElement===tipTarget && tipTarget.isConnected)placeChartTip(null,tipTarget);else hideChartTip()},{passive:true});window.addEventListener('resize',hideChartTip);

const sumArr=(dst,src)=>{for(let i=0;i<src.length;i++)dst[i]=(dst[i]||0)+(src[i]||0);return dst};
const activeYear=yi=>(Y[yi]>=state.start&&Y[yi]<=state.end);
const activeBoro=bi=>state.borough==='ALL'||B[bi]===state.borough;
const zero=(n)=>Array(n).fill(0);
const DATAINDEX={};
for(const key of ['summary','hour','pairs','factors','quality']){
 let map=new Map();const dims={summary:2,hour:3,pairs:4,factors:3,quality:2}[key];
 for(const row of D[key])map.set(row.slice(0,dims).join('|'),row.slice(dims));
 DATAINDEX[key]=map;
}
function aggregate(table, suffix, dims){const out=zero(suffix);for(const row of D[table])if(activeYear(row[0])&&activeBoro(row[1]))sumArr(out,row.slice(dims));return out}
function annual(){return Y.filter(y=>y>=state.start&&y<=state.end).map(y=>{
  let z=zero(14);for(let b=0;b<B.length;b++)if(activeBoro(b))sumArr(z,DATAINDEX.summary.get((y-2013)+'|'+b)||zero(14));return {year:y,v:z};
})}
const sumSelected=()=>{let arr=zero(14);for(const r of annual())sumArr(arr,r.v);return arr};
const chartBase={displayModeBar:false,responsive:true,scrollZoom:false};
function plot(div,traces,layout){return Plotly.react(div,traces,{font:{family:'Inter, Segoe UI, Arial',size:11,color:'#556D7E'},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',margin:{l:48,r:30,t:32,b:45},hoverlabel:{bgcolor:'#234559',font:{color:'#fff',size:11}},...layout},chartBase)}
function renderKPI(){const x=sumSelected();$('kpiCrashes').textContent=fmt(x[0]);$('kpiInjured').textContent=fmt(x[1]);$('kpiKilled').textContent=fmt(x[2]);$('kpiPct').textContent=pct(x[3],x[4]);$('filterContext').textContent='Showing: '+(state.borough==='ALL'?'All NYC':state.borough==='UNKNOWN'?'Unknown borough':titleBoro(state.borough))+'  |  '+state.start+'–'+state.end; for(let i=1;i<=3;i++)$('kpiPeriod'+i).textContent=state.start+'–'+state.end+(i===1?' · crash events':' · people')}
function titleBoro(s){return s.toLowerCase().replace(/\b\w/g,x=>x.toUpperCase())}
const METRICINFO=[{idx:0,name:'Reported crashes',color:C.crashes},{idx:1,name:'People injured',color:C.injured},{idx:2,name:'People killed',color:C.killed}];
function renderTrend(){
 const contextOnly=state.start===state.end;
 const series=contextOnly?Y.map(y=>{let z=zero(17);for(let b=0;b<B.length;b++)if(activeBoro(b))sumArr(z,DATAINDEX.summary.get((y-2013)+'|'+b)||zero(17));return{year:y,v:z}}):annual();
 const years=series.map(r=>r.year);
 let base=zero(17);for(let bi=0;bi<B.length;bi++)if(activeBoro(bi))sumArr(base,DATAINDEX.summary.get('6|'+bi)||zero(17));
 const focused=state.selectedYear&&years.includes(state.selectedYear)?state.selectedYear:contextOnly?state.start:null;
 const trace=[];
 const formatHover=(m)=>'<b>'+m.name+'</b> · %{x}<br>Actual: %{customdata[0]:,.0f}<br>Index: %{customdata[1]:.1f}<br>Change from 2019: %{customdata[2]:+.1f}%<extra></extra>';
 const metrics=state.trend==='indexed'?METRICINFO:[METRICINFO[state.actual]];
 for(const m of metrics){
  const idx=m.idx;
  const values=series.map(r=>base[idx]?100*r.v[idx]/base[idx]:null);
  const y=state.trend==='indexed'?values:series.map(r=>r.v[idx]);
  trace.push({type:'scatter',mode:'lines+markers',name:m.name,x:years,y,
   line:{color:m.color,width:contextOnly?2.6:3},marker:{size:years.map(year=>year===focused?12:7),color:years.map(year=>year===focused?m.color:contextOnly?m.color:m.color),opacity:years.map(year=>contextOnly&&focused!==year?.56:1),line:{color:'#fff',width:1.4}},
   customdata:series.map((r,i)=>[r.v[idx],values[i],values[i]===null?null:values[i]-100]),hovertemplate:formatHover(m)});
 }
 const shapes=[],annotations=[];
 if(focused!==null){shapes.push({type:'rect',x0:focused-.24,x1:focused+.24,y0:0,y1:1,yref:'paper',fillcolor:'rgba(76,134,168,.11)',line:{width:0},layer:'below'});}
 const yTitle=state.trend==='indexed'?'Index (2019 = 100)':metrics[0].idx===0?'Reported crashes':'Number of people';
 const layout={height:352,margin:{l:72,r:18,t:36,b:73},showlegend:state.trend==='indexed',legend:{orientation:'h',x:.5,xanchor:'center',y:-.34,font:{size:10}},xaxis:{title:{text:'Year',standoff:10,font:{size:12,color:'#44697C'}},tickmode:'array',tickvals:years,range:[years[0]-.3,years.at(-1)+.3],tickfont:{size:11},showgrid:false,zeroline:false,fixedrange:true,automargin:true},yaxis:{title:{text:yTitle,standoff:9,font:{size:12,color:'#44697C'}},gridcolor:C.grid,zeroline:false,rangemode:'tozero',fixedrange:true,automargin:true},shapes,annotations,hovermode:'x unified',dragmode:false};
 const axisHint=state.trend==='indexed'?'Y-axis: index relative to 2019 (100 = 2019 level).':`Y-axis: ${metrics[0].idx===0?'number of crash reports':'number of people'}.`;
 const descr=contextOnly?`Showing ${state.start} in the 2013–2025 context. X-axis: year. ${axisHint}`:`Explore ${state.start}–${state.end}. X-axis: year. ${axisHint}`;
 $('trendDescription').textContent=descr;
 plot($('trendPlot'),trace,layout).then(()=>{const el=$('trendPlot');if(el.removeAllListeners)el.removeAllListeners('plotly_click');el.on('plotly_click',ev=>{const year=Number(ev.points?.[0]?.x);state.selectedYear=state.selectedYear===year&&!contextOnly?null:year;renderTrend()})});
 // A clicked year remains highlighted; Plotly hover tooltips show values in-chart.
}
function renderHuman(){
 const z=sumSelected();
 const users=[{name:'Motorists',inj:z[5],fatal:z[6],color:'#418FB6'},
 {name:'Pedestrians',inj:z[7],fatal:z[8],color:'#E5AF62'},
 {name:'Cyclists',inj:z[9],fatal:z[10],color:'#4DB6AD'}];
 const totals={inj:users.reduce((a,u)=>a+u.inj,0),fatal:users.reduce((a,u)=>a+u.fatal,0)};
 const metricLabel={inj:'People injured',fatal:'People killed'};
 const row=(metric)=>{
  const total=totals[metric];
  return `<div class="human-metric"><div class="human-metric-head"><div class="human-metric-copy"><span class="human-metric-label">${metricLabel[metric]}</span></div><div class="human-metric-total" aria-label="${fmt(total)} classified ${metricLabel[metric].toLowerCase()}"><strong>${fmt(total)}</strong><span>people</span></div></div>
  <div class="human-stack" role="group" aria-label="${metricLabel[metric]} split by road-user category">
  ${total>0?users.map(u=>{
    const value=u[metric],share=100*value/total,selected=state.roadSelected===u.name;
    const tip=`${u.name} · ${metricLabel[metric]}\n${fmt(value)} people · ${share.toFixed(1)}% of classified ${metric==='inj'?'injuries':'fatalities'}\nOther outcome: ${fmt(u[metric==='inj'?'fatal':'inj'])} people (${pct(u[metric==='inj'?'fatal':'inj'],totals[metric==='inj'?'fatal':'inj'])})\n↗ Click for annual trends`;
    return value?`<button type="button" class="human-stack-segment ${selected?'chosen':''}" data-roaduser="${u.name}" data-tip="${esc(tip)}" aria-label="${esc(tip)}" style="width:${share}%;background:${u.color}">${share>=12?`<span>${share.toFixed(1)}%</span>`:''}</button>`:'';
  }).join(''):'<span class="human-no-data">No classified data for this selection</span>'}</div></div>`;
 };
 $('roadGrid').innerHTML=row('inj')+row('fatal');
 $('roadLegend').innerHTML=users.map(u=>{
  const tip=`${u.name}\n${fmt(u.inj)} injured (${pct(u.inj,totals.inj)} of classified injuries)\n${fmt(u.fatal)} killed (${pct(u.fatal,totals.fatal)} of classified fatalities)\n↗ Click for annual trends`;
  return `<button type="button" data-roaduser="${u.name}" data-tip="${esc(tip)}" class="human-legend-item ${state.roadSelected===u.name?'chosen':''}" aria-label="Open ${u.name} annual trends"><span class="human-swatch" style="background:${u.color}"></span><span>${u.name}</span></button>`;
 }).join('');
 document.querySelectorAll('#roadGrid [data-roaduser],#roadLegend [data-roaduser]').forEach(el=>el.addEventListener('click',()=>{
  const user=el.dataset.roaduser;state.roadSelected=user;
  document.querySelectorAll('#roadGrid [data-roaduser],#roadLegend [data-roaduser]').forEach(b=>b.classList.toggle('chosen',b.dataset.roaduser===user));
  openRoadTrend(user,el);
 }));
}
let roadReturnFocus=null;
function openRoadTrend(user,trigger){
 hideChartTip();roadReturnFocus=trigger;
 const groups={Motorists:[5,6,'#418FB6'],Pedestrians:[7,8,'#D19B4E'],Cyclists:[9,10,'#3C9F96']};
 const [injIdx,deadIdx,color]=groups[user];
 const period=state.start===state.end?Y.map(y=>y):Y.filter(y=>y>=state.start&&y<=state.end);
 const series=period.map(y=>{
  const v=zero(17);for(let bi=0;bi<B.length;bi++)if(activeBoro(bi))sumArr(v,DATAINDEX.summary.get((y-2013)+'|'+bi)||zero(17));
  return {year:y,inj:v[injIdx],killed:v[deadIdx]};
 });
 const total=sumSelected(),inj=total[injIdx],killed=total[deadIdx];
 $('roadModalTitle').textContent='Annual injuries and fatalities · '+user;
 $('roadModalDesc').textContent=`${state.borough==='ALL'?'All NYC':titleBoro(state.borough)} · ${state.start===state.end?'2013–2025 historical context (selected '+state.start+')':state.start+'–'+state.end}. Separate axes avoid comparing unequal injury and fatality scales.`;
 $('roadModalSummary').innerHTML=`<span>Injured <b>${fmt(inj)}</b></span><span>Killed <b>${fmt(killed)}</b></span><span>Of classified injuries <b>${pct(inj,total[5]+total[7]+total[9])}</b></span><span>Of classified fatalities <b>${pct(killed,total[6]+total[8]+total[10])}</b></span>`;
 $('roadModal').hidden=false;document.body.style.overflow='hidden';$('roadModalClose').focus();
 const xs=series.map(r=>r.year);
 const traces=[
  {type:'scatter',mode:'lines+markers',x:xs,y:series.map(r=>r.inj),xaxis:'x',yaxis:'y',name:'People injured',line:{color,width:3},marker:{size:7,color},hovertemplate:`<b>${esc(user)} · Injured</b><br>%{x}: %{y:,.0f} people<extra></extra>`},
  {type:'scatter',mode:'lines+markers',x:xs,y:series.map(r=>r.killed),xaxis:'x2',yaxis:'y2',name:'People killed',line:{color:'#B86E77',width:3},marker:{size:7,color:'#B86E77'},hovertemplate:`<b>${esc(user)} · Killed</b><br>%{x}: %{y:,.0f} people<extra></extra>`}
 ];
 const selected=state.start===state.end?state.start:null;
 const shapes=selected?[{type:'rect',xref:'x',yref:'paper',x0:selected-.38,x1:selected+.38,y0:0,y1:1,fillcolor:'rgba(65,143,182,.10)',line:{width:0},layer:'below'}]:[];
 plot($('roadModalPlot'),traces,{height:420,margin:{l:66,r:20,t:32,b:42},showlegend:false,hovermode:'closest',dragmode:false,
  xaxis:{domain:[0,1],anchor:'y',showticklabels:false,showgrid:false,fixedrange:true,range:[xs[0]-.4,xs.at(-1)+.4]},
  yaxis:{domain:[.57,1],title:{text:'People injured',standoff:10},rangemode:'tozero',gridcolor:'#E6EFF2',fixedrange:true,automargin:true},
  xaxis2:{domain:[0,1],anchor:'y2',matches:'x',dtick:1,showgrid:false,tickfont:{size:10},fixedrange:true},
  yaxis2:{domain:[0,.37],title:{text:'People killed',standoff:10},rangemode:'tozero',gridcolor:'#E6EFF2',fixedrange:true,automargin:true},
  annotations:[{x:0,y:1.065,xref:'paper',yref:'paper',text:'INJURED',font:{size:10,color},showarrow:false,xanchor:'left'},
   {x:0,y:.455,xref:'paper',yref:'paper',text:'KILLED',font:{size:10,color:'#B86E77'},showarrow:false,xanchor:'left'}],shapes});
}
function closeRoadTrend(){if($('roadModal').hidden)return;$('roadModal').hidden=true;document.body.style.overflow='';hideChartTip();if(roadReturnFocus?.isConnected)roadReturnFocus.focus();roadReturnFocus=null}
$('roadModalClose').addEventListener('click',closeRoadTrend);
$('roadModal').addEventListener('click',e=>{if(e.target===$('roadModal'))closeRoadTrend()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('roadModal').hidden){e.stopPropagation();closeRoadTrend()}});
function renderBorough(){
 // Keep a five-borough context even when one borough is selected globally.
 const rows=B.map((b,bi)=>{const v=zero(17);for(let y=state.start;y<=state.end;y++)sumArr(v,DATAINDEX.summary.get((y-2013)+'|'+bi)||zero(17));return{b,v}});
 const known=rows.filter(r=>r.b!=='UNKNOWN');const unknown=rows.find(r=>r.b==='UNKNOWN');
 const metric=state.boroughMode==='pct'?3:0; // injury-involved crash COUNT, not a ratio of ratios
 const totalKnown=known.reduce((a,r)=>a+r.v[metric],0),cityTotal=totalKnown+unknown.v[metric];
 const colors=['#418FB6','#4DB6AD','#E5AF62','#A7D4E2','#356981'];
 const ordered=known.slice().sort((a,b)=>b.v[metric]-a.v[metric]);
 const cx=118,cy=118,outer=94,inner=58;
 const polar=(r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)];
 const arc=(a,b)=>{const [x1,y1]=polar(outer,a),[x2,y2]=polar(outer,b),[x3,y3]=polar(inner,b),[x4,y4]=polar(inner,a);const big=b-a>Math.PI?1:0;return `M${x1.toFixed(3)},${y1.toFixed(3)} A${outer},${outer} 0 ${big} 1 ${x2.toFixed(3)},${y2.toFixed(3)} L${x3.toFixed(3)},${y3.toFixed(3)} A${inner},${inner} 0 ${big} 0 ${x4.toFixed(3)},${y4.toFixed(3)} Z`};
 let angle=-Math.PI/2, segments=[];
 for(const [i,r] of ordered.entries()){
  if(!r.v[metric]||!totalKnown)continue;
  const span=r.v[metric]/totalKnown*2*Math.PI,a=angle+.006,b=angle+span-.006;
  const selected=state.borough===r.b;
  segments.push(`<path data-borough="${esc(r.b)}" d="${arc(a,b)}" fill="${colors[B.indexOf(r.b)]}" class="donut-segment ${selected?'selected':''} ${state.borough!=='ALL'&&state.borough!=='UNKNOWN'&&!selected?'dimmed':''}" tabindex="0" role="button" data-tip="${esc(`${titleBoro(r.b)}\n${fmt(r.v[metric])} ${state.boroughMode==='pct'?'injury-involved reports':'crash reports'} · ${pct(r.v[metric],totalKnown)} of named boroughs\n${pct(r.v[3],r.v[4])} injury-involved among known-status crashes\n↗ Click to filter the dashboard`)}" aria-label="Select ${esc(titleBoro(r.b))}, ${fmt(r.v[metric])} reports, ${pct(r.v[metric],totalKnown)} of known-borough total"></path>`);
  angle+=span;
 }
 const selected=known.find(r=>r.b===state.borough);
 const centerValue=selected?fmt(selected.v[metric]):fmt(totalKnown);
 const centerLabel=selected?titleBoro(selected.b):'FIVE BOROUGHS';
 $('boroRows').innerHTML=`<div class="donut-layout"><div class="donut-visual"><svg viewBox="0 0 236 236" class="donut-svg" role="img" aria-label="Five borough distribution, click a slice to select a borough">${segments.join('')||'<circle cx="118" cy="118" r="76" fill="none" stroke="#E4EBEF" stroke-width="35"/>'}<text x="118" y="104" class="donut-center-kicker" text-anchor="middle">${esc(centerLabel.toUpperCase())}</text><text x="118" y="128" class="donut-center-total" text-anchor="middle">${centerValue}</text><text x="118" y="145" class="donut-center-caption" text-anchor="middle">${selected?'selected reports':'known-borough reports'}</text></svg></div><div class="donut-side"><div class="donut-side-title"><b>${state.boroughMode==='count'?'SHARE OF ALL CRASHES':'SHARE OF INJURY CRASHES'}</b><span>Known boroughs only</span></div><div class="donut-legend">${ordered.map(r=>`<button type="button" data-borough="${esc(r.b)}" class="donut-legend-item ${state.borough===r.b?'active':''}" data-tip="${esc(`${titleBoro(r.b)}\n${fmt(r.v[metric])} reports · ${pct(r.v[metric],totalKnown)} of named boroughs\n↗ Click to filter the dashboard`)}"><span class="donut-swatch" style="background:${colors[B.indexOf(r.b)]}"></span><span class="donut-legend-name">${esc(titleBoro(r.b))}</span><strong>${pct(r.v[metric],totalKnown)}</strong><small>${fmt(r.v[metric])}</small></button>`).join('')}</div><div class="donut-context">${state.borough==='ALL'?'Select a borough to filter all seven views.':state.borough==='UNKNOWN'?'Unknown borough is selected globally. Choose a named slice or reset filters.':`Showing ${esc(titleBoro(state.borough))} across the dashboard. Click the slice again to show all NYC.`}</div>${state.borough!=='ALL'?'<button id="donutClear" class="donut-clear" type="button">Clear borough selection ×</button>':''}</div></div>`;
 $('boroughMissing').innerHTML=`<div class="missing-summary-main"><span class="missing-icon">?</span><div class="missing-summary-copy"><strong>Borough not recorded</strong><small>Not a sixth slice · included in citywide figures</small></div></div><div class="missing-summary-stat"><strong>${fmt(unknown.v[metric])}</strong><small>${pct(unknown.v[metric],cityTotal)} of NYC ${metric===3?'injury-crash':'crash'} reports</small></div>`;
 const choose=b=>{state.borough=state.borough===b?'ALL':b;$('borough').value=state.borough;state.pairSelected=null;state.factorSelected=null;state.heatSelected=null;renderAll({resetTimeline:true})};
 $('boroRows').querySelectorAll('[data-borough]').forEach(el=>{el.addEventListener('click',()=>choose(el.dataset.borough));el.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&el.tagName.toLowerCase()!=='button'){e.preventDefault();choose(el.dataset.borough)}})});
 if($('donutClear'))$('donutClear').addEventListener('click',()=>{state.borough='ALL';$('borough').value='ALL';renderAll({resetTimeline:true})});
}
function renderHeat(){
 const counts=Array.from({length:7},()=>Array.from({length:24},()=>[0,0,0]));
 for(const r of D.hour)if(activeYear(r[0])&&activeBoro(r[1]))sumArr(counts[Math.floor(r[2]/24)][r[2]%24],r.slice(3));
 const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const isCount=state.heat==='count';
 const val=v=>isCount?v[0]:(v[2]?100*v[1]/v[2]:null);
 const possible=counts.flat().map(val).filter(x=>x!==null&&Number.isFinite(x));
 const min=possible.length?Math.min(...possible):0;
 const max=possible.length?Math.max(...possible):0;
 const range=max-min;
 // Seven discrete, sequential density bands, each mapped to the selected metric.
 const colors=isCount?
  ['#EBF5FA','#D3E9F3','#B0D5E5','#83BDD5','#4F9FC0','#287EA7','#145B83']:
  ['#E7F7F2','#C7ECE1','#9CD8CA','#70C4B5','#43AB9D','#218D84','#116A68'];
 const rel=n=>n===null?0:range>0?Math.max(0,Math.min(1,(n-min)/range)):n>0?1:0;
 const band=n=>Math.min(6,Math.max(0,Math.floor(rel(n)*7-1e-9)));
 const shade=n=>colors[band(n)];
 // Bubble area remains proportional to the selected measure within this view.
 const size=n=>n===null||n<=0||max<=0?0:Math.max(4,Math.min(27,27*Math.sqrt(n/max)));
 const valueText=n=>isCount?fmt(Math.round(n)):n.toFixed(1)+'%';
 let cells='<span class="bubble-corner">DAY / HOUR</span>'+Array.from({length:24},(_,h)=>`<span class="bubble-hour">${String(h).padStart(2,'0')}</span>`).join('');
 for(let d=0;d<7;d++){
  cells+=`<span class="bubble-day">${days[d]}</span>`;
  for(let h=0;h<24;h++){
   const v=counts[d][h],n=val(v),diam=size(n),key=d+'-'+h,sel=state.heatSelected===key;
   const tip=`${days[d]} ${String(h).padStart(2,'0')}:00 — ${fmt(v[0])} crash reports; ${fmt(v[1])} injury-involved; ${fmt(v[2])} known injury status; ${pct(v[1],v[2])} injury-involved`;
   const bg=n===null?'#F4F7F8':isCount?'#F3F9FC':'#F0F9F6';
   cells+=`<button type="button" class="bubble-cell ${sel?'selected':''}" data-bubble="${key}" data-tip="${esc(tip.replace(' — ','\n').replace('; ','\n'))}" aria-label="${esc(tip)}" style="background:${bg}"><span class="bubble-mark" style="width:${diam}px;height:${diam}px;background:${shade(n)};${n===null||diam===0?'display:none;':''}"></span>${n===null?'<span class="bubble-na">–</span>':''}</button>`;
  }
 }
 $('heatPlot').innerHTML=cells;
 $('heatPlot').querySelectorAll('[data-bubble]').forEach(el=>el.addEventListener('click',()=>{state.heatSelected=el.dataset.bubble;renderHeat()}));
 const sizeItem=frac=>{const v=max*frac,d=Math.round(size(v));return `<span class="bubble-size-item"><span class="bubble-size-dot" style="width:${d}px;height:${d}px;background:${shade(v)}"></span>${valueText(v)}</span>`};
 const width=(100/7),bands=colors.map((c,i)=>`${c} ${(i*width).toFixed(3)}%,${c} ${((i+1)*width).toFixed(3)}%`).join(',');
 $('bubbleLegend').innerHTML=`<div class="bubble-size-guide"><span class="bubble-size-title">SIZE</span>${sizeItem(.2)}${sizeItem(.55)}${sizeItem(1)}</div><div class="bubble-gradient-section"><b>COLOR</b><span>Low · ${valueText(min)}</span><span class="bubble-gradient-bar" aria-label="Seven discrete color levels from ${valueText(min)} to ${valueText(max)}" style="background:linear-gradient(90deg,${bands})"></span><span>High · ${valueText(max)}</span></div><span class="bubble-legend-note">Larger + darker = ${isCount?'more crash reports':'higher injury-involved %'}</span>`;
}

function aggRows(kind,dims){const out=new Map();for(const row of D[kind]){if(!activeYear(row[0])||!activeBoro(row[1]))continue;const k=row.slice(2,dims).join('|');if(!out.has(k))out.set(k,zero(row.length-dims));sumArr(out.get(k),row.slice(dims));}return out}
function renderPairs(){
 const rows=aggRows('pairs',4);
 const major=['Car','SUV / Van','Taxi / Rideshare','Truck','Motorcycle / Moped','Bicycle','Bus'];
 const categories=[...major,'Other types',...(state.includeUnknownPair?['Unknown']:[])];
 const group=i=>{const name=V[i]||'Unknown';if(name==='Unknown')return 'Unknown';return major.includes(name)?name:'Other types'};
 const data=new Map(), allRecords=[...rows.entries()];
 let omittedUnknown=0;
 for(const [id,v] of allRecords){const [a,b]=id.split('|').map(Number),ga=group(a),gb=group(b);if(!state.includeUnknownPair&&(ga==='Unknown'||gb==='Unknown')){omittedUnknown+=v[0];continue}
  const x=categories.indexOf(ga),y=categories.indexOf(gb);if(x<0||y<0)continue;
  const key=Math.min(x,y)+'|'+Math.max(x,y);if(!data.has(key))data.set(key,[0,0,0]);sumArr(data.get(key),v);
 }
 const values=[...data.values()].map(v=>state.pair==='count'?v[0]:(v[2]>=100?100*v[1]/v[2]:null)).filter(v=>v!==null);
 const maximum=Math.max(1,...values),totalMatrix=[...data.values()].reduce((sum,v)=>sum+v[0],0);
 const short=['Car','SUV/Van','Taxi','Truck','Motorcycle','Bicycle','Bus','Other',...(state.includeUnknownPair?['Unknown']:[])];
 const colCount=categories.length;
 $('pairBars').style.setProperty('--pair-cols',colCount);
 let html='<span class="pair-topcorner">VEHICLE × VEHICLE</span>'+short.map((n,i)=>`<span class="pair-col-label" title="${esc(categories[i])}">${esc(n)}</span>`).join('');
 const blend=(a,b,t)=>a.map((c,i)=>Math.round(c+(b[i]-c)*t));
 for(let y=0;y<colCount;y++){
  html+=`<span class="pair-row-label" title="${esc(categories[y])}">${esc(short[y])}</span>`;
  for(let x=0;x<colCount;x++){
   if(x<y){html+='<span class="pair-empty" aria-hidden="true"></span>';continue}
   const key=y+'|'+x,v=data.get(key)||[0,0,0];
   const n=state.pair==='count'?v[0]:(v[2]>=100?100*v[1]/v[2]:null);
   const t=n===null?null:Math.sqrt(Math.max(0,n)/maximum);
   const rgb=t===null?[235,239,242]:blend([233,242,247],state.pair==='count'?[36,84,114]:[216,164,97],Math.pow(t,.85));
   const color=`rgb(${rgb.join(',')})`,high=t!==null&&t>.63,selected=state.pairSelected===key;
   const tooltip=`${categories[y]} + ${categories[x]}: ${fmt(v[0])} crash reports · ${pct(v[1],v[2])} injury-involved (${fmt(v[2])} with known status)`;
   const countLabel=state.pair==='count'?(v[0]?(v[0]>=10000?Math.round(v[0]/1000)+'k':v[0]>=1000?(v[0]/1000).toFixed(1)+'k':String(v[0])):'–'):(n===null?'N/A':n.toFixed(0)+'%');
   html+=`<button type="button" data-pairid="${key}" class="pair-heat-cell ${selected?'chosen':''} ${high?'light-text':''} ${n===null?'unavailable':''}" style="background:${color}" data-tip="${esc(tooltip.replace(': ','\n').replace(' · ','\n'))}" aria-label="${esc(tooltip)}"><span>${countLabel}</span></button>`;
  }
 }
 $('pairBars').innerHTML=html;
 $('pairBars').querySelectorAll('[data-pairid]').forEach(el=>el.addEventListener('click',()=>{state.pairSelected=el.dataset.pairid;renderPairs()}));
 if(!state.pairSelected||!data.has(state.pairSelected))state.pairSelected=[...data.entries()].sort((a,b)=>b[1][0]-a[1][0])[0]?.[0]||null;
 // Color legend; percentage mode has a sample-size threshold to prevent unstable comparisons.
 $('pairLegend').innerHTML=`<span>${state.pair==='count'?'FEWER REPORTS':'LOWER INJURY RATE'}</span><span class="pair-gradient-ramp" style="background:linear-gradient(to right,${state.pair==='count'?'#e9f2f7,#8ebbd0,#28698C':'#f6eee2,#e5c395,#d8a461'})"></span><span>${state.pair==='count'?'MORE REPORTS':'HIGHER INJURY RATE'}</span>`;
 const q=aggregate('quality',9,2),tot=sumSelected()[0];
 $('pairCoverage').textContent=`The matrix shows each unordered combination once (upper triangle). Seven named types + “Other types” (Emergency, Commercial / Other, Other). ${fmt(q[0])} known-type pairs (${pct(q[0],tot)} of crash reports); ${fmt(q[1])} reports contain an unknown/unclassified type. ${state.includeUnknownPair?'Unknown pairs included.':`Unknown pairs hidden (${fmt(omittedUnknown)} reports).`} Injury-% cells require 100 reports with known injury status. Pairing does not assign fault.`;
}
function renderFactors(){
 const rows=aggRows('factors',3),q=aggregate('quality',9,2);
 let entries=[...rows.entries()].map(([id,v])=>({id,name:F[+id],v})).filter(r=>r.v[0]>0);
 if(state.factor==='pct')entries=entries.filter(r=>r.v[2]>=100);
 const val=r=>state.factor==='count'?r.v[0]:(r.v[2]?100*r.v[1]/r.v[2]:null);
 entries.sort((a,b)=>(val(b)??-1)-(val(a)??-1)||b.v[0]-a.v[0]);entries=entries.slice(0,state.factorLimit);
 const max=Math.max(1,...entries.map(r=>val(r)||0),state.factor==='pct'?100:1);
 if(!entries.some(r=>r.id===state.factorSelected))state.factorSelected=entries[0]?.id||null;
 $('factorRows').innerHTML=entries.map((r,i)=>{
  const tip=`${r.name}\n${fmt(r.v[0])} crash reports · ${pct(r.v[0],sumSelected()[0])} of selected reports\n${fmt(r.v[1])} injury-involved · ${pct(r.v[1],r.v[2])} of ${fmt(r.v[2])} known-status reports`;
  return `<button type="button" data-factor-id="${esc(r.id)}" data-tip="${esc(tip)}" class="factor-row factor-button ${state.factorSelected===r.id?'selected':''}" aria-label="${esc(tip)}"><div class="factor-line"><span class="factor-name">${i+1}. ${esc(r.name)}</span><strong class="factor-value">${state.factor==='count'?fmt(r.v[0]):r.v[2]?(100*r.v[1]/r.v[2]).toFixed(1)+'%':'N/A'}</strong></div><div class="factor-track"><div class="factor-fill" style="background:${state.factor==='pct'?'#E5AF62':'#418FB6'};width:${Math.min(100,100*(val(r)||0)/max)}%"></div></div></button>`;
 }).join('')||'<div class="emptybox">No known factor data in this selection.</div>';
 $('factorRows').querySelectorAll('[data-factor-id]').forEach(el=>el.addEventListener('click',()=>{
  state.factorSelected=el.dataset.factorId;
  $('factorRows').querySelectorAll('[data-factor-id]').forEach(b=>b.classList.toggle('selected',b.dataset.factorId===state.factorSelected));
 }));
 const total=sumSelected()[0];
 $('factorMissing').innerHTML=`<div class="missing-summary-main"><span class="missing-icon">?</span><div class="missing-summary-copy"><strong>Both factors Unspecified</strong><small>Excluded from ranked factors · kept visible</small></div></div><div class="missing-summary-stat"><strong>${fmt(q[2])}</strong><small>${pct(q[2],total)} of selected crash reports · ${pct(q[7],q[8])} injury-involved</small></div>`;
 $('factorMissing').setAttribute('tabindex','0');
 $('factorMissing').setAttribute('data-tip',`Both factors Unspecified\n${fmt(q[2])} reports · ${pct(q[2],total)} of selected crash reports\n${pct(q[7],q[8])} injury-involved among ${fmt(q[8])} known-status reports`);
}
// Map data are preaggregated to integer geographic bins by year, month, borough.
const mapsByMonth=new Map(),mapsByYear=new Map();
for(const r of D.map){const [yi,mi,bi,x,y,n,inj,fatal]=r;let k=`${yi}|${mi}|${bi}`;if(!mapsByMonth.has(k))mapsByMonth.set(k,[]);mapsByMonth.get(k).push([x,y,n,inj||0,fatal||0]);let ky=`${yi}|${bi}`;if(!mapsByYear.has(ky))mapsByYear.set(ky,new Map());const a=mapsByYear.get(ky),xy=x*100+y;{const prev=a.get(xy)||[0,0,0];a.set(xy,[prev[0]+n,prev[1]+(inj||0),prev[2]+(fatal||0)])}}
let mapHoverPoints=[];
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];let mapFrames=[],mapMax=1,mapTimer=null,mapProjection=null;
let mapManuallyPaused=false,mapResumeOnVisible=false;
function getFrames(){if(state.start===state.end)return MONTHS.map((s,i)=>({yi:state.start-2013,mi:i,label:s+' '+state.start,mode:'Monthly'}));return Y.filter(y=>y>=state.start&&y<=state.end).map(y=>({yi:y-2013,mi:null,label:String(y),mode:'Yearly'}))}
function getMapBin(frame){
 const agg=new Map(),metricIdx={all:0,injury:1,fatal:2}[state.mapMetric];
 for(let b=0;b<6;b++)if(activeBoro(b)){
  if(frame.mi===null){for(const [key,values] of mapsByYear.get(frame.yi+'|'+b)||[])agg.set(key,(agg.get(key)||0)+values[metricIdx]);}
  else{for(const [x,y,n,inj,fatal] of mapsByMonth.get(frame.yi+'|'+frame.mi+'|'+b)||[]){const key=x*100+y;agg.set(key,(agg.get(key)||0)+[n,inj,fatal][metricIdx]);}}
 }
 return agg;
}
function resetMap(){
 const resume=state.playing && !document.hidden;
 stopMap();mapFrames=getFrames();state.mapIndex=0;mapMax=1;
 for(const frame of mapFrames){const bins=getMapBin(frame);for(const value of bins.values())if(value>mapMax)mapMax=value;}
 $('mapSlider').max=String(Math.max(0,mapFrames.length-1));$('mapSlider').value='0';
 $('mapYearLabel').textContent=state.start===state.end?'Monthly frames':'Annual frames';
 $('mapSubtitle').textContent=state.start===state.end?`Explore geocoded collisions month by month in ${state.start}.`:`Explore how geocoded collision concentrations change from ${state.start} to ${state.end}.`;
 renderMap();
 if(resume)startMapPlayback();
}
function mapProject(lon,lat,w,h){const z=10,world=256*Math.pow(2,z),x=(lon+180)/360*world,r=lat*Math.PI/180,y=(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*world;const cx=(-73.971+180)/360*world,cr=40.712*Math.PI/180,cy=(1-Math.log(Math.tan(cr)+1/Math.cos(cr))/Math.PI)/2*world;
 const factor=Math.min(w/560,h/430)*1.05;return [(x-cx)*factor+w/2,(y-cy)*factor+h/2]}
const GEO_APPROX=[{"name":"BRONX","points":[[-73.9178,40.90351],[-73.91673,40.91258],[-73.91055,40.91716],[-73.89426,40.91698],[-73.88166,40.90807],[-73.86371,40.90807],[-73.85256,40.91642],[-73.84466,40.91642],[-73.81716,40.89497],[-73.81554,40.87573],[-73.7964,40.87007],[-73.78105,40.85793],[-73.78046,40.83007],[-73.78824,40.82526],[-73.8035,40.83041],[-73.79168,40.8177],[-73.79868,40.80692],[-73.83351,40.80674],[-73.84777,40.79752],[-73.8937,40.79748],[-73.90834,40.78823],[-73.92389,40.79748],[-73.93711,40.79854],[-73.94183,40.8056],[-73.94168,40.84534],[-73.9178,40.86647],[-73.92983,40.88056],[-73.9287,40.8942],[-73.9178,40.90351]],"at":[-73.868,40.861]},{"name":"BROOKLYN","points":[[-74.01409,40.69804],[-74.01089,40.72078],[-74.00271,40.72257],[-73.9859,40.71363],[-73.96398,40.74728],[-73.95629,40.75064],[-73.94185,40.74141],[-73.9271,40.73931],[-73.89188,40.69511],[-73.87223,40.70436],[-73.85447,40.69265],[-73.85206,40.64637],[-73.87801,40.62436],[-73.88776,40.60937],[-73.89033,40.57797],[-73.89915,40.57558],[-73.9088,40.58216],[-73.93203,40.56604],[-74.01146,40.56864],[-74.02384,40.59658],[-74.03223,40.60304],[-74.04545,40.6041],[-74.0502,40.61204],[-74.04947,40.64338],[-74.02613,40.66276],[-74.02576,40.67941],[-74.01409,40.69804]],"at":[-73.958,40.651]},{"name":"MANHATTAN","points":[[-73.96365,40.8312],[-73.93636,40.87959],[-73.90792,40.88025],[-73.90134,40.87634],[-73.90081,40.86715],[-73.92387,40.83159],[-73.92387,40.81841],[-73.91247,40.80054],[-73.91261,40.79357],[-73.92616,40.78177],[-73.95998,40.72974],[-73.9628,40.71661],[-73.98976,40.69625],[-74.02057,40.69631],[-74.02596,40.70287],[-74.02609,40.72401],[-74.01409,40.74433],[-74.01344,40.76356],[-73.97593,40.82146],[-73.96365,40.8312]],"at":[-73.972,40.785]},{"name":"QUEENS","points":[[-73.95747,40.72256],[-74.00444,40.70491],[-74.01407,40.71327],[-74.01125,40.72045],[-73.96365,40.75712],[-73.95116,40.77591],[-73.92168,40.79692],[-73.9063,40.79661],[-73.89475,40.78851],[-73.86467,40.79622],[-73.85029,40.80606],[-73.79882,40.80607],[-73.73634,40.78679],[-73.69521,40.75184],[-73.69591,40.71958],[-73.71924,40.69201],[-73.71929,40.64813],[-73.73391,40.58715],[-73.76322,40.58452],[-73.83508,40.56613],[-73.85898,40.566],[-73.90797,40.54752],[-73.92516,40.54859],[-73.92934,40.55943],[-73.87073,40.65896],[-73.87944,40.67907],[-73.91359,40.68775],[-73.92765,40.69875],[-73.92983,40.70839],[-73.95747,40.72256]],"at":[-73.808,40.737]},{"name":"STATEN ISLAND","points":[[-74.17057,40.63981],[-74.16419,40.64843],[-74.13917,40.64881],[-74.11507,40.65792],[-74.07392,40.65741],[-74.05647,40.62312],[-74.05693,40.59014],[-74.07037,40.56928],[-74.08457,40.55811],[-74.13305,40.53929],[-74.15755,40.52065],[-74.23135,40.49227],[-74.2499,40.4929],[-74.26516,40.50491],[-74.26564,40.51473],[-74.25317,40.52516],[-74.23928,40.55436],[-74.22578,40.56453],[-74.18037,40.58204],[-74.17057,40.60464],[-74.17057,40.63981]],"at":[-74.176,40.585]}];
function drawMapBase(w,h){
 const geo=$('mapShapes');geo.setAttribute('viewBox',`0 0 ${w} ${h}`);
 const root=$('mapTiles');root.innerHTML=''; // No remote tiles, so no API-key watermark or failed-provider imagery.
 let content='';
 for(const o of GEO_APPROX){
  const xy=o.points.map(p=>mapProject(p[0],p[1],w,h));
  const coords=xy.map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  content+=`<polygon points="${coords}"/>`;
 }
 for(const o of GEO_APPROX){
  const [x,y]=mapProject(o.at[0],o.at[1],w,h),width=o.name.length*6.1+17;
  content+=`<rect class="borough-label-bg" x="${(x-width/2).toFixed(1)}" y="${(y-12).toFixed(1)}" width="${width}" height="21" rx="3"/><text class="borough-label" x="${x.toFixed(1)}" y="${(y+2).toFixed(1)}" text-anchor="middle">${o.name}</text>`;
 }
 geo.innerHTML=content;
}
const COLOR_STOPS={
 all:['#EFF7FB','#D6EBF4','#B9DCEA','#8BC2D9','#5DA4C2','#347EAA','#1E567E'],
 injury:['#FFF9EF','#F7E7C9','#F0D39F','#E5AF62','#CB934B','#A36F36','#7C5224'],
 fatal:['#FEF4F4','#F3D9DA','#E9B8BD','#D98D96','#C26676','#A14B5F','#7A3749']
};
function densityBand(metric,t){const scale=COLOR_STOPS[metric]||COLOR_STOPS.all;const clamped=Math.max(0,Math.min(.999999,t));return Math.max(0,Math.min(scale.length-1,Math.floor(clamped*scale.length)))}
function rampColor(metric,t){const scale=COLOR_STOPS[metric]||COLOR_STOPS.all;return scale[densityBand(metric,t)]}
function renderMap(){
 const frame=mapFrames[state.mapIndex];if(!frame)return;
 const c=$('mapCanvas'),box=$('mapVisual'),rect=box.getBoundingClientRect();
 const w=Math.max(300,Math.round(rect.width)),h=Math.max(270,Math.round(rect.height)),dpr=Math.min(window.devicePixelRatio||1,2);
 if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);drawMapBase(w,h)}
 const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const data=getMapBin(frame),[lonMin,lonMax,latMin,latMax]=D.meta.bounds,[gw,gh]=D.meta.grid;
 let total=0;mapHoverPoints=[];const points=[...data.entries()].filter(a=>a[1]>0).sort((a,b)=>a[1]-b[1]);
 for(const [key,n] of points){
  total+=n;const xi=Math.floor(key/100),yi=key%100;
  const lon=lonMin+(xi+.5)*(lonMax-lonMin)/gw,lat=latMax-(yi+.5)*(latMax-latMin)/gh;
  const [x,y]=mapProject(lon,lat,w,h);if(x<-15||x>w+15||y<-15||y>h+15)continue;
  const t=Math.log1p(n)/Math.log1p(mapMax);
  const band=densityBand(state.mapMetric,t);
  const radius=2.5+3.4*Math.sqrt(t);
  mapHoverPoints.push({x,y,n,lon,lat,radius});
  ctx.globalAlpha=.18+.11*band;ctx.beginPath();ctx.arc(x,y,radius,0,2*Math.PI);ctx.fillStyle=rampColor(state.mapMetric,t);ctx.fill();ctx.lineWidth=.75;ctx.strokeStyle='rgba(255,255,255,.88)';ctx.stroke();
 }
 ctx.globalAlpha=1;
 const shades=COLOR_STOPS[state.mapMetric];const step=100/shades.length;$('densityRamp').style.background=`linear-gradient(to bottom,${shades.slice().reverse().map((c,i)=>`${c} ${Math.max(0,i*step).toFixed(2)}%, ${c} ${Math.min(100,(i+1)*step).toFixed(2)}%`).join(',')})`;$('densityMax').textContent='Higher';
 const v=sumSelected(),label={all:'Mapped crashes / frame',injury:'Mapped injury crashes / frame',fatal:'Mapped fatal crashes / frame'}[state.mapMetric];
 const numerator={all:v[11],injury:v[14],fatal:v[16]}[state.mapMetric]||0;
 const denominator={all:v[0],injury:v[3],fatal:v[15]}[state.mapMetric]||0;
 $('mapCountLabel').textContent=label;$('mapCount').textContent=fmt(total);
 $('mapCoverage').textContent=denominator?pct(numerator,denominator):'N/A';
 $('mapFrame').textContent=frame.label;$('mapFrameType').textContent=`${frame.mode} · ${state.mapIndex+1} of ${mapFrames.length}`;
 $('mapSlider').value=String(state.mapIndex);$('mapPlay').textContent=state.playing?'❚❚':'▶';$('mapPlay').setAttribute('aria-label',state.playing?'Pause animation':'Play animation');
}
// Hover the plotted geographic bins to see exact aggregated values; never individual incidents.
function showMapBinTip(e){
 if(!mapHoverPoints.length){hideChartTip();return;}
 const canvas=$('mapCanvas'),rect=canvas.getBoundingClientRect();
 const x=e.clientX-rect.left,y=e.clientY-rect.top;
 let nearest=null,dist=Infinity;
 for(const pt of mapHoverPoints){const dx=x-pt.x,dy=y-pt.y,d2=dx*dx+dy*dy;
  if(d2<dist){dist=d2;nearest=pt}}
 if(!nearest||dist>Math.pow(Math.max(12,nearest.radius+7),2)){hideChartTip();return;}
 const frame=mapFrames[state.mapIndex],metric={all:'crash reports',injury:'injury-involved crash reports',fatal:'fatal crash reports'}[state.mapMetric];
 canvas.dataset.tip=`Approximate geographic cell · ${frame?.label||''}\n${fmt(nearest.n)} mapped ${metric}\nCenter: ${nearest.lat.toFixed(3)}° N, ${Math.abs(nearest.lon).toFixed(3)}° W\nAggregated counts, not individual crashes`;
 showChartTip(canvas,e);
}
$('mapCanvas').addEventListener('pointermove',showMapBinTip);
$('mapCanvas').addEventListener('pointerleave',hideChartTip);
$('mapCanvas').addEventListener('click',showMapBinTip);
function updateMapPlayButton(){
 const playing=state.playing;
 $('mapPlay').textContent=playing?'❚❚':'▶';
 $('mapPlay').setAttribute('aria-label',playing?'Pause map animation':'Play map animation');
 $('mapPlay').setAttribute('aria-pressed',String(playing));
 $('mapPlay').title=playing?'Pause animation':'Play animation';
}
function stopMap(){
 if(mapTimer!==null){clearInterval(mapTimer);mapTimer=null}
 state.playing=false;updateMapPlayButton();
}
function stepMap(n){
 if(!mapFrames.length)return;
 state.mapIndex=Math.max(0,Math.min(mapFrames.length-1,state.mapIndex+n));renderMap();
}
function startMapPlayback(){
 if(state.playing||document.hidden||mapFrames.length<2)return;
 state.playing=true;updateMapPlayButton();renderMap();
 mapTimer=setInterval(()=>{
  if(!mapFrames.length){stopMap();return;}
  state.mapIndex=(state.mapIndex+1)%mapFrames.length;
  renderMap();
 },1050);
}
function playMap(){
 if(state.playing){mapManuallyPaused=true;stopMap();}
 else{mapManuallyPaused=false;startMapPlayback();}
}
function renderInsights(){
 const rows=annual(),tot=sumSelected(),first=rows[0]?.v||zero(17),last=rows.at(-1)?.v||zero(17);
 const card=(i,title,detail)=>`<article class="insight"><div class="insight-number">INSIGHT / 0${i}</div><div class="insight-title">${title}</div><p class="insight-desc">${detail}</p></article>`;
 const period=`${state.start}–${state.end}`;
 if(!tot[0]){$('insights').innerHTML=card(1,'No matching crash reports','Choose another year range or borough to explore available records.')+card(2,'No timing pattern available','There are no reports in the current selection.')+card(3,'No geographic coordinates to map','No report locations are available for these filters.');return;}
 const diff=(start,end)=>start?((end-start)/start*100):null;
 const change=(a,b)=>{const d=diff(a,b);return d===null?'not available (zero baseline)':`${Math.abs(d).toFixed(1)}% ${d<0?'decrease':d>0?'increase':'change'}`};
 const firstYear=rows[0]?.year||state.start,lastYear=rows.at(-1)?.year||state.end;
 const firstCard=state.start===state.end?
  card(1,`${fmt(tot[0])} crashes reported in ${state.start}`,`${fmt(tot[1])} people injured and ${fmt(tot[2])} people killed were reported in this year.`):
  card(1,`Reported crash change: ${change(first[0],last[0])}`,`Annual crashes: ${fmt(first[0])} in ${firstYear} and ${fmt(last[0])} in ${lastYear}. Change in recorded fatalities: ${change(first[2],last[2])}. Reporting changes and travel disruptions affect comparisons.`);
 const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const hours=Array.from({length:168},()=>[0,0,0]);
 for(const r of D.hour)if(activeYear(r[0])&&activeBoro(r[1]))sumArr(hours[r[2]],r.slice(3));
 let best=-1,bestN=0;for(let i=0;i<hours.length;i++)if(hours[i][0]>bestN){best=i;bestN=hours[i][0]}
 const slot=best<0?'Unavailable':`${days[Math.floor(best/24)]}, ${String(best%24).padStart(2,'0')}:00`;
 const secondCard=card(2,`Most reported crashes: ${slot}`,`${fmt(bestN)} crash reports in this weekday–hour slot across ${period}. This is not an exposure-adjusted crash-risk ranking.`);
 const covered=tot[11]||0,unmapped=Math.max(0,tot[0]-covered);
 const thirdCard=card(3,`${pct(covered,tot[0])} of reports have usable coordinates`,`${fmt(covered)} reports appear in the map analysis; ${fmt(unmapped)} cannot be mapped and remain in the non-geographic totals.`);
 $('insights').innerHTML=firstCard+secondCard+thirdCard;
}
function renderAll({resetTimeline=false}={}){renderKPI();renderTrend();renderHuman();renderBorough();renderHeat();renderPairs();renderFactors();renderInsights();if(resetTimeline)resetMap();else renderMap()}
function updateRange(){}
function setFilter(changed){
 hideChartTip();closeRoadTrend();
 let s=+$('yearFrom').value,e=+$('yearTo').value;
 if(s>e){if(changed==='start')e=s;else s=e;$('yearFrom').value=s;$('yearTo').value=e;}
 state.start=s;state.end=e;state.borough=$('borough').value;state.selectedYear=null;state.pairSelected=null;state.factorSelected=null;state.heatSelected=null;
 updateRange();renderAll({resetTimeline:true});
}
function resetAll(){
 hideChartTip();closeRoadTrend();
 Object.assign(state,{start:2013,end:2025,borough:'ALL',trend:'indexed',actual:0,heat:'count',pair:'count',factor:'count',boroughMode:'count',mapMetric:'all',selectedYear:null,pairSelected:null,factorSelected:null,heatSelected:null,roadSelected:null,factorLimit:6,tour:-1,includeUnknownPair:false});
 $('yearFrom').value=2013;$('yearTo').value=2025;$('borough').value='ALL';$('actualMetric').value='0';
 $('pairIncludeUnknown').checked=false;$('factorLimit').value='6';mapManuallyPaused=false;
 for(const [type,value] of Object.entries({trend:'indexed',heat:'count',pair:'count',factor:'count',boroughMode:'count'}))setTabs(type,value);
 document.querySelectorAll('#mapSeg button').forEach(b=>b.classList.toggle('active',b.dataset.mapmetric==='all'));
 updateRange();renderAll({resetTimeline:true});storyDisplay();startMapPlayback();
}
function setTabs(type,value){
 const names={trend:'trendSeg',heat:'heatSeg',pair:'pairSeg',factor:'factorSeg',boroughMode:'boroughSeg'},attrs={trend:'trend',heat:'heat',pair:'pair',factor:'factor',boroughMode:'boroughMode'};
 document.querySelectorAll('#'+names[type]+' button').forEach(b=>b.classList.toggle('active',b.dataset[attrs[type]]===value));
 state[type]=value;if(type==='trend')$('actualMetric').hidden=value!=='actual';
}
const $$=selector=>document.querySelectorAll(selector);
const STORIES=[
 {title:'Do crashes and human outcomes follow the same trend?',desc:'Compare reported crashes, injuries and fatalities over time. Use the 2019 baseline to see whether they changed at similar rates.',panel:'panelTrend',run:()=>{setTabs('trend','indexed');renderTrend()}},
 {title:'Who is most affected?',desc:'Compare injury and fatality shares for motorists, pedestrians and cyclists. Select a road-user group for annual trends.',panel:'panelHuman',run:()=>renderHuman()},
 {title:'Where are collisions concentrated?',desc:'Follow the looping geographic density map. Pause any year—or select a single year for month-by-month playback.',panel:'panelMap',run:()=>{state.mapIndex=0;renderMap();if(!state.playing&&!mapManuallyPaused)startMapPlayback()}},
 {title:'How do boroughs compare?',desc:'Compare each borough’s share of crash reports. Select a slice to explore other views; unknown borough remains separate.',panel:'panelBorough',run:()=>renderBorough()},
 {title:'When are crashes most common?',desc:'Explore 168 day–hour combinations. Switch between crash counts and injury-involved percentages to compare patterns.',panel:'panelHeat',run:()=>{setTabs('heat','pct');renderHeat()}},
 {title:'Which vehicle types appear together?',desc:'Explore the first two recorded vehicle types in each crash and compare counts with injury involvement.',panel:'panelPairs',run:()=>renderPairs()},
 {title:'What contributing factors are recorded?',desc:'Review the most frequently recorded factors and the limitations of unspecified or missing classifications.',panel:'panelFactors',run:()=>renderFactors()}
];
function storyDisplay(){const active=state.tour>=0;$('storyBack').hidden=!active;$('storyExit').hidden=!active;$('storyProgress').textContent=active?`${state.tour+1} / 7`:'';$('storyNext').textContent=active?(state.tour===6?'Finish story ✓':'Next insight →'):'Start exploring →';$('storyIndex').textContent=String(active?state.tour+1:1).padStart(2,'0');$('storyTitle').textContent=active?STORIES[state.tour].title:'Explore the Story Behind NYC’s Crash Reports';$('storyText').textContent=active?STORIES[state.tour].desc:'Follow seven linked views to discover how collisions vary across time, road users, places and recorded circumstances.';$$('.panel').forEach(p=>p.classList.toggle('focus',active&&p.id===STORIES[state.tour].panel));$('storyBack').disabled=state.tour===0}
function setStory(n){if(n>=STORIES.length){state.tour=-1;storyDisplay();return}state.tour=n;STORIES[n].run();storyDisplay();$(STORIES[n].panel).scrollIntoView({behavior:'smooth',block:'center'})}
function init(){
 for(const id of ['yearFrom','yearTo']){const el=$(id);for(let y=2013;y<=2025;y++){const o=document.createElement('option');o.value=y;o.textContent=y;el.appendChild(o)}}$('yearFrom').value=2013;$('yearTo').value=2025;
 for(const [id,change] of [['yearFrom','start'],['yearTo','end']]){
   $(id).addEventListener('change',()=>setFilter(change));
 }
 updateRange();
 $('borough').addEventListener('change',()=>setFilter());$('reset').addEventListener('click',resetAll);
 $('actualMetric').addEventListener('change',()=>{state.actual=+$('actualMetric').value;renderTrend()});
 for(const type of ['trend','heat','pair','factor','boroughMode']){
 const attr={trend:'trend',heat:'heat',pair:'pair',factor:'factor',boroughMode:'boroughMode'}[type];
 document.querySelectorAll(`[data-${attr.replace('Mode','-mode')}]`).forEach(btn=>btn.addEventListener('click',()=>{
   setTabs(type,btn.dataset[attr]);({trend:renderTrend,heat:renderHeat,pair:renderPairs,factor:renderFactors,boroughMode:renderBorough})[type]();
 }));
 }
 
 
 $('factorLimit').addEventListener('change',e=>{state.factorLimit=+e.target.value;state.factorSelected=null;renderFactors()});
 $('pairIncludeUnknown').addEventListener('change',e=>{state.includeUnknownPair=e.target.checked;state.pairSelected=null;renderPairs()});
 
 document.querySelectorAll('#mapSeg button').forEach(btn=>btn.addEventListener('click',()=>{state.mapMetric=btn.dataset.mapmetric;document.querySelectorAll('#mapSeg button').forEach(b=>b.classList.toggle('active',b===btn));resetMap()}));
 $('mapPlay').addEventListener('click',playMap);
 $('mapPrev').addEventListener('click',()=>{mapManuallyPaused=true;stopMap();stepMap(-1)});
 $('mapNext').addEventListener('click',()=>{mapManuallyPaused=true;stopMap();stepMap(1)});
 $('mapSlider').addEventListener('input',e=>{mapManuallyPaused=true;stopMap();state.mapIndex=+e.target.value;renderMap()});
 $('storyNext').addEventListener('click',()=>setStory(state.tour+1));$('storyBack').addEventListener('click',()=>setStory(Math.max(0,state.tour-1)));$('storyExit').addEventListener('click',()=>{state.tour=-1;storyDisplay()});
 $('jumpGuide').addEventListener('click',()=>setStory(0));$('aboutTop').addEventListener('click',()=>{$('methodology').open=true;$('methodology').scrollIntoView({behavior:'smooth',block:'start'})});
 let resizeDelay;window.addEventListener('resize',()=>{clearTimeout(resizeDelay);resizeDelay=setTimeout(()=>{drawMapBase($('mapVisual').clientWidth,$('mapVisual').clientHeight);renderMap();if(window.Plotly){Plotly.Plots.resize($('trendPlot'))}},130)});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){mapResumeOnVisible=state.playing;stopMap();}
  else if(mapResumeOnVisible&&!mapManuallyPaused){mapResumeOnVisible=false;startMapPlayback();}
 });
 renderAll({resetTimeline:true});storyDisplay();
 updateMapPlayButton();
 setTimeout(()=>{if(!document.hidden&&!state.playing&&!mapManuallyPaused)startMapPlayback();},650);
}
init();
})();
