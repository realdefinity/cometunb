window.getRank = (score) => {
    if (score >= 98.5) return { title: 'Godlike', color: '#a855f7', msg: 'Perfection.' };
    if (score >= 95) return { title: 'Cyborg', color: '#3b82f6', msg: 'Incredible!' };
    if (score >= 90) return { title: 'Master', color: '#22c55e', msg: 'Excellent' };
    if (score >= 80) return { title: 'Artist', color: '#eab308', msg: 'Great Job' };
    if (score >= 70) return { title: 'Human', color: '#f97316', msg: 'Not Bad' };
    if (score >= 50) return { title: 'Potato', color: '#ef4444', msg: 'Keep Trying' };
    return { title: 'Square', color: '#64748b', msg: 'What was that?' };
};

window.resetUI = () => {
    const { instruction, score, rank, feedback } = window.elements;
    instruction.style.opacity = 0;
    score.classList.remove('visible');
    rank.classList.remove('visible');
    feedback.style.opacity = 0;
    feedback.style.transform = 'translateY(10px)';
    feedback.style.color = '#94a3b8';
};

window.resetGame = () => {
    window.state.points = [];
    window.elements.instruction.style.opacity = 1;
};

window.showFeedback = (text, color = '#94a3b8') => {
    const { feedback } = window.elements;
    feedback.innerText = text;
    feedback.style.color = color;
    feedback.style.opacity = 1;
};

window.animateScore = (target, color) => {
    const { score } = window.elements;
    const duration = 1500;
    const startTime = performance.now();
    window.state.ghostProgress = 0;

    score.classList.add('visible');

    const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);

        const current = ease * target;
        score.innerText = `${current.toFixed(1)}%`;
        score.style.backgroundImage = `linear-gradient(135deg, #fff 0%, ${color} 100%)`;
        window.state.ghostProgress = ease;

        if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
};
