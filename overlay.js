const { ipcRenderer } = require('electron');

const canvas = document.getElementById('gardenCanvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

// Settings
let settings = {
    opacity: 0.8,
    plantType: 'all',
    growthSpeed: 50,
    witherSpeed: 50,
    
    treeRatio: 30,
    treeHeight: 1.0,
    treeLeafSize: 1.0,
    
    flowerRatio: 30,
    flowerHeight: 1.0,
    flowerBudSize: 1.0,
    
    grassRatio: 40,
    grassHeight: 1.0
};

let plants = [];
let lastKeyTime = Date.now();
let isWithering = false;

// IPC listeners
ipcRenderer.on('key-pressed', () => {
    lastKeyTime = Date.now();
    isWithering = false;
    
    // Resume scale if was withering
    plants.forEach(p => p.withering = false);
    
    let activePlants = plants.filter(p => !p.done);
    
    if (activePlants.length === 0 || Math.random() < 0.05) {
        if (plants.length > 40) {
            plants.shift();
        }
        createNewPlant();
    }
    
    plants.forEach(p => {
        // Growth speed scaling: 0-100 to 0.0-10.0
        if (!p.done) p.grow(settings.growthSpeed * 0.1);
    });
});

ipcRenderer.on('settings-changed', (event, newSettings) => {
    settings = { ...settings, ...newSettings };
});

function createNewPlant() {
    let type = 'grass';
    
    if (settings.plantType === 'all') {
        const totalWeight = settings.treeRatio + settings.flowerRatio + settings.grassRatio;
        
        if (totalWeight <= 0) {
            // Fallback if all sliders are 0
            const rand = Math.random();
            if (rand < 0.33) type = 'tree';
            else if (rand < 0.66) type = 'flower';
            else type = 'grass';
        } else {
            let rand = Math.random() * totalWeight;
            if (rand < settings.treeRatio) {
                type = 'tree';
            } else if (rand < settings.treeRatio + settings.flowerRatio) {
                type = 'flower';
            } else {
                type = 'grass';
            }
        }
    } else {
        type = settings.plantType;
    }
    
    const x = Math.random() * width;
    
    if (type === 'tree') {
        plants.push(new Tree(x, height));
    } else if (type === 'flower') {
        plants.push(new Flower(x, height));
    } else {
        plants.push(new Grass(x, height));
    }
}

// Plant Classes
class Plant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.done = false;
        this.scale = 1.0;
        this.withering = false;
    }
    grow(speed) {}
    drawPath(ctx) {}
    
    draw(ctx) {
        if (this.scale <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = settings.opacity;
        
        // Scale from the bottom origin
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.translate(-this.x, -this.y);
        
        this.drawPath(ctx);
        
        ctx.restore();
    }
}

class Grass extends Plant {
    constructor(x, y) {
        super(x, y);
        this.blades = [];
        let numBlades = 3 + Math.floor(Math.random() * 3);
        let grassHeight = 25 * settings.grassHeight; 
        
        for(let i=0; i<numBlades; i++) {
            this.blades.push({
                offsetX: (Math.random() - 0.5) * 10,
                height: 0,
                maxHeight: grassHeight + (Math.random() - 0.5) * 5,
                angle: (Math.random() - 0.5) * 0.5,
                color: `hsl(${100 + Math.random() * 40}, 80%, 40%)`
            });
        }
    }

    grow(speed) {
        let allDone = true;
        this.blades.forEach(b => {
            if (b.height < b.maxHeight) {
                b.height += speed * 1.5;
                allDone = false;
            }
        });
        if (allDone) this.done = true;
    }

    drawPath(ctx) {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        this.blades.forEach(b => {
            ctx.strokeStyle = b.color;
            ctx.beginPath();
            ctx.moveTo(this.x + b.offsetX, this.y);
            let endX = this.x + b.offsetX + Math.sin(b.angle) * b.height;
            let endY = this.y - Math.cos(b.angle) * b.height;
            ctx.lineTo(endX, endY);
            ctx.stroke();
        });
    }
}

class Flower extends Plant {
    constructor(x, y) {
        super(x, y);
        this.stemHeight = 0;
        // Base flower stem height smaller
        this.maxStemHeight = (20 + Math.random() * 30) * settings.flowerHeight;
        this.petalSize = 0;
        // Base flower bud size smaller
        this.maxPetalSize = (6 + Math.random() * 6) * settings.flowerBudSize;
        this.petals = 5 + Math.floor(Math.random() * 4);
        this.stemColor = `hsl(100, 60%, 40%)`;
        this.flowerColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
    }

    grow(speed) {
        if (this.stemHeight < this.maxStemHeight) {
            this.stemHeight += speed * 2;
        } else if (this.petalSize < this.maxPetalSize) {
            this.petalSize += speed * 0.5;
        } else {
            this.done = true;
        }
    }

    drawPath(ctx) {
        // Draw stem
        ctx.strokeStyle = this.stemColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y - this.stemHeight);
        ctx.stroke();
        
        // Draw flower
        if (this.petalSize > 0) {
            let flowerY = this.y - this.stemHeight;
            ctx.fillStyle = this.flowerColor;
            for (let i = 0; i < this.petals; i++) {
                let angle = (i * Math.PI * 2) / this.petals;
                let px = this.x + Math.cos(angle) * this.petalSize;
                let py = flowerY + Math.sin(angle) * this.petalSize;
                
                ctx.beginPath();
                ctx.arc(px, py, this.petalSize * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
            // Center
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(this.x, flowerY, this.petalSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Tree extends Plant {
    constructor(x, y) {
        super(x, y);
        this.branches = [{ x, y, angle: -Math.PI / 2, length: 0, depth: 0 }];
        this.maxDepth = 5 + Math.floor(Math.random() * 3);
        // Base tree height bigger
        this.maxLength = ((height * 0.7) / this.maxDepth) * settings.treeHeight;
        this.color = `hsl(120, ${40 + Math.random() * 20}%, ${20 + Math.random() * 20}%)`;
    }

    grow(speed) {
        let growingBranches = this.branches.filter(b => b.length < this.maxLength / (b.depth + 1));
        
        if (growingBranches.length === 0) {
            // Spawn new branches
            let canSpawn = this.branches.filter(b => b.depth < this.maxDepth && !b.spawned);
            if (canSpawn.length === 0) {
                this.done = true;
                return;
            }
            
            // Pick a branch to split
            let b = canSpawn[Math.floor(Math.random() * canSpawn.length)];
            b.spawned = true;
            
            let endX = b.x + Math.cos(b.angle) * b.length;
            let endY = b.y + Math.sin(b.angle) * b.length;
            
            this.branches.push({ x: endX, y: endY, angle: b.angle - 0.3 - Math.random() * 0.3, length: 0, depth: b.depth + 1 });
            this.branches.push({ x: endX, y: endY, angle: b.angle + 0.3 + Math.random() * 0.3, length: 0, depth: b.depth + 1 });
        } else {
            // Grow existing branches
            growingBranches.forEach(b => {
                b.length += speed * 2;
            });
        }
    }

    drawPath(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineCap = 'round';
        
        this.branches.forEach(b => {
            ctx.lineWidth = Math.max(1, 10 - b.depth * 2);
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            let endX = b.x + Math.cos(b.angle) * b.length;
            let endY = b.y + Math.sin(b.angle) * b.length;
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Draw leaves at the end of deep branches
            if (b.depth > this.maxDepth - 2 && b.length > 5) {
                ctx.fillStyle = `hsl(${80 + Math.random() * 40}, 80%, 40%)`;
                ctx.beginPath();
                ctx.arc(endX, endY, 4 * settings.treeLeafSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, width, height);
    
    let now = Date.now();
    let inactiveTime = now - lastKeyTime;
    
    // Wither threshold: 5 seconds
    if (inactiveTime > 5000) {
        isWithering = true;
    }
    
    let alivePlants = [];
    
    plants.forEach(p => {
        if (isWithering) {
            p.withering = true;
            // Shrink down: speed mapped from 0-100 to scale reduction
            p.scale -= (settings.witherSpeed * 0.0001);
        } else if (!p.withering && p.scale < 1.0) {
            // Regrow if typing starts again
            p.scale += 0.05;
            if (p.scale > 1.0) p.scale = 1.0;
        }
        
        if (p.scale > 0) {
            p.draw(ctx);
            alivePlants.push(p);
        }
    });
    
    plants = alivePlants;
    
    requestAnimationFrame(animate);
}

animate();
