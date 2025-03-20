document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('drawing-board');
    const ctx = canvas.getContext('2d');
    const toolbar = document.getElementById('toolbar');

    let isPainting = false;
    let lineWidth = 5;
    let strokes = []; // Store drawn strokes

    // Initialize SignalR connection
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("/drawingHub")
        .build();

    // Start the SignalR connection
    connection.start()
        .then(() => console.log("SignalR connection established."))
        .catch(err => console.error("SignalR connection error:", err));

    // Listen for incoming strokes
    connection.on("ReceiveStroke", (strokeJson) => {
        const stroke = JSON.parse(strokeJson);
        renderStroke(stroke);
    });

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
        // Bewaar huidige kleur en lijnbreedte
        const currentStrokeStyle = ctx.strokeStyle;
        const currentLineWidth = ctx.lineWidth;

        // Sla de huidige afbeelding op
        const imageData = canvas.toDataURL();

        // Pas de grootte van het canvas aan
        canvas.width = window.innerWidth - toolbar.offsetWidth;
        canvas.height = window.innerHeight;

        // Herstel de kleur en lijnbreedte
        ctx.strokeStyle = currentStrokeStyle;
        ctx.lineWidth = currentLineWidth;

        // Herstel de getekende inhoud
        const img = new Image();
        img.src = imageData;
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
        };
    }


    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Button event listeners
    toolbar.addEventListener('click', e => {
        if (e.target.id === 'clear') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveDrawing();
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

    // Save stroke to the database and broadcast via SignalR
    function saveStroke(stroke) {
        strokes.push(stroke); // Store the stroke locally

        const drawingData = { GeoJSON: JSON.stringify(stroke) };

        fetch('/api/drawing/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(drawingData),
        })
            .then(response => response.json())
            .then(() => {
                connection.invoke("SendStroke", drawingData.GeoJSON)
                    .catch(err => console.error("Error broadcasting stroke:", err));
            })
            .catch(error => console.error('Error saving stroke:', error));
    }


    // Undo functionality
    function undo() {
        fetch('/api/drawing/undo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                if (data.drawing) {
                    strokes.pop(); // Remove last stroke from the local array

                    // Clear canvas and redraw only the remaining strokes
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    strokes.forEach(renderStroke);
                }
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
                console.log("Ontvangen tekeningen van backend:", data); // Debugging

                if (data && data.length > 0) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Sorteer op CreatedAt in oplopende volgorde (oudste eerst, nieuwste laatst)
                    data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    data.forEach(drawing => {
                        const stroke = JSON.parse(drawing.geoJSON);
                        renderStroke(stroke);
                    });
                }
            })
            .catch(error => console.error('Fout bij het laden van tekeningen:', error));
    }

    // Render a stroke on the canvas
    function renderStroke(stroke) {
        console.log("Rendering stroke:", stroke); // Debugging log

        ctx.save(); // Save the current drawing state

        ctx.strokeStyle = stroke.properties.color; // Use the stroke's color only for this stroke
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
        ctx.restore(); // Restore previous state so the user's color is not changed
    }

    loadLatestDrawing(); // Load the latest drawings on page load
});