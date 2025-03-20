document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('drawing-board');
    const ctx = canvas.getContext('2d');
    const toolbar = document.getElementById('toolbar');

    let isPainting = false;
    let lineWidth = 5;

    // Store the current stroke as a GeoJSON object
    let currentStroke = {
        type: "Feature",
        properties: {
            userId: "user123", // Replace with the actual user ID
            color: ctx.strokeStyle,
            lineWidth: ctx.lineWidth
        },
        geometry: {
            type: "LineString",
            coordinates: [] // Array of [x, y] coordinates
        }
    };

    // Function to resize the canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth - toolbar.offsetWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial canvas resize

    // Button event listeners
    toolbar.addEventListener('click', e => {
        if (e.target.id === 'clear') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveDrawing(); // Save the cleared canvas
        } else if (e.target.id === 'undo') {
            undo();
        } else if (e.target.id === 'redo') {
            redo();
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
        currentStroke.geometry.coordinates.push([e.clientX - toolbar.offsetWidth, e.clientY]);
    }

    canvas.addEventListener('mousedown', (e) => {
        isPainting = true;
        ctx.beginPath();
        ctx.lineWidth = lineWidth;  // Zorg ervoor dat de lijnbreedte correct is ingesteld
        ctx.moveTo(e.clientX - toolbar.offsetWidth, e.clientY);

        // Maak een nieuw GeoJSON-object met de juiste instellingen
        currentStroke = {
            type: "Feature",
            properties: {
                userId: "user123",
                color: ctx.strokeStyle,
                lineWidth: lineWidth // Gebruik de juiste lijnbreedte
            },
            geometry: {
                type: "LineString",
                coordinates: [[e.clientX - toolbar.offsetWidth, e.clientY]]
            }
        };
    });


    canvas.addEventListener('mouseup', () => {
        if (isPainting) {
            isPainting = false;
            saveStroke(currentStroke); // Save the stroke as GeoJSON
            currentStroke = {
                type: "Feature",
                properties: {
                    userId: "user123", // Replace with the actual user ID
                    color: ctx.strokeStyle,
                    lineWidth: ctx.lineWidth
                },
                geometry: {
                    type: "LineString",
                    coordinates: []
                }
            };
        }
    });

    canvas.addEventListener('mousemove', draw);

    // Save stroke to the database
    function saveStroke(stroke) {
        const drawingData = {
            GeoJSON: JSON.stringify(stroke) // Ensure the GeoJSON object is stringified
        };

        console.log("Saving stroke:", drawingData); // Log the data being sent

        fetch('/api/drawing/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(drawingData), // Send the drawing data as JSON
        })
            .then(response => response.json())
            .then(data => console.log(data.message))
            .catch(error => console.error('Error saving stroke:', error));
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

    // Redo functionality
    function redo() {
        fetch('/api/drawing/redo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                if (data.drawing) {
                    // Load the redone drawing
                    loadLatestDrawing();
                }
                console.log(data.message);
            })
            .catch(error => console.error('Error redoing drawing:', error));
    }

    // Load the latest drawings from the database
    function loadLatestDrawing() {
        fetch('/api/drawing/latest')
            .then(response => response.json())
            .then(data => {
                console.log("Received drawings from backend:", data); // Log the received data
                if (data && data.length > 0) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    data.forEach(drawing => {
                        const stroke = JSON.parse(drawing.geoJSON); // Parse the GeoJSON string
                        renderStroke(stroke);
                    });
                }
            })
            .catch(error => console.error('Error loading drawings:', error));
    }

    // Render a stroke on the canvas
    function renderStroke(stroke) {
        console.log("Rendering stroke:", stroke); // Log the stroke being rendered
        ctx.strokeStyle = stroke.properties.color;
        ctx.lineWidth = stroke.properties.lineWidth;
        ctx.beginPath();

        stroke.geometry.coordinates.forEach((point, index) => {
            const [x, y] = point;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }

    loadLatestDrawing(); // Load the latest drawings on page load
});