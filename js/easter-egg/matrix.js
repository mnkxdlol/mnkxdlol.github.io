const EasterEgg = {
    clicks: 0,
    lastClick: 0,
    canvas: null,
    ctx: null,
    columns: [],
    chars: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンCATS01',
    
    init() {
        const avatar = document.querySelector('.avatar');
        if (!avatar) return;
        
        avatar.addEventListener('click', () => this.handleClick());
        this.createOverlay();
    },
    
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'easter-egg-overlay';
        overlay.innerHTML = `
            <canvas id="matrix-canvas"></canvas>
            <div id="easter-message">Cats will dominate the world.</div>
        `;
        document.body.appendChild(overlay);
    },
    
    handleClick() {
        const now = Date.now();
        if (now - this.lastClick > 800) this.clicks = 0;
        this.lastClick = now;
        this.clicks++;
        
        if (this.clicks === 3) {
            this.trigger();
            this.clicks = 0;
        }
    },
    
    trigger() {
        // to make all card disappear
        document.querySelectorAll('.card').forEach((card, i) => {
            setTimeout(() => {
                card.style.transition = 'all 0.4s ease';
                card.style.transform = 'scale(0) rotate(15deg)';
                card.style.opacity = '0';
            }, i * 30);
        });
        
        // start the effect of matrix appear
        setTimeout(() => {
            const overlay = document.getElementById('easter-egg-overlay');
            overlay.classList.add('active');
            this.startMatrix();
        }, 300);
        
        // finish after 5 sec
        setTimeout(() => location.reload(), 5000);
    },
    
    startMatrix() {
        this.canvas = document.getElementById('matrix-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        const fontSize = 14;
        const columnCount = Math.floor(this.canvas.width / fontSize);
        
        // random initial position for each column
        this.columns = [];
        for (let i = 0; i < columnCount; i++) {
            this.columns[i] = Math.random() * -100;
        }
        
        this.animate(fontSize);
    },
    
    animate(fontSize) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#a855f7';
        this.ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < this.columns.length; i++) {
            // make the character random
            const char = this.chars[Math.floor(Math.random() * this.chars.length)];
            const x = i * fontSize;
            const y = this.columns[i] * fontSize;
    
            this.ctx.fillText(char, x, y);
            
            if (y > this.canvas.height && Math.random() > 0.975) {
                this.columns[i] = 0;
            }
            
            this.columns[i]++;
        }
        
        requestAnimationFrame(() => this.animate(fontSize));
    }
};

// to make accessible globally
window.EasterEgg = EasterEgg;
