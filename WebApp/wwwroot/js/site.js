document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('drawing-board');
    const ctx = canvas.getContext('2d');
    const toolbar = document.getElementById('toolbar');

    let isPainting = false;
    let lineWidth = 5;

    // Store the current drawing as an image
    let currentDrawing = new Image();

    // Function to resize the canvas
    function resizeCanvas() {
        // Save the current canvas content as an image
        const imageData = canvas.toDataURL();

        // Resize the canvas
        canvas.width = window.innerWidth - toolbar.offsetWidth;
        canvas.height = window.innerHeight;

        // Redraw the saved image onto the resized canvas
        currentDrawing.src = imageData;
        currentDrawing.onload = () => {
            ctx.drawImage(currentDrawing, 0, 0);
        };
    }

    // Event listener for window resize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial canvas resize

    // Button event listeners
    toolbar.addEventListener('click', e => {
        if (e.target.id === 'clear') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveDrawing(); // Save the cleared canvas
        } else if (e.target.id === 'undo') {
            undo();
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

    // Drawing logic
    const draw = (e) => {
        if (!isPainting) return;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineTo(e.clientX - toolbar.offsetWidth, e.clientY);
        ctx.stroke();
    }

    canvas.addEventListener('mousedown', () => {
        isPainting = true;
        ctx.beginPath(); // Start a new path when the user starts drawing
    });

    canvas.addEventListener('mouseup', () => {
        if (isPainting) {
            isPainting = false;
            saveDrawing(); // Save the drawing only when the stroke ends
        }
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

    // Undo functionality
    function undo() {
        fetch('/api/drawing/undo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                if (data.drawing) {
                    // Load the previous drawing (if any)
                    loadLatestDrawing();
                }
                console.log(data.message);
            })
            .catch(error => console.error('Error undoing drawing:', error));
    }

    // Load the latest drawing from the database
    function loadLatestDrawing() {
        fetch('/api/drawing/latest')
            .then(response => response.json())
            .then(data => {
                if (data.drawingData) {
                    const img = new Image();
                    img.src = data.drawingData;
                    img.onload = () => {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                    };
                }
            })
            .catch(error => console.error('Error loading drawing:', error));
    }

    loadLatestDrawing(); // Load the latest drawing on page load
});