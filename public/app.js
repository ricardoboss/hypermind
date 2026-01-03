const countEl = document.getElementById('count');
const directEl = document.getElementById('direct');
const canvas = document.getElementById('network');
const ctx = canvas.getContext('2d');
let particles = [];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.size = 3;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#4ade80';
        ctx.fill();
    }
}

const updateParticles = (count) => {
    const VISUAL_LIMIT = 500;
    const visualCount = Math.min(count, VISUAL_LIMIT);

    const currentCount = particles.length;
    if (visualCount > currentCount) {
        for (let i = 0; i < visualCount - currentCount; i++) {
            particles.push(new Particle());
        }
    } else if (visualCount < currentCount) {
        particles.splice(visualCount, currentCount - visualCount);
    }
}

const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(74, 222, 128, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

const openDiagnostics = () => {
    document.getElementById('diagnosticsModal').classList.add('active');
}

const closeDiagnostics = () => {
    document.getElementById('diagnosticsModal').classList.remove('active');
}

document.getElementById('diagnosticsModal').addEventListener('click', (e) => {
    if (e.target.id === 'diagnosticsModal') {
        closeDiagnostics();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDiagnostics();
    }
});

const terminal = document.getElementById('terminal');
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');
const promptEl = document.querySelector('.prompt');
let myId = null;
let myChatHistory = [];

const updatePromptStatus = () => {
    const now = Date.now();
    myChatHistory = myChatHistory.filter(t => now - t < 10000);
    
    if (myChatHistory.length >= 5) {
        promptEl.style.color = 'orange';
    } else {
        promptEl.style.color = '#4ade80';
    }
};

setInterval(updatePromptStatus, 500);

const getColorFromId = (id) => {
    if (!id) return '#666';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
}

const appendMessage = (msg) => {
    const div = document.createElement('div');
    
    if (msg.type === 'SYSTEM') {
        div.className = 'msg-system';
        div.innerText = `[SYSTEM] ${msg.content}`;
    } else if (msg.type === 'CHAT') {
        const senderColor = getColorFromId(msg.sender);
        const senderName = msg.sender === myId ? 'You' : msg.sender.slice(-4);
        
        const senderSpan = document.createElement('span');
        senderSpan.className = 'msg-sender';
        senderSpan.style.color = senderColor;
        senderSpan.innerText = `[${senderName}]`;
        
        const contentSpan = document.createElement('span');
        contentSpan.className = 'msg-content';
        contentSpan.innerText = ` > ${msg.content}`;
        
        div.appendChild(senderSpan);
        div.appendChild(contentSpan);
    }
    
    terminalOutput.appendChild(div);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

terminalInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const content = terminalInput.value.trim();
        if (!content) return;
        
        terminalInput.value = '';
        
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                myChatHistory.push(Date.now());
                updatePromptStatus();
            } else if (res.status === 429) {
                // Force update if we hit the limit unexpectedly
                // Add a dummy timestamp to force the limit state if not already there
                if (myChatHistory.length < 5) {
                    myChatHistory.push(Date.now());
                }
                updatePromptStatus();
            }
        } catch (err) {
            console.error('Failed to send message', err);
        }
    }
});

const evtSource = new EventSource("/events");

evtSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'CHAT' || data.type === 'SYSTEM') {
        appendMessage(data);
        return;
    }

    if (data.chatEnabled) {
        terminal.classList.remove('hidden');
        document.body.classList.add('chat-active');
    } else {
        terminal.classList.add('hidden');
        document.body.classList.remove('chat-active');
    }
    
    if (data.id) myId = data.id;

    updateParticles(data.count);

    if (countEl.innerText != data.count) {
        countEl.innerText = data.count;
        countEl.classList.remove('pulse');
        void countEl.offsetWidth;
        countEl.classList.add('pulse');
    }

    directEl.innerText = data.direct;

    if (data.diagnostics) {
        const d = data.diagnostics;
        document.getElementById('diag-heartbeats-rx').innerText = d.heartbeatsReceived.toLocaleString();
        document.getElementById('diag-heartbeats-tx').innerText = d.heartbeatsRelayed.toLocaleString();
        document.getElementById('diag-new-peers').innerText = d.newPeersAdded.toLocaleString();
        document.getElementById('diag-dup-seq').innerText = d.duplicateSeq.toLocaleString();
        document.getElementById('diag-invalid-pow').innerText = d.invalidPoW.toLocaleString();
        document.getElementById('diag-invalid-sig').innerText = d.invalidSig.toLocaleString();
        document.getElementById('diag-bandwidth-in').innerText = (d.bytesReceived / 1024).toFixed(1) + ' KB';
        document.getElementById('diag-bandwidth-out').innerText = (d.bytesRelayed / 1024).toFixed(1) + ' KB';
        document.getElementById('diag-leave').innerText = d.leaveMessages.toLocaleString();
    }
};

evtSource.onerror = (err) => {
    // Removing console error here as it's extremely spammy in the browser console and it will reconnct automatically anyway, so pretty redundant.
};

const initialCount = parseInt(countEl.dataset.initialCount) || 0;
countEl.innerText = initialCount;
countEl.classList.add('loaded');
updateParticles(initialCount);
animate();

