// region-c.js - service insights dashboard

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
    
    // Render all charts
    renderOctopusChart();
    renderCardChart();
    renderCashChart();
    renderNFCProgress();
    renderHoursChart();
    renderMerchantTypeBars();
    renderDistrictChart();
    renderChainChart();
    renderSpecialRemarksTable();
    
    // Update summary and insights
    updateSummaryAndInsights(aggregatedData);
});

function renderOctopusChart() {
    const chart = echarts.init(document.getElementById('octopusChart'));
    const supported = aggregatedData.octopusSupported;
    const notSupported = aggregatedData.total - aggregatedData.octopusSupported;
    
    chart.setOption({
        title: { 
            text: `Octopus Acceptance Rate: ${aggregatedData.octopusPercentage}%`, 
            left: 'center', 
            top: 0, 
            textStyle: { fontSize: 12, fontWeight: 'normal' } 
        },
        tooltip: { 
            trigger: 'item', 
            formatter: '{b}: {d}% ({c})' 
        },
        color: ['#27ae60', '#95a5a6'],
        series: [{
            type: 'pie',
            radius: '55%',
            center: ['50%', '55%'],
            data: [
                { name: 'Octopus Supported', value: supported },
                { name: 'Not Supported', value: notSupported }
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
            formatter: '{b}: {c} merchants'
        },
        color: ['#9b59b6', '#8e44ad'],
        title: { 
            text: 'Credit / Debit Card Acceptance', 
            left: 'center', 
            top: 0, 
            textStyle: { fontSize: 12 } 
        },
        grid: { top: 40, bottom: 20, left: 60, right: 30 },
        xAxis: { 
            type: 'category', 
            data: ['Credit Card', 'Debit Card'],
            axisLabel: { fontSize: 12 }
        },
        yAxis: { 
            type: 'value', 
            name: 'Merchant Count',
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
            formatter: '{b}: {d}% ({c})' 
        },
        color: ['#f1c40f', '#e67e22'],
        title: { 
            text: `Cash-Only Share: ${aggregatedData.cashOnlyPercentage}%`, 
            left: 'center', 
            top: 0, 
            textStyle: { fontSize: 12 } 
        },
        series: [{
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['50%', '55%'],
            data: [
                { name: 'Cash Only', value: cashOnly },
                { name: 'Other Payment Accepted', value: others }
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
                let result = 'Opening Hours Distribution<br/>';
                params.forEach(p => {
                    const percent = ((p.value / total) * 100).toFixed(1);
                    result += `${p.marker} ${p.seriesName}: ${p.value} (${percent}%)<br/>`;
                });
                return result;
            }
        },
        color: ['#27ae60', '#3498db', '#95a5a6'],
        title: { 
            text: `Opening Hours Distribution (Total Merchants: ${total})`, 
            left: 'center', 
            top: 0, 
            textStyle: { fontSize: 12 } 
        },
        grid: { top: 50, bottom: 20, left: 60, right: 30 },
        xAxis: { 
            type: 'category', 
            data: ['Opening Hours'],
            axisLabel: { fontSize: 12 }
        },
        yAxis: { 
            type: 'value', 
            name: 'Merchant Count',
            nameLocation: 'middle',
            nameGap: 45,
            min: 0,
            max: total
        },
        series: [
            { 
                name: 'Open All Week', 
                type: 'bar', 
                data: [weekFull], 
                itemStyle: { borderRadius: [8, 0, 0, 8], color: '#27ae60' },
                label: { show: true, position: 'inside', formatter: '{c}' } 
            },
            { 
                name: 'Weekdays Only', 
                type: 'bar', 
                data: [weekdayOnly], 
                itemStyle: { borderRadius: [0, 0, 0, 0], color: '#3498db' },
                label: { show: true, position: 'inside', formatter: '{c}' } 
            },
            { 
                name: 'Limited / Unknown', 
                type: 'bar', 
                data: [limited], 
                itemStyle: { borderRadius: [0, 8, 8, 0], color: '#95a5a6' },
                label: { show: true, position: 'inside', formatter: '{c}' } 
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
        div.onclick = () => alert(`Filter: ${type.name}\nTotal: ${type.count} merchants (share ${type.percentage}%)`);
        
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
        div.onclick = () => alert(`${district.name}\nTotal: ${district.count} merchants (share ${district.percentage}%)`);
        
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
        div.onclick = () => alert(`${chain.name}\nTotal: ${chain.count} merchants (share ${chain.percentage}%)`);
        
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
        tbody.innerHTML = '<tr><td colspan="4">No special-flagged merchants</td></tr>';
        return;
    }
    
    aggregatedData.specialMerchants.forEach(merchant => {
        const row = tbody.insertRow();
        row.onclick = () => alert(`Details:\nName: ${merchant.name}\nDistrict: ${merchant.district}\nChain: ${merchant.chain}\nRemark: ${merchant.remark}`);
        
        row.insertCell(0).innerText = merchant.name.length > 40 ? merchant.name.substring(0, 40) + '...' : merchant.name;
        row.insertCell(1).innerText = merchant.district;
        row.insertCell(2).innerText = merchant.chain;
        row.insertCell(3).innerHTML = `<span class="remark-badge">${merchant.remark}</span>`;
    });
}

function updateSummaryAndInsights(data) {
    // Update summary cards
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
    
    // Update insights list
    const insightsList = document.getElementById('insightsList');
    if (insightsList) {
        insightsList.innerHTML = '';
        
        const insights = data.insights || [
            `Analyzed ${data.total} merchants; Octopus acceptance is ${data.octopusPercentage}%`,
            `📍 ${data.districtData[0]?.name || 'the leading district'} has the highest merchant concentration`,
            `Independent merchants remain the core of the market, while chain brands still have room to grow`,
            `NFC acceptance is ${data.nfcPercentage}%, creating a meaningful contactless payment opportunity`,
            `Prioritize Octopus promotion in high-traffic districts`
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
