var CellularAutomatonEngine = /** @class */ (function () {
    function CellularAutomatonEngine(size, canvas) {
        this.size = size;
        this.pixelSize = 1;
        this.pixelScalar = 1;
        this.data = CellularAutomatonEngine.randBoard(this.size);
        this.buffer = new Uint8Array(this.size * this.size);
        this.bufferLength = this.buffer.length;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d", { alpha: false });
        this.ctx.imageSmoothingEnabled = true;
        this.alpha = 0.006;
        this.blurEnabled = false;
        this.clearEveryFrame = false;
        this.color = "orange";
        this.shape = "gliderse";
        this.colorMode = "full";
        this.colorRadix = 16777215;
        this.ctx.fillStyle = "rgba(0,0,0,1)";
        this.ctx.fillRect(0, 0, this.size * this.pixelSize, this.size * this.pixelSize);
        this.colorRateFps = 120;
        this.colorRateCounter = 0;
        this.colorCache = this.randColorString();
        this.noiseEnabled = false;
        this.noiseRangeValue = 0;
        this.mode = "life";
    }
    CellularAutomatonEngine.prototype.reset = function () {
        this.data = CellularAutomatonEngine.randBoard(this.size);
    };
    CellularAutomatonEngine.prototype.clear = function () {
        this.data = new Uint8Array(this.size * this.size);
    };
    CellularAutomatonEngine.rand = function (min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    };
    CellularAutomatonEngine.randBoard = function (size) {
        var _this = this;
        return new Uint8Array(size * size).map(function (_) { return _this.rand(0, 2); });
    };
    CellularAutomatonEngine.prototype.set = function (x, y, value) {
        this.data[y * this.size + x] = value;
    };
    CellularAutomatonEngine.prototype.get = function (x, y) {
        var size = this.size;
        var yy = y < 0 ? size + y : y % size;
        var xx = x < 0 ? size + x : x % size;
        return this.data[yy * size + xx];
    };
    CellularAutomatonEngine.prototype.update = function () {
        for (var i = 0; i < this.buffer.length; i++) {
            // Noise
            var spontaneousBirth = this.noiseEnabled &&
                CellularAutomatonEngine.rand(0, 1000) > 985 + this.noiseRangeValue;
            if (spontaneousBirth) {
                this.buffer[i] = 1;
                continue;
            }
            var row = i % this.size;
            var col = Math.floor(i / this.size);
            // Optimization - array-based algorithm led to GC Pressure and low frame rate
            var liveNeighbors = 0;
            this.get(row - 1, col - 1) && liveNeighbors++;
            this.get(row, col - 1) && liveNeighbors++;
            this.get(row + 1, col - 1) && liveNeighbors++;
            this.get(row - 1, col) && liveNeighbors++;
            this.get(row + 1, col) && liveNeighbors++;
            this.get(row - 1, col + 1) && liveNeighbors++;
            this.get(row, col + 1) && liveNeighbors++;
            this.get(row + 1, col + 1) && liveNeighbors++;
            var status_1 = 0;
            var alive = this.get(row, col);
            // prettier-ignore
            switch (this.mode) {
                case "famine":
                    ( // S6789
                    (alive && (liveNeighbors > 5)) || spontaneousBirth) && (status_1 = 1);
                    break;
                case "anneal":
                    ( // S35678
                    (alive && (liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8)) ||
                        // B4678
                        (liveNeighbors === 4 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8)) && (status_1 = 1);
                    break;
                case "morley":
                    ( // S245
                    (alive && (liveNeighbors === 2 || liveNeighbors === 4 || liveNeighbors === 5)) ||
                        // B368
                        (liveNeighbors === 3 || liveNeighbors === 6 || liveNeighbors === 8)) && (status_1 = 1);
                    break;
                case "day&night":
                    ( // S34678
                    (alive && (liveNeighbors === 3 || liveNeighbors === 4 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8)) ||
                        // B3678
                        (liveNeighbors === 3 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8)) && (status_1 = 1);
                    break;
                case "2x2":
                    ( // S125
                    (alive && (liveNeighbors === 1 || liveNeighbors === 2 || liveNeighbors === 5)) ||
                        // B36
                        (liveNeighbors === 3 || liveNeighbors === 6)) && (status_1 = 1);
                    break;
                case "diamoeba":
                    ( // S5678
                    (alive && (liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8)) ||
                        // B35678
                        (liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8)) && (status_1 = 1);
                    break;
                case "34life":
                    ( // S34
                    (alive && (liveNeighbors === 3 || liveNeighbors === 4)) ||
                        // B34
                        (liveNeighbors === 3 || liveNeighbors === 4) ||
                        spontaneousBirth) && (status_1 = 1);
                    break;
                case "B25/S4":
                    ( // S4
                    (alive && (liveNeighbors === 4)) ||
                        // B25
                        (liveNeighbors === 2 || liveNeighbors === 5)) && (status_1 = 1);
                    break;
                case "seeds":
                    ( // S
                    (alive) ||
                        // B2
                        (liveNeighbors === 2)) && (status_1 = 1);
                    break;
                case "replicator":
                    ( // S1357
                    (alive && (liveNeighbors === 1 || liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 7)) ||
                        // B1357
                        (liveNeighbors === 1 || liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 7)) && (status_1 = 1);
                    break;
                case "highlife":
                    ( // S23
                    (alive && (liveNeighbors === 2 || liveNeighbors === 3)) ||
                        // B36
                        (liveNeighbors === 3 || liveNeighbors === 6)) && (status_1 = 1);
                    break;
                case "life":
                    ( // A23
                    (alive && (liveNeighbors === 2 || liveNeighbors === 3)) ||
                        // B3
                        liveNeighbors === 3) && (status_1 = 1);
                    break;
            }
            this.buffer[i] = status_1;
        }
        _a = [this.buffer, this.data], this.data = _a[0], this.buffer = _a[1];
        return 0;
        var _a;
    };
    CellularAutomatonEngine.prototype.getMousePos = function (evt) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            y: Math.floor(((evt.clientX - rect.left) / this.pixelSize) * this.pixelScalar),
            x: Math.floor(((evt.clientY - rect.top) / this.pixelSize) * this.pixelScalar)
        };
    };
    CellularAutomatonEngine.prototype.hover = function (e) {
        var _a = this.getMousePos(e), x = _a.x, y = _a.y;
        this.set(x - 1, y - 1, 1);
        this.set(x - 1, y, 1);
        this.set(x - 1, y + 1, 1);
        this.set(x, y - 1, 1);
        this.set(x, y, 1);
        this.set(x, y + 1, 1);
        this.set(x - 1, y - 1, 1);
        this.set(x - 1, y, 1);
        this.set(x - 1, y + 1, 1);
    };
    CellularAutomatonEngine.prototype.clickDown = function (e) {
        var _a = this.getMousePos(e), x = _a.x, y = _a.y;
        // Glider SE
        switch (this.shape) {
            case "gliderse":
                this.set(x - 1, y, 1);
                this.set(x, y + 1, 1);
                this.set(x + 1, y - 1, 1);
                this.set(x + 1, y, 1);
                this.set(x + 1, y + 1, 1);
                break;
            case "glidersw":
                this.set(x - 1, y, 1);
                this.set(x, y - 1, 1);
                this.set(x + 1, y - 1, 1);
                this.set(x + 1, y, 1);
                this.set(x + 1, y + 1, 1);
                break;
            case "gliderne":
                this.set(x + 1, y, 1);
                this.set(x, y + 1, 1);
                this.set(x - 1, y - 1, 1);
                this.set(x - 1, y, 1);
                this.set(x - 1, y + 1, 1);
                break;
            case "glidernw":
                this.set(x + 1, y, 1);
                this.set(x, y - 1, 1);
                this.set(x - 1, y - 1, 1);
                this.set(x - 1, y, 1);
                this.set(x - 1, y + 1, 1);
                break;
            case "3x3":
            default:
                this.set(x - 1, y - 1, 1);
                this.set(x - 1, y, 1);
                this.set(x - 1, y + 1, 1);
                this.set(x, y - 1, 1);
                this.set(x, y, 1);
                this.set(x, y + 1, 1);
                this.set(x - 1, y - 1, 1);
                this.set(x - 1, y, 1);
                this.set(x - 1, y + 1, 1);
        }
    };
    CellularAutomatonEngine.prototype.randColor = function () {
        if (this.colorRateCounter > this.colorRateFps) {
            this.colorCache = this.randColorString();
            this.colorRateCounter = 0;
        }
        this.colorRateCounter = this.colorRateCounter + 1;
        return this.colorCache;
    };
    CellularAutomatonEngine.prototype.randColorString = function () {
        return "#" + Math.floor(Math.random() * this.colorRadix).toString(16);
    };
    CellularAutomatonEngine.prototype.draw = function (isAnimating) {
        if (isAnimating === void 0) { isAnimating = true; }
        if (isAnimating) {
            this.ctx.fillStyle = "rgba(1,1,1," + this.alpha + ")";
            this.ctx.fillRect(0, 0, this.size * this.pixelSize, this.size * this.pixelSize);
        }
        if (this.clearEveryFrame)
            this.ctx.clearRect(0, 0, this.size * this.pixelSize, this.size * this.pixelSize);
        if (this.colorMode === "full") {
            this.ctx.fillStyle = this.randColor();
        }
        else if (this.colorMode === "picker" || this.colorMode === "hsluv") {
            this.ctx.fillStyle = this.color;
        }
        for (var row = 0; row < this.size; row++) {
            if (this.colorMode === "row") {
                this.ctx.fillStyle = this.randColor();
            }
            for (var col = 0; col < this.size; col++) {
                if (this.get(row, col) === 1) {
                    if (this.colorMode === "each") {
                        this.ctx.fillStyle = this.randColor();
                    }
                    this.ctx.fillRect(col * this.pixelSize, row * this.pixelSize, this.pixelSize, this.pixelSize);
                }
            }
        }
    };
    return CellularAutomatonEngine;
}());
var sel = function (selector) { return document.querySelector(selector); };
var canvas = sel("canvas");
var simulation = new CellularAutomatonEngine(750, canvas);
var favicon = sel("#favicon");
// Update the favicon with the current canvas
favicon.href = canvas.toDataURL();
window.setInterval(function () { return (favicon.href = canvas.toDataURL()); }, 5000);
var msPast = null;
var msPerFrame = 7;
var masterOnOff = true;
var masterCacheState = masterOnOff;
function tick(now) {
    if (!msPast)
        msPast = now;
    if (!msPast || (now - msPast > msPerFrame && masterOnOff)) {
        msPast = now;
        simulation.draw(simulation.blurEnabled);
        simulation.update();
    }
    window.requestAnimationFrame(tick);
}
window.requestAnimationFrame(tick);
var rangeOver = function (input, max, floor) {
    return expon(input) * max + floor;
};
var expon = function (x) {
    var value = parseFloat(x);
    value = value < 0.0 ? 0.0 : value;
    value = value > 1.0 ? 1.0 : value;
    return -Math.sqrt(-value + 1) + 1;
};
sel("#delay").addEventListener("input", function (e) { return (simulation.alpha = rangeOver(e.target.value, 1.0, 0)); }, false);
sel("#setBlendMode").addEventListener("input", function (e) {
    var currentState = masterOnOff;
    if (currentState)
        masterOnOff = false;
    simulation.ctx.globalCompositeOperation = e.target.value;
    masterOnOff = currentState;
});
sel("#rate").addEventListener("input", function (e) { return (msPerFrame = parseInt(e.target.value)); });
var isHovering = false;
sel("#hoverOn").addEventListener("input", function () { return (isHovering = true); });
sel("#hoverOff").addEventListener("input", function () { return (isHovering = false); });
canvas.addEventListener("mousemove", function (e) { return isHovering && simulation.hover(e); }, false);
canvas.addEventListener("click", function (e) { return simulation.clickDown(e); }, false);
sel("#masterOn").addEventListener("change", function () { return (masterOnOff = true); });
sel("#masterOff").addEventListener("change", function () { return (masterOnOff = false); });
sel("#modal-capture-preview").addEventListener("click", function () { return (sel("#modal-capture ").style.display = "none"); }, false);
sel("#screencap").addEventListener("click", function () {
    var img = new Image();
    var dataUrl = canvas.toDataURL("image/png");
    img.src = dataUrl;
    img.alt = "CanvasGOL-" + Date.now();
    img.title = "Right click and select \"Save Image As..\"\nLeft click to exit (all your captures are saved until refresh)\n";
    var a = document.createElement("a");
    a.href = dataUrl;
    a.append(img);
    a.download = "CanvasGOL-" + Date.now() + ".png";
    sel("#modal-capture").style.display = "flex";
    sel("#modal-capture-preview").prepend(a);
    masterOnOff = false;
    sel("#masterOff").checked = true;
});
sel("#showGallery").addEventListener("click", function () { return (sel("#modal-capture").style.display = "flex"); });
sel("#reset").addEventListener("click", function () { return simulation.reset(); });
sel("#clear").addEventListener("click", function () { return simulation.clear(); });
sel("#setShape").addEventListener("change", function (e) { return (simulation.shape = e.target.value); });
sel("#color").addEventListener("input", function (e) {
    simulation.color = e.target.value;
    // redraw if paused so the user can see what colors
    masterOnOff || simulation.draw(false);
}, false);
// HSLUV picker
sel(".input-hex").addEventListener("input", function (e) {
    simulation.color = e.target.value;
    // redraw if paused so the user can see what colors
    masterOnOff || simulation.draw(false);
}, false);
sel("#colorMode").addEventListener("change", function (e) {
    simulation.colorMode = e.target.value;
    switch (e.target.value) {
        case "picker":
            sel("#colorRadix").style.display = "none";
            sel('label[for="colorRadix"]').style.display = "none";
            sel("#randCycle").style.display = "none";
            sel('label[for="randCycle"]').style.display = "none";
            sel("#picker").style.display = "none";
            sel("#color").style.display = "block";
            sel('label[for="color"]').style.display = "block";
            break;
        case "hsluv":
            sel("#colorRadix").style.display = "none";
            sel('label[for="colorRadix"]').style.display = "none";
            sel("#randCycle").style.display = "none";
            sel('label[for="randCycle"]').style.display = "none";
            sel('label[for="color"]').style.display = "none";
            sel("#picker").style.display = "block";
            break;
        default:
            sel("#colorRadix").style.display = "block";
            sel('label[for="colorRadix"]').style.display = "block";
            sel("#randCycle").style.display = "block";
            sel('label[for="randCycle"]').style.display = "block";
            sel("#color").style.display = "none";
            sel("#picker").style.display = "none";
            sel('label[for="color"]').style.display = "none";
    }
});
sel("#colorRadix").addEventListener("input", function (e) { return (simulation.colorRadix = parseInt(e.target.value)); });
var recorders = null;
sel("#recStart").addEventListener("change", function () {
    var chunks = []; // here we will store our recorded media chunks (Blobs)
    var stream = canvas.captureStream();
    var rec = new MediaRecorder(stream);
    // every time the recorder has new data, we will store it in our array
    recorders = rec;
    rec.ondataavailable = function (chunk) { return chunks.push(chunk.data); };
    // only when the recorder stops, we construct a complete Blob from all the chunks
    rec.onstop = function () {
        var vid = document.createElement("video");
        vid.src = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
        vid.controls = true;
        sel("#modal-capture-preview").prepend(vid);
        masterCacheState = masterOnOff;
        masterOnOff = false;
    };
    rec.start();
    setTimeout(function () {
        recorders && recorders.stop();
        sel("#recStop").checked = true;
    }, 1000 * 30); // stop recording in 30s
});
sel("#recStop").addEventListener("change", function () {
    recorders.stop();
    recorders = null;
});
sel("#blurOn").addEventListener("input", function () {
    simulation.blurEnabled = true;
    simulation.clearEveryFrame = false;
    sel("#delay").disabled = false;
});
sel("#blurOff").addEventListener("input", function () {
    simulation.blurEnabled = false;
    simulation.clearEveryFrame = false;
    sel("#delay").disabled = true;
});
sel("#clearFrame").addEventListener("change", function () {
    simulation.clearEveryFrame = true;
    simulation.blurEnabled = false;
    sel("#delay").disabled = true;
});
sel("#setBlendMode").addEventListener("change", function (e) { return (simulation.ctx.globalCompositeOperation = e.target.value); });
sel("#randCycle").addEventListener("input", function (e) {
    simulation.colorRateFps = rangeOver(e.target.value, 1000, 1);
    simulation.colorRateCounter = 0;
});
sel("#noiseRangeValue").addEventListener("input", function (e) { return (simulation.noiseRangeValue = rangeOver(e.target.value, 3, 12)); });
sel("#noiseOn").addEventListener("change", function () { return (simulation.noiseEnabled = true); });
sel("#noiseOff").addEventListener("change", function () { return (simulation.noiseEnabled = false); });
sel("#gameType").addEventListener("change", function (e) { return (simulation.mode = e.target.value); });
