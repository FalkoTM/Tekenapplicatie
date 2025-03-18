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
            saveDrawing(); // Save the cleared canvas
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
        saveDrawing(); // Save the drawing after each stroke
    });
    canvas.addEventListener('mousemove', draw);

    // Save drawing to the database
    function saveDrawing() {
        const drawingData = canvas.toDataURL(); // Convert canvas to base64 image
        fetch('/api/drawing/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ DrawingData: drawingData }),
        })
            .then(response => response.json())
            .then(data => console.log(data.message))
            .catch(error => console.error('Error saving drawing:', error));
    }

    // Load the latest drawing from the database
    function loadLatestDrawing() {
        fetch('/api/drawing/latest')
            .then(response => response.json())
            .then(data => {
                if (data.drawingData) {
                    const img = new Image();
                    img.src = data.drawingData;
                    img.onload = () => ctx.drawImage(img, 0, 0);
                }
            })
            .catch(error => console.error('Error loading drawing:', error));
    }

    loadLatestDrawing(); // Load the latest drawing on page load
});