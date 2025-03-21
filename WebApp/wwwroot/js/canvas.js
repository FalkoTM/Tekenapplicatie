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

    // Retrieve the username from the server
    const username = "@username";
    console.log("Logged in as:", username);

    // Start the SignalR connection
    connection.start()
        .then(() => console.log("SignalR connection established."))
        .catch(err => console.error("SignalR connection error:", err));

    // Listen for incoming strokes
    connection.on("ReceiveStroke", (strokeJson) => {
        console.log("Received stroke from another user:", strokeJson);
        const stroke = JSON.parse(strokeJson);
        renderStroke(stroke);
    });

    // Listen for undo notifications
    connection.on("ReceiveUndo", () => {
        console.log("Received undo notification");

        // Clear the local strokes array
        strokes = [];

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Reload the latest drawings
        loadLatestDrawing();
    });

    // Listen for redo notifications
    connection.on("ReceiveRedo", () => {
        console.log("Received redo notification");
        loadLatestDrawing(); // Reload the latest drawings
    });

// Store the current stroke as a GeoJSON object
    let currentStroke = {
        type: "Feature",
        properties: {
            color: ctx.strokeStyle, // Only store color and line width
            lineWidth: ctx.lineWidth
        },
        geometry: {
            type: "LineString",
            coordinates: [] // Array of [x, y] coordinates
        }
    };

    // Function to resize the canvas
    function resizeCanvas() {
        // Save current color and line width
        const currentStrokeStyle = ctx.strokeStyle;
        const currentLineWidth = ctx.lineWidth;

        // Save the current image
        const imageData = canvas.toDataURL();

        // Resize the canvas
        canvas.width = window.innerWidth - toolbar.offsetWidth;
        canvas.height = window.innerHeight;

        // Restore the color and line width
        ctx.strokeStyle = currentStrokeStyle;
        ctx.lineWidth = currentLineWidth;

        // Restore the drawn content
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
        ctx.lineWidth = lineWidth;  // Ensure the line width is set correctly
        ctx.moveTo(e.clientX - toolbar.offsetWidth, e.clientY);

        // Create a new GeoJSON object with the correct settings
        currentStroke = {
            type: "Feature",
            properties: {
                color: ctx.strokeStyle,
                lineWidth: lineWidth // Use the correct line width
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
            saveStroke(currentStroke);
            currentStroke = {
                type: "Feature",
                properties: {
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
        strokes.push(stroke);

        const drawingData = {
            GeoJSON: JSON.stringify(stroke),
            UserId: username
        };

        fetch('/api/drawing/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(drawingData),
        })
            .then(response => response.json())
            .then(() => {
                // Broadcast the stroke to other clients via SignalR
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

                    // Notify other clients to update their canvas
                    connection.invoke("NotifyUndo")
                        .catch(err => console.error("Error notifying undo:", err));
                }
            })
            .catch(error => console.error('Error undoing drawing:', error));
    }

    // Redo functionality
    function redo() {
        fetch('/api/drawing/redo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        })
            .then(response => response.json())
            .then(data => {
                if (data.drawing) {
                    // Load the redone drawing
                    loadLatestDrawing();

                    // Notify other clients to update their canvas
                    connection.invoke("NotifyRedo")
                        .catch(err => console.error("Error notifying redo:", err));
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
                console.log("Received drawings from backend:", data);

                if (data && data.length > 0) {
                    // Clear the local strokes array
                    strokes = [];

                    // Clear the canvas
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Sort by CreatedAt in ascending order (oldest first, newest last)
                    data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                    // Update the strokes array and render each stroke
                    data.forEach(drawing => {
                        const stroke = JSON.parse(drawing.geoJSON);
                        strokes.push(stroke); // Add to the local strokes array
                        renderStroke(stroke); // Render the stroke on the canvas
                    });
                }
            })
            .catch(error => console.error('Error loading drawings:', error));
    }

    // Render a stroke on the canvas
    function renderStroke(stroke) {
        console.log("Rendering stroke by user:", stroke.properties.userId);

        ctx.save(); // Save the current drawing state

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
        ctx.restore();
    }

    loadLatestDrawing(); // Load the latest drawings on page load
});