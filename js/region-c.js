// region-c.js - 服务洞察仪表板（修复版）

let aggregatedData = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, waiting for data...');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (globalAggregated) {
        aggregatedData = globalAggregated;
    } else {
        aggregatedData = await loadPharmacyData();
    }
    
    console.log('Rendering with data:', aggregatedData);
    
    // 渲染所有图表
    renderOctopusChart();
    renderCardChart();
    renderCashChart();
    renderNFCProgress();
    renderHoursChart();
    renderMerchantTypeBars();
    renderDistrictChart();
    renderChainChart();
    renderSpecialRemarksTable();
    
    // 更新摘要和洞察
    updateSummaryAndInsights(aggregatedData);
});

function renderOctopusChart() {
    const chart = echarts.init(document.getElementById('octopusChart'));
    const supported = aggregatedData.octopusSupported;
    const notSupported = aggregatedData.total - aggregatedData.octopusSupported;
    
    chart.setOption({
        title: { 
            text: `八達通接受率: ${aggregatedData.octopusPercentage}%`, 
            left: 'center', 
            top: 0, 
            textStyle: { fontSize: 12, fontWeight: 'normal' } 
        },
        tooltip: { 
            trigger: 'item', 
            formatter: '{b}: {d}% ({c}間)' 
        },
        color: ['#27ae60', '#95a5a6'],
        series: [{
            type: 'pie',
            radius: '55%',
            center: ['50%', '55%'],
            data: [
                { name: '支持八達通', value: supported },
                { name: '不支持', value: notSupported }
            ],
            label: { 
                show: true, 
                formatter: '{b}\n{d}%',
                fontSize: 11
            },
            emphasis: { scale: true }
        }]
    });
}

function renderCardChart() {
    const chart = echarts.init(document.getElementById('cardChart'));
    
    chart.setOption({
        tooltip: { 
            trigger: 'axis', 
            axisPointer: { type: 'shadow' },
            formatter: '{b}: {c} 間商戶'
        },
        color: ['#9b59b6', '#8e44ad'],
        title: { 
            text: '信用卡/扣帳卡接受情況', 
            left: 'center', 
            top: 0, 
            textStyle: { fontSize: 12 } 
        },
        grid: { top: 40, bottom: 20, left: 60, right: 30 },
        xAxis: { 
            type: 'category', 
            data: ['信用卡', '扣帳卡'],
            axisLabel: { fontSize: 12 }
        },
        yAxis: { 
            type: 'value', 
            name: '商戶數量',
            nameLocation: 'middle',
            nameGap: 45,
            min: 0
        },
        series: [{
            type: 'bar',
            data: [aggregatedData.creditCards, aggregatedData.debitCards],
            itemStyle: { 
                borderRadius: [8, 8, 0, 0],
                color: '#9b59b6'
            },
            label: { 
                show: true, 
                position: 'top',
                formatter: '{c}',
                fontSize: 12
            }
        }]
    });
}

function renderCashChart() {
    const chart = echarts.init(document.getElementById('cashChart'));
    const cashOnly = aggregatedData.cashOnly;
    const others = aggregatedData.total - aggregatedData.cashOnly;
    
    chart.setOption({
        tooltip: { 
            trigger: 'item', 
            formatter: '{b}: {d}% ({c}間)' 
        },
        color: ['#f1c40f', '#e67e22'],
        title: { 
            text: `僅收現金比例: ${aggregatedData.cashOnlyPercentage}%`, 
            left: 'center', 
            top: 0, 
            textStyle: { fontSize: 12 } 
        },
        series: [{
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['50%', '55%'],
            data: [
                { name: '僅收現金', value: cashOnly },
                { name: '接受其他支付', value: others }
            ],
            label: { 
                show: true, 
                formatter: '{b}\n{d}%',
                fontSize: 11
            }
        }]
    });
}

function renderNFCProgress() {
    const percentage = aggregatedData.nfcPercentage;
    document.getElementById('nfcPercentage').innerText = percentage + '%';
    const progressBar = document.getElementById('nfcProgressBar');
    progressBar.style.width = percentage + '%';
    progressBar.innerText = percentage > 15 ? percentage + '%' : '';
}

function renderHoursChart() {
    const chart = echarts.init(document.getElementById('hoursChart'));
    const { weekdayOnly, weekFull, limited, total } = aggregatedData.hoursData;
    
    console.log('Rendering hours chart:', { weekdayOnly, weekFull, limited, total });
    
    chart.setOption({
        tooltip: { 
            trigger: 'axis', 
            axisPointer: { type: 'shadow' },
            formatter: function(params) {
                let result = '營業時間分佈<br/>';
                params.forEach(p => {
                    const percent = ((p.value / total) * 100).toFixed(1);
                    result += `${p.marker} ${p.seriesName}: ${p.value} 間 (${percent}%)<br/>`;
                });
                return result;
            }
        },
        color: ['#27ae60', '#3498db', '#95a5a6'],
        title: { 
            text: `營業時間分佈 (總商戶: ${total})`, 
            left: 'center', 
            top: 0, 
            textStyle: { fontSize: 12 } 
        },
        grid: { top: 50, bottom: 20, left: 60, right: 30 },
        xAxis: { 
            type: 'category', 
            data: ['營業時間'],
            axisLabel: { fontSize: 12 }
        },
        yAxis: { 
            type: 'value', 
            name: '商戶數量',
            nameLocation: 'middle',
            nameGap: 45,
            min: 0,
            max: total
        },
        series: [
            { 
                name: '全週營業', 
                type: 'bar', 
                data: [weekFull], 
                itemStyle: { borderRadius: [8, 0, 0, 8], color: '#27ae60' },
                label: { show: true, position: 'inside', formatter: '{c} 間' } 
            },
            { 
                name: '僅工作日', 
                type: 'bar', 
                data: [weekdayOnly], 
                itemStyle: { borderRadius: [0, 0, 0, 0], color: '#3498db' },
                label: { show: true, position: 'inside', formatter: '{c} 間' } 
            },
            { 
                name: '時段有限/未知', 
                type: 'bar', 
                data: [limited], 
                itemStyle: { borderRadius: [0, 8, 8, 0], color: '#95a5a6' },
                label: { show: true, position: 'inside', formatter: '{c} 間' } 
            }
        ]
    });
}

function renderMerchantTypeBars() {
    const container = document.getElementById('typeBars');
    if (!container) return;
    container.innerHTML = '';
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7B05E'];
    
    aggregatedData.merchantTypes.forEach((type, idx) => {
        const color = colors[idx % colors.length];
        const div = document.createElement('div');
        div.className = 'type-bar-item';
        div.onclick = () => alert(`篩選：${type.name}\n共 ${type.count} 間商戶 (佔比 ${type.percentage}%)`);
        
        div.innerHTML = `
            <span class="type-label" title="${type.name}">${type.name}</span>
            <div class="type-bar-bg">
                <div class="type-bar-fill" style="width: ${type.percentage}%; background-color: ${color};">
                    ${type.percentage > 12 ? type.percentage + '%' : ''}
                </div>
            </div>
            <span class="type-count">${type.count}</span>
        `;
        container.appendChild(div);
    });
}

function renderDistrictChart() {
    const container = document.getElementById('districtBars');
    if (!container) return;
    container.innerHTML = '';
    
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    
    aggregatedData.districtData.forEach((district, idx) => {
        const color = colors[idx % colors.length];
        const div = document.createElement('div');
        div.className = 'type-bar-item';
        div.onclick = () => alert(`${district.name}\n共 ${district.count} 間商戶 (佔比 ${district.percentage}%)`);
        
        div.innerHTML = `
            <span class="type-label" style="width: 100px;" title="${district.name}">${district.name}</span>
            <div class="type-bar-bg">
                <div class="type-bar-fill" style="width: ${district.percentage}%; background-color: ${color};">
                    ${district.percentage > 12 ? district.percentage + '%' : ''}
                </div>
            </div>
            <span class="type-count">${district.count}</span>
        `;
        container.appendChild(div);
    });
}

function renderChainChart() {
    const container = document.getElementById('chainBars');
    if (!container) return;
    container.innerHTML = '';
    
    const colors = ['#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c'];
    
    aggregatedData.chainData.forEach((chain, idx) => {
        const color = colors[idx % colors.length];
        const div = document.createElement('div');
        div.className = 'type-bar-item';
        div.onclick = () => alert(`${chain.name}\n共 ${chain.count} 間商戶 (佔比 ${chain.percentage}%)`);
        
        div.innerHTML = `
            <span class="type-label" style="width: 130px;" title="${chain.name}">${chain.name}</span>
            <div class="type-bar-bg">
                <div class="type-bar-fill" style="width: ${chain.percentage}%; background-color: ${color};">
                    ${chain.percentage > 12 ? chain.percentage + '%' : ''}
                </div>
            </div>
            <span class="type-count">${chain.count}</span>
        `;
        container.appendChild(div);
    });
}

function renderSpecialRemarksTable() {
    const tbody = document.querySelector('#specialRemarksTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (!aggregatedData.specialMerchants || aggregatedData.specialMerchants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">暫無特殊標記商戶</td></tr>';
        return;
    }
    
    aggregatedData.specialMerchants.forEach(merchant => {
        const row = tbody.insertRow();
        row.onclick = () => alert(`詳情：\n名稱：${merchant.name}\n區域：${merchant.district}\n連鎖：${merchant.chain}\n備註：${merchant.remark}`);
        
        row.insertCell(0).innerText = merchant.name.length > 40 ? merchant.name.substring(0, 40) + '...' : merchant.name;
        row.insertCell(1).innerText = merchant.district;
        row.insertCell(2).innerText = merchant.chain;
        row.insertCell(3).innerHTML = `<span class="remark-badge">${merchant.remark}</span>`;
    });
}

function updateSummaryAndInsights(data) {
    // 更新摘要卡片
    const totalEl = document.getElementById('totalMerchants');
    const totalOctopusEl = document.getElementById('totalOctopus');
    const octopusRateEl = document.getElementById('octopusRate');
    const nfcRateEl = document.getElementById('nfcRate');
    const specialCountEl = document.getElementById('specialCount');
    
    if (totalEl) totalEl.innerText = data.total;
    if (totalOctopusEl) totalOctopusEl.innerText = data.octopusSupported;
    if (octopusRateEl) octopusRateEl.innerText = data.octopusPercentage + '%';
    if (nfcRateEl) nfcRateEl.innerText = data.nfcPercentage + '%';
    if (specialCountEl) specialCountEl.innerText = data.specialMerchants.length;
    
    // 更新洞察列表
    const insightsList = document.getElementById('insightsList');
    if (insightsList) {
        insightsList.innerHTML = '';
        
        const insights = data.insights || [
            `📊 總共分析 ${data.total} 間商戶，八達通接受率為 ${data.octopusPercentage}%`,
            `📍 ${data.districtData[0]?.name || '主要區域'} 是商戶最密集區域`,
            `🏪 獨立商戶仍是市場主力，連鎖品牌有增長空間`,
            `📱 NFC支付接受率 ${data.nfcPercentage}%，是非接觸式支付的重要機會`,
            `💡 建議針對高流量區域優先推廣八達通服務`
        ];
        
        insights.forEach(insight => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check-circle" style="color: #27ae60; margin-right: 10px;"></i>${insight}`;
            insightsList.appendChild(li);
        });
    }
}

function showErrorState() {
    const elements = ['satisfactionRate', 'avgTransactionTime', 'repeatUsageRate', 'usageGrowth'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = 'Error';
    });
}