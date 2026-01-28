function initCardAnimation() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), 150 * i);
    });
}

// dual clock

function initClock() {
    const myTime = document.getElementById('my-time');
    const yourTime = document.getElementById('your-time');
    const yourTz = document.getElementById('your-tz');
    if (!myTime || !yourTime) return;
    
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const tzAbbr = new Date().toLocaleTimeString('en-US', { 
        timeZone: userTz,
        timeZoneName: 'short' 
    }).split(' ').pop();
    
    if (yourTz) yourTz.textContent = tzAbbr;
    
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    
    function update() {
        const now = new Date();
        
        myTime.textContent = now.toLocaleTimeString('en-GB', {
            ...timeOptions,
            timeZone: 'Europe/Paris'
        });
        
        yourTime.textContent = now.toLocaleTimeString('en-GB', {
            ...timeOptions,
            timeZone: userTz
        });
    }
    
    update();
    setInterval(update, 1000);
}

// for the theme color palette
function initPalette() {
    const colors = document.querySelectorAll('.palette-color');
    const root = document.documentElement;
    
    const colorMap = {
        red: { accent: '#e53935', hover: 'rgba(229, 57, 53, 0.4)' },
        orange: { accent: '#ff9800', hover: 'rgba(255, 152, 0, 0.4)' },
        blue: { accent: '#2196f3', hover: 'rgba(33, 150, 243, 0.4)' },
        purple: { accent: '#a855f7', hover: 'rgba(168, 85, 247, 0.4)' },
        green: { accent: '#4caf50', hover: 'rgba(76, 175, 80, 0.4)' },
        pink: { accent: '#ec407a', hover: 'rgba(236, 64, 122, 0.4)' }
    };
    
    const saved = localStorage.getItem('accent-color');
    if (saved && colorMap[saved]) setColor(saved);
    
    colors.forEach(el => {
        el.addEventListener('click', () => {
            const color = el.dataset.color;
            setColor(color);
            localStorage.setItem('accent-color', color);
        });
    });
    
    function setColor(name) {
        const c = colorMap[name];
        root.style.setProperty('--accent', c.accent);
        root.style.setProperty('--border-hover', c.hover);
        colors.forEach(el => el.classList.toggle('active', el.dataset.color === name));
    }
}

// ty to the module typeit for the typing effect
function initTyping() {
    const base = 'sh $ ';
    const text = 'mnk.wtf';
    const title = document.getElementById('page-title');
    if (!title) return;
    
    let i = 0;
    let deleting = false;
    
    function type() {
        if (!deleting) {
            title.textContent = base + text.slice(0, ++i) + '▌';
            if (i === text.length) {
                setTimeout(() => { deleting = true; type(); }, 2500);
                return;
            }
        } else {
            title.textContent = base + text.slice(0, --i) + '▌';
            if (i === 0) {
                deleting = false;
                setTimeout(type, 500);
                return;
            }
        }
        setTimeout(type, deleting ? 60 : 100);
    }
    setTimeout(type, 500);
}

// blog system 
const Blog = {
    formatDate(d) {
        return new Date(d).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    parseFrontmatter(content) {
        const m = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (!m) return { meta: {}, content };
        const meta = {};
        m[1].split('\n').forEach(l => {
            const i = l.indexOf(':');
            if (i > -1) {
                let v = l.slice(i + 1).trim();
                if (v.startsWith('"')) v = v.slice(1, -1);
                if (v === 'true') v = true;
                if (v === 'false') v = false;
                meta[l.slice(0, i).trim()] = v;
            }
        });
        return { meta, content: m[2] };
    },
    // simple markdown to HTML converter
    md2html(md) {
        return md
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/_(.+?)_/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, m => '<ul>' + m + '</ul>')
            .split('\n\n')
            .map(b => {
                b = b.trim();
                if (!b || b.startsWith('<')) return b;
                return `<p>${b}</p>`;
            })
            .join('\n');
    },
    
    async loadIndex() {
        try {
            const r = await fetch('/data/posts.json');
            return r.ok ? await r.json() : [];
        } catch {
            return [];
        }
    },
    
    async loadPost(slug) {
        try {
            const r = await fetch(`/data/posts/${slug}.md`);
            return r.ok ? this.parseFrontmatter(await r.text()) : null;
        } catch {
            return null;
        }
    },
    
    async renderRecent(id, limit = 3) {
        const el = document.getElementById(id);
        if (!el) return;
        
        const posts = (await this.loadIndex())
            .filter(p => !p.draft)
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, limit);
        
        el.innerHTML = posts.length ? posts.map(p => `
            <li class="blog-item">
                <a href="/blog/post.html?slug=${p.slug}">
                    <p class="blog-item-title">${p.title}</p>
                    <p class="blog-item-date">${this.formatDate(p.pubDate)}</p>
                </a>
            </li>
        `).join('') : '<li class="blog-item"><p class="blog-item-title">No posts yet.</p></li>';
    },
    
    async renderList(id) {
        const el = document.getElementById(id);
        if (!el) return;
        
        const posts = (await this.loadIndex())
            .filter(p => !p.draft)
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        
        el.innerHTML = posts.map(p => `
            <a href="/blog/post.html?slug=${p.slug}" class="card blog-card">
                <h3 class="blog-card-title">${p.title}</h3>
                <p class="blog-card-desc">${p.description || ''}</p>
                <div class="blog-card-meta">
                    <span class="blog-card-cat">${p.category || 'General'}</span>
                    <span>${this.formatDate(p.pubDate)}</span>
                </div>
            </a>
        `).join('') || '<p>No posts yet.</p>';
    },
    
    async renderPost() {
        const slug = new URLSearchParams(location.search).get('slug');
        if (!slug) return location.href = '/blog/';
        
        const post = await this.loadPost(slug);
        if (!post) {
            document.getElementById('post-content').innerHTML = '<p>Post not found.</p>';
            return;
        }
        
        document.getElementById('post-title').textContent = post.meta.title || 'Untitled';
        document.getElementById('post-meta').innerHTML = `
            <span class="post-cat">${post.meta.category || 'General'}</span>
            <span>${this.formatDate(post.meta.pubDate)}</span>
        `;
        document.getElementById('post-content').innerHTML = this.md2html(post.content);
        document.title = `${post.meta.title} | mnk.wtf`;
    }
};

// init all
document.addEventListener('DOMContentLoaded', () => {
    initCardAnimation();
    initClock();
    initPalette();
    initTyping();
    
    // ??? :D
    if (window.EasterEgg) {
        window.EasterEgg.init();
    }
    
    // blog
    Blog.renderRecent('recent-posts', 3);
    if (document.getElementById('posts-list')) Blog.renderList('posts-list');
    if (document.getElementById('post-content')) Blog.renderPost();
});