var Palette = /** @class */ (function () {
    function Palette(color) {
        this.color = color;
    }
    return Palette;
}());
var CellularAutomatonEngine = /** @class */ (function () {
    function CellularAutomatonEngine(size, canvas, controlValues) {
        this.size = size;
        this.pixelSize = 1;
        this.pixelScalar = 1;
        this.data = CellularAutomatonEngine.randBoard(this.size);
        this.buffer = new Uint8Array(this.size * this.size);
        this.bufferLength = this.buffer.length;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d", { alpha: false });
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.fillStyle = "rgba(0,0,0,1)";
        this.ctx.fillRect(0, 0, this.size * this.pixelSize, this.size * this.pixelSize);
        this.alpha = controlValues.alpha;
        this.blurEnabled = controlValues.blurEnabled;
        this.clearEveryFrame = controlValues.clearEveryFrame;
        this.clickShape = controlValues.clickShape;
        this.gameType = controlValues.gameType;
        this.seedDensity = controlValues.seedDensity;
    }
    CellularAutomatonEngine.prototype.seed = function () {
        var data = CellularAutomatonEngine.randBoard(this.size, this.seedDensity);
        for (var i = 0; i < data.length; i++) {
            if (this.data[i])
                data[i] = 1;
        }
        this.data = data;
    };
    CellularAutomatonEngine.prototype.clear = function () {
        this.ctx.clearRect(0, 0, this.size * this.pixelSize, this.size * this.pixelSize);
    };
    CellularAutomatonEngine.prototype.kill = function () {
        this.data = new Uint8Array(this.size * this.size);
    };
    CellularAutomatonEngine.rand = function (min, max, density) {
        var pass = Math.floor(Math.random() * density);
        if (pass === 0) {
            return Math.floor(Math.random() * (max - min)) + min;
        }
        return 0;
    };
    CellularAutomatonEngine.randBoard = function (size, density) {
        var _this = this;
        if (density === void 0) { density = 0; }
        return new Uint8Array(size * size).map(function () { return _this.rand(0, 2, density); });
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
        var _a;
        for (var i = 0; i < this.buffer.length; i++) {
            var row = i % this.size;
            var col = Math.floor(i / this.size);
            // Optimization - array-based algorithm led to GC Pressure and low frame rate
            var liveNeighbors = 0;
            var amp = 1;
            this.get(amp * row - 1, amp * (col - 1)) && liveNeighbors++;
            this.get(amp * row, amp * (col - 1)) && liveNeighbors++;
            this.get(amp * row + 1, amp * (col - 1)) && liveNeighbors++;
            this.get(amp * row - 1, amp * col) && liveNeighbors++;
            this.get(amp * row + 1, amp * col) && liveNeighbors++;
            this.get(amp * row - 1, amp * (col + 1)) && liveNeighbors++;
            this.get(amp * row, amp * (col + 1)) && liveNeighbors++;
            this.get(amp * row + 1, amp * (col + 1)) && liveNeighbors++;
            var status_1 = 0;
            var alive = this.get(row, col);
            // prettier-ignore
            switch (this.gameType) {
                case "famine":
                    // S6789
                    alive &&
                        liveNeighbors > 5 &&
                        (status_1 = 1);
                    break;
                case "anneal":
                    // S35678
                    ((alive &&
                        (liveNeighbors === 3 ||
                            liveNeighbors === 5 ||
                            liveNeighbors === 6 ||
                            liveNeighbors === 7 ||
                            liveNeighbors === 8)) ||
                        // B4678
                        liveNeighbors === 4 ||
                        liveNeighbors === 6 ||
                        liveNeighbors === 7 ||
                        liveNeighbors === 8) &&
                        (status_1 = 1);
                    break;
                case "morley":
                    // S245
                    ((alive &&
                        (liveNeighbors === 2 ||
                            liveNeighbors === 4 ||
                            liveNeighbors === 5)) ||
                        // B368
                        liveNeighbors === 3 ||
                        liveNeighbors === 6 ||
                        liveNeighbors === 8) &&
                        (status_1 = 1);
                    break;
                case "day&night":
                    // S34678
                    ((alive &&
                        (liveNeighbors === 3 ||
                            liveNeighbors === 4 ||
                            liveNeighbors === 6 ||
                            liveNeighbors === 7 ||
                            liveNeighbors === 8)) ||
                        // B3678
                        liveNeighbors === 3 ||
                        liveNeighbors === 6 ||
                        liveNeighbors === 7 ||
                        liveNeighbors === 8) &&
                        (status_1 = 1);
                    break;
                case "2x2":
                    // S125
                    ((alive &&
                        (liveNeighbors === 1 ||
                            liveNeighbors === 2 ||
                            liveNeighbors === 5)) ||
                        // B36
                        liveNeighbors === 3 ||
                        liveNeighbors === 6) &&
                        (status_1 = 1);
                    break;
                case "diamoeba":
                    // S5678
                    ((alive &&
                        (liveNeighbors === 5 ||
                            liveNeighbors === 6 ||
                            liveNeighbors === 7 ||
                            liveNeighbors === 8)) ||
                        // B35678
                        liveNeighbors === 3 ||
                        liveNeighbors === 5 ||
                        liveNeighbors === 6 ||
                        liveNeighbors === 7 ||
                        liveNeighbors === 8) &&
                        (status_1 = 1);
                    break;
                case "34life":
                    // S34
                    ((alive && (liveNeighbors === 3 || liveNeighbors === 4)) ||
                        // B34
                        liveNeighbors === 3 ||
                        liveNeighbors === 4) &&
                        (status_1 = 1);
                    break;
                case "B25/S4":
                    // S4
                    ((alive && liveNeighbors === 4) ||
                        // B25
                        liveNeighbors === 2 ||
                        liveNeighbors === 5) &&
                        (status_1 = 1);
                    break;
                case "seeds":
                    // S
                    (alive ||
                        // B2
                        liveNeighbors === 2) &&
                        (status_1 = 1);
                    break;
                case "replicator":
                    // S1357
                    ((alive &&
                        (liveNeighbors === 1 ||
                            liveNeighbors === 3 ||
                            liveNeighbors === 5 ||
                            liveNeighbors === 7)) ||
                        // B1357
                        liveNeighbors === 1 ||
                        liveNeighbors === 3 ||
                        liveNeighbors === 5 ||
                        liveNeighbors === 7) &&
                        (status_1 = 1);
                    break;
                case "gems":
                    // S4568
                    ((alive &&
                        (liveNeighbors === 4 ||
                            liveNeighbors === 5 ||
                            liveNeighbors === 6 ||
                            liveNeighbors === 8)) ||
                        // B3457
                        liveNeighbors === 3 ||
                        liveNeighbors === 4 ||
                        liveNeighbors === 5 ||
                        liveNeighbors === 7) &&
                        (status_1 = 1);
                    break;
                case "fredkin":
                    // S1357
                    ((alive &&
                        (liveNeighbors === 0 ||
                            liveNeighbors === 2 ||
                            liveNeighbors === 4 ||
                            liveNeighbors === 6 ||
                            liveNeighbors === 8)) ||
                        // B1357
                        liveNeighbors === 1 ||
                        liveNeighbors === 3 ||
                        liveNeighbors === 5 ||
                        liveNeighbors === 7) &&
                        (status_1 = 1);
                    break;
                case "dotlife":
                    // 023
                    ((alive && (liveNeighbors === 0 || liveNeighbors === 2)) ||
                        // B3
                        liveNeighbors === 3) &&
                        (status_1 = 1);
                    break;
                case "highlife":
                    // S23
                    ((alive && (liveNeighbors === 2 || liveNeighbors === 3)) ||
                        // B36
                        liveNeighbors === 3 ||
                        liveNeighbors === 6) &&
                        (status_1 = 1);
                    break;
                case "life":
                    // A23
                    ((alive && (liveNeighbors === 2 || liveNeighbors === 3)) ||
                        // B3
                        liveNeighbors === 3) &&
                        (status_1 = 1);
                    break;
            }
            this.buffer[i] = status_1;
        }
        _a = [this.buffer, this.data], this.data = _a[0], this.buffer = _a[1];
        return 0;
    };
    CellularAutomatonEngine.prototype.getMousePos = function (event) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            y: Math.floor(((event.clientX - rect.left) / this.pixelSize) * this.pixelScalar),
            x: Math.floor(((event.clientY - rect.top) / this.pixelSize) * this.pixelScalar)
        };
    };
    CellularAutomatonEngine.prototype.drawShape = function (x, y, shape) {
        switch (shape) {
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
                this.set(x + 1, y - 1, 1);
                this.set(x + 1, y, 1);
                this.set(x + 1, y + 1, 1);
                this.set(x, y - 1, 1);
                this.set(x, y, 1);
                this.set(x, y + 1, 1);
                this.set(x - 1, y - 1, 1);
                this.set(x - 1, y, 1);
                this.set(x - 1, y + 1, 1);
                break;
            case "r-pentomino":
                this.set(x - 1, y, 1);
                this.set(x - 1, y + 1, 1);
                this.set(x, y - 1, 1);
                this.set(x, y, 1);
                this.set(x + 1, y, 1);
                break;
            case "pi-heptomino":
                this.set(x + 1, y - 1, 1);
                this.set(x + 1, y, 1);
                this.set(x + 1, y + 1, 1);
                this.set(x, y - 1, 1);
                this.set(x, y + 1, 1);
                this.set(x - 1, y - 1, 1);
                this.set(x - 1, y + 1, 1);
                break;
            case "c-heptomino":
                this.set(x - 2, y, 1);
                this.set(x - 1, y - 1, 1);
                this.set(x - 1, y, 1);
                this.set(x - 1, y + 1, 1);
                this.set(x, y - 1, 1);
                this.set(x, y, 1);
                this.set(x + 1, y - 1, 1);
                break;
            case "1x1":
                this.set(x, y, 1);
                break;
            default:
        }
    };
    CellularAutomatonEngine.prototype.clickDown = function (e) {
        var _a = this.getMousePos(e), x = _a.x, y = _a.y;
        this.drawShape(x, y, this.clickShape);
    };
    CellularAutomatonEngine.prototype.draw = function (isAnimating, fillStyle) {
        if (isAnimating === void 0) { isAnimating = true; }
        if (isAnimating) {
            this.ctx.fillStyle = "rgba(1,1,1," + this.alpha + ")";
            this.ctx.fillRect(0, 0, this.size * this.pixelSize, this.size * this.pixelSize);
        }
        if (this.clearEveryFrame)
            this.ctx.clearRect(0, 0, this.size * this.pixelSize, this.size * this.pixelSize);
        this.ctx.fillStyle = fillStyle;
        for (var row = 0; row < this.size; row++) {
            for (var col = 0; col < this.size; col++) {
                if (this.get(row, col) === 1) {
                    this.ctx.fillRect(col * this.pixelSize, row * this.pixelSize, this.pixelSize, this.pixelSize);
                }
            }
        }
    };
    return CellularAutomatonEngine;
}());
// DOM Combinators
var sel = function (selector) { return document.querySelector(selector); };
var on = function (eventType) {
    return function (selector, callback, preventDefault) {
        return sel(selector).addEventListener(eventType, callback, preventDefault);
    };
};
var onClick = on("click");
var onInput = on("input");
var onChange = on("change");
var canvas = sel("canvas");
var palette = new Palette("#ffffff");
var simulation = new CellularAutomatonEngine(750, canvas, {
    alpha: 0.00095,
    clickShape: "gliderse",
    blurEnabled: true,
    clearEveryFrame: false,
    gameType: "life",
    seedDensity: 1
});
canvas.addEventListener("click", function (e) { return simulation.clickDown(e); }, false);
var favicon = sel("#favicon");
// Update the favicon with the current canvas
favicon.href = canvas.toDataURL();
window.setInterval(function () { return (favicon.href = canvas.toDataURL()); }, 5000);
var msPast = null;
var msPerFrame = 100;
var isSimulationActive = true;
var fps = 0;
function tick(now) {
    if (!msPast)
        msPast = now;
    if (!msPast || (now - msPast > msPerFrame && isSimulationActive)) {
        fps = now - msPast;
        msPast = now;
        simulation.draw(simulation.blurEnabled, palette.color);
        simulation.update();
    }
    window.requestAnimationFrame(tick);
}
window.requestAnimationFrame(tick);
var log = function (message, link, linkText) {
    var display = sel("#logDisplay");
    var p = document.createElement("p");
    p.innerText = "> " + message;
    display.append(p);
    if (link) {
        var a = document.createElement("a");
        a.href = link;
        a.innerText = linkText || link;
        a.target = "_blank";
        p.append(a);
    }
    display.scrollTop = sel("#logDisplay").scrollHeight;
};
setTimeout(function () { return log("Hover over controls for help"); }, 3000);
sel("#logDisplay").scrollTop = 0;
onChange("#masterOn", function () {
    isSimulationActive = true;
    log("Simulation ON");
});
onChange("#masterOff", function () {
    isSimulationActive = false;
    log("Simulation OFF");
});
onInput("#msPerFrame", function (_a) {
    var value = _a.target.value;
    return (msPerFrame = parseInt(value));
});
onChange("#msPerFrame", function () {
    return log("Speed is now " + msPerFrame + " milliseconds per generation");
});
setInterval(function () { return (sel("#fps").innerText = fps.toFixed(1) + "ms/f"); }, 1000);
onChange("#gameType", function (_a) {
    var value = _a.target.value;
    simulation.gameType = value;
    log("Game changed to ", gameLink(simulation.gameType), simulation.gameType);
});
setInterval(function () {
    var sum = simulation.data.reduce(function (a, b) { return a + b; }, 0);
    sel("#currentLiveCellCount").value = sum.toString();
}, 250);
var routeColorMode = function (_a) {
    var value = _a.target.value;
    switch (value) {
        case "picker":
            sel("#hsluv-picker").style.display = "none";
            sel("#color").style.display = "block";
            sel('label[for="color"]').style.display = "block";
            log("Color mode is now the native color picker in your browser");
            break;
        case "hsluv":
            sel('label[for="color"]').style.display = "none";
            sel("#hsluv-picker").style.display = "block";
            sel("#color").style.display = "none";
            log("Color mode is now HSLUV picker ", "https://www.hsluv.org/");
            break;
        default:
            sel("#hsluv-picker").style.display = "none";
            sel("#color").style.display = "block";
            sel('label[for="color"]').style.display = "block";
    }
};
onChange("#colorMode", routeColorMode);
routeColorMode({ target: { value: sel("#colorMode").value } });
onInput("#color", function (_a) {
    var value = _a.target.value;
    palette.color = value;
    // redraw if paused so the user can see what colors
    isSimulationActive || simulation.draw(false, palette.color);
}, false);
onInput("#blurOn", function () {
    simulation.blurEnabled = true;
    simulation.clearEveryFrame = false;
    sel("#delay").disabled = false;
    log("Blur ON - previous generations will fade out based on Blur Amount");
});
onInput("#blurOff", function () {
    simulation.blurEnabled = false;
    simulation.clearEveryFrame = false;
    sel("#delay").disabled = true;
    log("Overlay ON - new generation will paint on top of previous one");
});
onChange("#clearFrame", function () {
    simulation.clearEveryFrame = true;
    simulation.blurEnabled = false;
    sel("#delay").disabled = true;
    log("Clear Frame ON - draw only current generation, erase previous generations");
});
var clamp = function (num) { return Math.min(Math.max(num, 0.0), 1.0); };
var rangeOver = function (input, max, floor) {
    return expon(input) * max + floor;
};
var expon = function (x) { return -Math.sqrt(-clamp(parseFloat(x)) + 1) + 1; };
onInput("#delay", function (_a) {
    var value = _a.target.value;
    simulation.alpha = rangeOver(value, 0.004, 0.0000001);
    log("Delay is now ", simulation.alpha.toString(), "");
}, false);
var blendModeLink = {
    "source-over": "https://drafts.fxtf.org/compositing-1/#porterduffcompositingoperators_srcover",
    "source-atop": "https://drafts.fxtf.org/compositing-1/#porterduffcompositingoperators_srcatop",
    lighten: "https://drafts.fxtf.org/compositing-1/#blendinglighten",
    xor: "https://drafts.fxtf.org/compositing-1/#porterduffcompositingoperators_xor",
    multiply: "https://drafts.fxtf.org/compositing-1/#blendingmultiply",
    screen: "https://drafts.fxtf.org/compositing-1/#blendingscreen",
    overlay: "https://drafts.fxtf.org/compositing-1/#blendingoverlay",
    darken: "https://drafts.fxtf.org/compositing-1/#blendingdarken",
    "color-dodge": "https://drafts.fxtf.org/compositing-1/#blendingcolordodge",
    "color-burn": "https://drafts.fxtf.org/compositing-1/#blendingcolorburn",
    "hard-light": "https://drafts.fxtf.org/compositing-1/#blendinghardlight",
    "soft-light": "https://drafts.fxtf.org/compositing-1/#blendingsoftlight",
    difference: "https://drafts.fxtf.org/compositing-1/#blendingdifference",
    exclusion: "https://drafts.fxtf.org/compositing-1/#blendingexclusion",
    hue: "https://drafts.fxtf.org/compositing-1/#blendinghue",
    saturation: "https://drafts.fxtf.org/compositing-1/#blendingsaturation",
    luminosity: "https://drafts.fxtf.org/compositing-1/#blendingluminosity"
};
onInput("#setBlendMode", function (_a) {
    var value = _a.target.value;
    var currentState = isSimulationActive;
    if (currentState)
        isSimulationActive = false;
    var blendMode = value;
    simulation.ctx.globalCompositeOperation = blendMode;
    isSimulationActive = currentState;
    log("Blend Mode is now ", blendModeLink[blendMode], blendMode);
});
onClick("#modal-capture-preview", function () { return (sel("#modal-capture ").style.display = "none"); }, false);
var captureScreenshot = function () {
    var img = new Image();
    var dataUrl = canvas.toDataURL("image/png");
    var imgName = "CellularAnimationStudio-" + Date.now();
    img.src = dataUrl;
    img.alt = imgName;
    img.title = "Click to download\n  \nClick grey border to exit (Simulation has been paused)\n";
    var a = document.createElement("a");
    a.href = dataUrl;
    a.append(img);
    a.download = imgName + ".png";
    log("Screenshot captured, the simulation has been paused.");
    sel("#modal-capture").style.display = "flex";
    sel("#modal-capture-preview").prepend(a);
    isSimulationActive = false;
    sel("#masterOff").checked = true;
};
onClick("#screencap", captureScreenshot);
window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
        return; // Do nothing if event already handled
    }
    if (event.code == "Space")
        captureScreenshot();
});
onClick("#showGallery", function () { return (sel("#modal-capture").style.display = "flex"); });
onClick("#seed", function () {
    simulation.seed();
    log("Simulation seeded - 1 in " + simulation.seedDensity + " odds");
});
onClick("#clearSimulation", function () {
    simulation.clear();
    log("Screen cleared");
});
onClick("#kill", function () {
    simulation.kill();
    log("Cells Killed - click Seed or the canvas to add live cells");
});
onInput("#seedDensity", function (_a) {
    var value = _a.target.value;
    return (simulation.seedDensity = parseInt(value));
});
onChange("#seedDensity", function (_a) {
    var value = _a.target.value;
    return log("Seed Density changed to " + value);
});
var shapeLink = function (shape) {
    switch (shape) {
        case "gliderse":
        case "glidersw":
        case "gliderne":
        case "glidernw":
            return "https://www.conwaylife.com/wiki/Glider";
        case "r-pentomino":
            return "https://www.conwaylife.com/wiki/R-pentomino";
        case "pi-heptomino":
            return "https://www.conwaylife.com/wiki/Pi-heptomino";
        case "c-heptomino":
            return "https://www.conwaylife.com/wiki/C-heptomino";
        case "1x1":
        case "3x3":
            return null;
    }
};
onChange("#setClickShape", function (_a) {
    var value = _a.target.value;
    simulation.clickShape = value;
    log("Click Shape is now ", shapeLink(simulation.clickShape), simulation.clickShape);
});
var recorders = null;
onChange("#recStart", function () {
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
        var vidName = "CellularAnimationStudio-" + Date.now();
        // @ts-ignore
        vid.download = vidName + ".webm";
        vid.controls = true;
        sel("#modal-capture-preview").prepend(vid);
        isSimulationActive = false;
        sel("#masterOff").checked = true;
    };
    rec.start();
    log("Recording started at " + new Date() + "..");
    setTimeout(function () {
        recorders && recorders.stop();
        recorders && log("Recording Stopped after 90 seconds");
        sel("#recStop").checked = true;
    }, 1000 * 90);
});
onChange("#recStop", function () {
    recorders.stop();
    recorders = null;
    log("Recording Stopped, click Gallery to view and download the recording");
});
var gameLink = function (game) {
    switch (game) {
        case "life":
            return "https://conwaylife.com/wiki/Life";
        case "highlife":
            return "https://en.wikipedia.org/wiki/Highlife_(cellular_automaton)";
        case "replicator":
            return "https://conwaylife.com/wiki/Replicator";
        case "seeds":
            return "https://conwaylife.com/wiki/OCA:Seeds";
        case "B25/S4":
        case "34life":
        case "diamoeba":
        case "2x2":
        case "day&night":
        case "morley":
        case "anneal":
            return "https://en.wikipedia.org/wiki/Life-like_cellular_automaton#A_selection_of_Life-like_rules";
        case "famine":
            return null;
    }
};
