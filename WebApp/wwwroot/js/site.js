document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('drawing-board');
    const ctx = canvas.getContext('2d');
    const toolbar = document.getElementById('toolbar');

    function resizeCanvas() {
        canvas.width = window.innerWidth - toolbar.offsetWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let isPainting = false;
    let lineWidth = 5;

    toolbar.addEventListener('click', e => {
        if (e.target.id === 'clear') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });

    toolbar.addEventListener('change', e => {
        if (e.target.id === 'stroke') {
            ctx.strokeStyle = e.target.value;
        }
        if (e.target.id === 'lineWidth') {
            lineWidth = e.target.value;
        }
    });

    const draw = (e) => {
        if (!isPainting) return;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineTo(e.clientX - toolbar.offsetWidth, e.clientY);
        ctx.stroke();
    }

    canvas.addEventListener('mousedown', () => isPainting = true);
    canvas.addEventListener('mouseup', () => {
        isPainting = false;
        ctx.beginPath();
    });
    canvas.addEventListener('mousemove', draw);
});