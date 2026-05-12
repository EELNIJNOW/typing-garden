const { ipcRenderer } = require('electron');

const isActiveEl = document.getElementById('isActive');
const displaySelectEl = document.getElementById('displaySelect');
const plantTypeEl = document.getElementById('plantType');
const opacityEl = document.getElementById('opacity');
const growthSpeedEl = document.getElementById('growthSpeed');
const witherSpeedEl = document.getElementById('witherSpeed');

const treeRatioEl = document.getElementById('treeRatio');
const treeHeightEl = document.getElementById('treeHeight');
const treeLeafSizeEl = document.getElementById('treeLeafSize');

const flowerRatioEl = document.getElementById('flowerRatio');
const flowerHeightEl = document.getElementById('flowerHeight');
const flowerBudSizeEl = document.getElementById('flowerBudSize');

const grassRatioEl = document.getElementById('grassRatio');
const grassHeightEl = document.getElementById('grassHeight');

const opacityVal = document.getElementById('opacityVal');
const growthVal = document.getElementById('growthVal');
const witherVal = document.getElementById('witherVal');

const treeRatioVal = document.getElementById('treeRatioVal');
const treeHeightVal = document.getElementById('treeHeightVal');
const treeLeafVal = document.getElementById('treeLeafVal');

const flowerRatioVal = document.getElementById('flowerRatioVal');
const flowerHeightVal = document.getElementById('flowerHeightVal');
const flowerBudVal = document.getElementById('flowerBudVal');

const grassRatioVal = document.getElementById('grassRatioVal');
const grassHeightVal = document.getElementById('grassHeightVal');

let currentDisplayId = null;

function updateSettings() {
    const settings = {
        isActive: isActiveEl.checked,
        displayId: displaySelectEl.value,
        plantType: plantTypeEl.value,
        opacity: parseFloat(opacityEl.value),
        growthSpeed: parseInt(growthSpeedEl.value),
        witherSpeed: parseInt(witherSpeedEl.value),
        
        treeRatio: parseInt(treeRatioEl.value),
        treeHeight: parseInt(treeHeightEl.value) / 100,
        treeLeafSize: parseInt(treeLeafSizeEl.value) / 100,
        
        flowerRatio: parseInt(flowerRatioEl.value),
        flowerHeight: parseInt(flowerHeightEl.value) / 100,
        flowerBudSize: parseInt(flowerBudSizeEl.value) / 100,
        
        grassRatio: parseInt(grassRatioEl.value),
        grassHeight: parseInt(grassHeightEl.value) / 100
    };
    
    // Update labels
    opacityVal.textContent = Math.round(settings.opacity * 100) + '%';
    growthVal.textContent = settings.growthSpeed;
    witherVal.textContent = settings.witherSpeed;
    
    treeRatioVal.textContent = treeRatioEl.value + '%';
    treeHeightVal.textContent = treeHeightEl.value + '%';
    treeLeafVal.textContent = treeLeafSizeEl.value + '%';
    
    flowerRatioVal.textContent = flowerRatioEl.value + '%';
    flowerHeightVal.textContent = flowerHeightEl.value + '%';
    flowerBudVal.textContent = flowerBudSizeEl.value + '%';
    
    grassRatioVal.textContent = grassRatioEl.value + '%';
    grassHeightVal.textContent = grassHeightEl.value + '%';

    // Send to main process
    ipcRenderer.send('update-settings', settings);
}

// Receive displays info
ipcRenderer.on('displays-info', (event, displays, activeId) => {
    displaySelectEl.innerHTML = '';
    displays.forEach((d, index) => {
        const option = document.createElement('option');
        // Convert ID to string because HTML value is string
        option.value = d.id.toString();
        option.textContent = `모니터 ${index + 1} (${d.bounds.width}x${d.bounds.height})${d.isPrimary ? ' - 주 모니터' : ''}`;
        displaySelectEl.appendChild(option);
    });
    
    currentDisplayId = activeId ? activeId.toString() : null;
    if (currentDisplayId) {
        displaySelectEl.value = currentDisplayId;
    }
    updateSettings();
});

// Event listeners
isActiveEl.addEventListener('change', updateSettings);
displaySelectEl.addEventListener('change', updateSettings);
plantTypeEl.addEventListener('change', updateSettings);
opacityEl.addEventListener('input', updateSettings);
growthSpeedEl.addEventListener('input', updateSettings);
witherSpeedEl.addEventListener('input', updateSettings);

treeRatioEl.addEventListener('input', updateSettings);
treeHeightEl.addEventListener('input', updateSettings);
treeLeafSizeEl.addEventListener('input', updateSettings);

flowerRatioEl.addEventListener('input', updateSettings);
flowerHeightEl.addEventListener('input', updateSettings);
flowerBudSizeEl.addEventListener('input', updateSettings);

grassRatioEl.addEventListener('input', updateSettings);
grassHeightEl.addEventListener('input', updateSettings);
