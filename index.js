var INIT_CONTROL_VALUES = {
    alpha: 0.006,
    clickShape: "gliderse",
    hoverShape: "gliderse",
    colorRadix: 16777215,
    blurEnabled: true,
    clearEveryFrame: false,
    colorRateFrames: 120,
    noiseEnabled: false,
    noiseRangeValue: 0,
    game: "life",
    seedDensity: 1,
    amp: 1
};
var Palette = /** @class */ (function () {
    function Palette(color) {
        if (color === void 0) { color = "rgba(0,0,0,1)"; }
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
        this.hoverShape = controlValues.hoverShape;
        this.colorRadix = controlValues.colorRadix;
        this.colorRateFrames = controlValues.colorRateFrames;
        this.colorRateCounter = 0;
        this.colorCache = this.randColorString();
        this.noiseEnabled = controlValues.noiseEnabled;
        this.noiseRangeValue = controlValues.noiseRangeValue;
        this.game = controlValues.game;
        this.seedDensity = controlValues.seedDensity;
        this.amp = controlValues.amp;
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
            // Noise
            var spontaneousBirth = this.noiseEnabled &&
                CellularAutomatonEngine.rand(0, 1000, 0) > 985 + this.noiseRangeValue;
            if (spontaneousBirth) {
                this.buffer[i] = 1;
                continue;
            }
            var row = i % this.size;
            var col = Math.floor(i / this.size);
            // Optimization - array-based algorithm led to GC Pressure and low frame rate
            var liveNeighbors = 0;
            var amp = this.amp;
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
            switch (this.game) {
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
                case "gems":
                    ( // S4568
                    (alive && (liveNeighbors === 4 || liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 8)) ||
                        // B3457
                        (liveNeighbors === 3 || liveNeighbors === 4 || liveNeighbors === 5 || liveNeighbors === 7)) && (status_1 = 1);
                    break;
                case "fredkin":
                    ( // S1357
                    (alive && (liveNeighbors === 0 || liveNeighbors === 2 || liveNeighbors === 4 || liveNeighbors === 6 || liveNeighbors === 8)) ||
                        // B1357
                        (liveNeighbors === 1 || liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 7)) && (status_1 = 1);
                    break;
                case "dotlife":
                    ( // 023
                    (alive && (liveNeighbors === 0 || liveNeighbors === 2) ||
                        // B3
                        liveNeighbors === 3)) && (status_1 = 1);
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
    };
    CellularAutomatonEngine.prototype.getMousePos = function (event) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            y: Math.floor(((event.clientX - rect.left) / this.pixelSize) * this.pixelScalar),
            x: Math.floor(((event.clientY - rect.top) / this.pixelSize) * this.pixelScalar)
        };
    };
    CellularAutomatonEngine.prototype.hover = function (e) {
        var _a = this.getMousePos(e), x = _a.x, y = _a.y;
        this.drawShape(x, y, this.hoverShape);
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
    CellularAutomatonEngine.prototype.randColor = function () {
        if (this.colorRateCounter > this.colorRateFrames) {
            this.colorCache = this.randColorString();
            this.colorRateCounter = 0;
        }
        this.colorRateCounter = this.colorRateCounter + 1;
        return this.colorCache;
    };
    CellularAutomatonEngine.prototype.randColorString = function () {
        return "#" + Math.floor(Math.random() * this.colorRadix).toString(16);
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
var sel = function (selector) { return document.querySelector(selector); };
var canvas = sel("canvas");
var palette = new Palette();
var simulation = new CellularAutomatonEngine(750, canvas, INIT_CONTROL_VALUES);
var favicon = sel("#favicon");
// Update the favicon with the current canvas
favicon.href = canvas.toDataURL();
window.setInterval(function () { return (favicon.href = canvas.toDataURL()); }, 5000);
var msPast = null;
var msPerFrame = 7;
var masterOnOff = true;
function tick(now) {
    if (!msPast)
        msPast = now;
    if (!msPast || (now - msPast > msPerFrame && masterOnOff)) {
        msPast = now;
        simulation.draw(simulation.blurEnabled, palette.color);
        simulation.update();
    }
    window.requestAnimationFrame(tick);
}
window.requestAnimationFrame(tick);
var log = function (message, link, linkText) {
    var prompt = sel("#prompt");
    var p = document.createElement("p");
    p.innerText = "> " + message;
    prompt.append(p);
    if (link) {
        var a = document.createElement("a");
        a.href = link;
        a.innerText = linkText || link;
        a.target = "_blank";
        p.append(a);
    }
    prompt.scrollTop = sel("#prompt").scrollHeight;
};
setTimeout(function () { return log("Hover over controls for help"); }, 3000);
var rangeOver = function (input, max, floor) {
    return expon(input) * max + floor;
};
var expon = function (x) {
    var value = parseFloat(x);
    value = value < 0.0 ? 0.0 : value;
    value = value > 1.0 ? 1.0 : value;
    return -Math.sqrt(-value + 1) + 1;
};
sel("#delay").addEventListener("input", function (e) {
    simulation.alpha = rangeOver(e.target.value, 0.001, 0.00000001);
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
sel("#setBlendMode").addEventListener("input", function (e) {
    var currentState = masterOnOff;
    if (currentState)
        masterOnOff = false;
    var blendMode = e.target.value;
    simulation.ctx.globalCompositeOperation = blendMode;
    masterOnOff = currentState;
    log("Blend Mode is now ", blendModeLink[blendMode], blendMode);
});
sel("#rate").addEventListener("input", function (e) { return (msPerFrame = parseInt(e.target.value)); });
sel("#rate").addEventListener("change", function () {
    return log("Speed is now " + msPerFrame + " milliseconds per generation");
});
var isHovering = false;
sel("#hoverOn").addEventListener("input", function () {
    isHovering = true;
    log("Hover ON - the mouse over the canvas will now draw a shape");
});
sel("#hoverOff").addEventListener("input", function () {
    isHovering = false;
    log("Hover OFF - the mouse over the canvas will not draw");
});
canvas.addEventListener("mousemove", function (e) { return isHovering && simulation.hover(e); }, false);
canvas.addEventListener("click", function (e) { return simulation.clickDown(e); }, false);
sel("#masterOn").addEventListener("change", function () {
    masterOnOff = true;
    log("Simulation ON");
});
sel("#masterOff").addEventListener("change", function () {
    masterOnOff = false;
    log("Simulation OFF");
});
sel("#modal-capture-preview").addEventListener("click", function () { return (sel("#modal-capture ").style.display = "none"); }, false);
var takeSnapshot = function () {
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
    masterOnOff = false;
    sel("#masterOff").checked = true;
};
sel("#screencap").addEventListener("click", takeSnapshot);
window.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) {
        return; // Do nothing if event already handled
    }
    if (event.code == "Space")
        takeSnapshot();
});
sel("#showGallery").addEventListener("click", function () { return (sel("#modal-capture").style.display = "flex"); });
sel("#seed").addEventListener("click", function () {
    simulation.seed();
    log("Simulation seeded - 1 in " + simulation.seedDensity + " odds");
});
sel("#clear").addEventListener("click", function () {
    simulation.clear();
    log("Screen cleared");
});
sel("#kill").addEventListener("click", function () {
    simulation.kill();
    log("Cells Killed - click Seed or the canvas to add live cells");
});
sel("#seedDensity").addEventListener("input", function (e) { return (simulation.seedDensity = parseInt(e.target.value)); });
sel("#seedDensity").addEventListener("change", function (e) {
    return log("Seed Density changed to " + e.target.value);
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
sel("#setClickShape").addEventListener("change", function (e) {
    simulation.clickShape = e.target.value;
    log("Click Shape is now ", shapeLink(simulation.clickShape), simulation.clickShape);
});
sel("#setHoverShape").addEventListener("change", function (e) {
    simulation.hoverShape = e.target.value;
    log("Hover Shape (" + (isHovering ? "ON" : "OFF") + ") is now " + simulation.hoverShape, shapeLink(simulation.hoverShape));
});
sel("#color").addEventListener("input", function (e) {
    palette.color = e.target.value;
    sel("#colorDisplay").value = e.target.value;
    // redraw if paused so the user can see what colors
    masterOnOff || simulation.draw(false, palette.color);
}, false);
// HSLUV picker
sel(".input-hex").addEventListener("input", function (e) {
    palette.color = e.target.value;
    // redraw if paused so the user can see what colors
    masterOnOff || simulation.draw(false, palette.color);
}, false);
sel("#colorMode").addEventListener("change", function (e) {
    switch (e.target.value) {
        case "picker":
            sel("#colorRadix").style.display = "none";
            sel('label[for="colorRadix"]').style.display = "none";
            sel("#randCycle").style.display = "none";
            sel('label[for="randCycle"]').style.display = "none";
            sel("#picker").style.display = "none";
            sel("#color").style.display = "block";
            sel('label[for="color"]').style.display = "block";
            log("Color mode is now the native color picker in your browser");
            sel("#colorDisplay").style.display = "none";
            sel('label[for="colorDisplay"]').style.display = "none";
            break;
        case "hsluv":
            sel("#colorRadix").style.display = "none";
            sel('label[for="colorRadix"]').style.display = "none";
            sel("#randCycle").style.display = "none";
            sel('label[for="randCycle"]').style.display = "none";
            sel('label[for="color"]').style.display = "none";
            sel("#picker").style.display = "block";
            sel("#color").style.display = "none";
            log("Color mode is now HSLUV picker ", "https://www.hsluv.org/");
            sel("#colorDisplay").style.display = "none";
            sel('label[for="colorDisplay"]').style.display = "none";
            break;
        case "full":
            sel("#colorDisplay").style.display = "block";
            sel('label[for="colorDisplay"]').style.display = "block";
            sel("#picker").style.display = "none";
            log("Color mode is now Random Frame - all pixels of each frame will be the same random color");
            break;
        case "row":
            sel("#colorDisplay").style.display = "none";
            sel('label[for="colorDisplay"]').style.display = "none";
            log("Color mode is now Random Row - all pixels of each row will be the same random color");
            break;
        case "each":
            log("Color mode is now Random Pixel- every pixel is a new random color");
            sel("#colorDisplay").style.display = "none";
            sel('label[for="colorDisplay"]').style.display = "none";
            break;
        default:
            sel("#colorRadix").style.display = "block";
            sel('label[for="colorRadix"]').style.display = "block";
            sel("#randCycle").style.display = "block";
            sel('label[for="randCycle"]').style.display = "block";
            sel("#color").style.display = "none";
            sel("#picker").style.display = "none";
            sel('label[for="color"]').style.display = "none";
            sel("#colorDisplay").style.display = "none";
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
        var vidName = "CellularAnimationStudio-" + Date.now();
        // @ts-ignore
        vid.download = vidName + ".webm";
        vid.controls = true;
        sel("#modal-capture-preview").prepend(vid);
        masterOnOff = false;
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
sel("#recStop").addEventListener("change", function () {
    recorders.stop();
    recorders = null;
    log("Recording Stopped, click Gallery to view and download the recording");
});
sel("#blurOn").addEventListener("input", function () {
    simulation.blurEnabled = true;
    simulation.clearEveryFrame = false;
    sel("#delay").disabled = false;
    log("Blur ON - previous generations will fade out based on Blur Amount");
});
sel("#blurOff").addEventListener("input", function () {
    simulation.blurEnabled = false;
    simulation.clearEveryFrame = false;
    sel("#delay").disabled = true;
    log("Overlay ON - new generation will paint on top of previous one");
});
sel("#clearFrame").addEventListener("change", function () {
    simulation.clearEveryFrame = true;
    simulation.blurEnabled = false;
    sel("#delay").disabled = true;
    log("Clear Frame ON - draw only current generation, erase previous generations");
});
sel("#randCycle").addEventListener("input", function (e) {
    simulation.colorRateFrames = rangeOver(e.target.value, 1000, 1);
    simulation.colorRateCounter = 0;
});
sel("#noiseRangeValue").addEventListener("input", function (e) { return (simulation.noiseRangeValue = rangeOver(e.target.value, 3, 12)); });
// sel("#amp").addEventListener(
//   "input",
//   (e) => (simulation.amp = parseFloat(e.target.value))
// );
sel("#noiseRangeValue").addEventListener("change", function () {
    if (simulation.noiseEnabled) {
        log("Noise (ON) Amount is now 1 in " + simulation.noiseRangeValue.toFixed(2) + " chance of being born");
    }
    else {
        log("Noise (OFF) Amount is now 1 in " + simulation.noiseRangeValue.toFixed(2) + " chace of being born");
    }
});
sel("#noiseOn").addEventListener("change", function () {
    simulation.noiseEnabled = true;
    log("Noise On - cells will be born randomly");
});
sel("#noiseOff").addEventListener("change", function () {
    simulation.noiseEnabled = false;
    log("Noise Off - cells will be born according to game rules only");
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
sel("#gameType").addEventListener("change", function (e) {
    simulation.game = e.target.value;
    log("Game changed to ", gameLink(simulation.game), simulation.game);
});
sel("#prompt").scrollTop = 0;
setInterval(function () {
    var sum = simulation.data.reduce(function (a, b) { return a + b; }, 0);
    sel("#currentCount").value = sum.toString();
}, 250);
var route = function (state) {
    sel("#gameType").value = state.game;
    // TODO: exponential to linear
    // sel("#delay").value = state.alpha.toString();
    // Don't set color in UI
    // sel("").value = state.color;
    sel("#setClickShape").value = state.clickShape;
    sel("#setHoverShape").value = state.hoverShape;
    sel("#colorRadix").value = state.colorRadix.toString();
    sel("#clearFrame").checked = state.blurEnabled;
    sel("#clearFrame").checked = state.clearEveryFrame;
    // TODO: exponential to linear
    // sel("#randCycle").value = state.colorRateFrames;
    sel("#noiseOn").checked = state.noiseEnabled;
    sel("#noiseRangeValue").value = state.noiseRangeValue.toString();
    // TODO: exponential to linear
    // sel("#seedDensity").value = state.seedDensity;
};
