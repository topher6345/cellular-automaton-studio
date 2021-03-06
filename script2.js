"use strict";
exports.__esModule = true;
var canvas_1 = require("canvas");
var fs = require("fs");
var INIT_CONTROL_VALUES = {
    alpha: 0.006,
    color: "orange",
    clickShape: "gliderse",
    hoverShape: "gliderse",
    colorMode: "full",
    colorRadix: 16777215,
    blurEnabled: false,
    clearEveryFrame: false,
    colorRateFrames: 120,
    noiseEnabled: false,
    noiseRangeValue: 0,
    game: "replicator",
    seedDensity: 1
};
var CellularAutomatonEngine = /** @class */ (function () {
    function CellularAutomatonEngine(size, canvas, controlValues) {
        this.size = size;
        this.pixelSize = 1;
        this.pixelScalar = 1;
        this.data = new Uint8Array(size * size).map(function () { return 0; });
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
        this.color = controlValues.color;
        this.clickShape = controlValues.clickShape;
        this.hoverShape = controlValues.hoverShape;
        this.colorMode = controlValues.colorMode;
        this.colorRadix = controlValues.colorRadix;
        this.colorRateFrames = controlValues.colorRateFrames;
        this.colorRateCounter = 0;
        this.colorCache = this.randColorString();
        this.noiseEnabled = controlValues.noiseEnabled;
        this.noiseRangeValue = controlValues.noiseRangeValue;
        this.game = controlValues.game;
        this.seedDensity = controlValues.seedDensity;
        this.colors = [
            "bfa09f",
            "5e7468",
            "181f1e",
            "c49e5a",
            "9e7c7a",
            "a9908f",
            "2f3d37",
            "5a5b5e",
            "786e4c",
            "b09f7e",
            "23302f",
            "424232",
        ];
        this.colorLength = this.colors.length;
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
            switch (this.game) {
                case "famine":
                    ( // S6789
                    (alive && (liveNeighbors > 5) || spontaneousBirth)) && (status_1 = 1);
                    break;
                case "anneal":
                    ( // S35678
                    ( // B4678
                    (alive && (liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8) || (liveNeighbors === 4 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8)))) && (status_1 = 1);
                    break;
                case "morley":
                    ( // S245
                    ( // B368
                    (alive && (liveNeighbors === 2 || liveNeighbors === 4 || liveNeighbors === 5) || (liveNeighbors === 3 || liveNeighbors === 6 || liveNeighbors === 8)))) && (status_1 = 1);
                    break;
                case "day&night":
                    ( // S34678
                    ( // B3678
                    (alive && (liveNeighbors === 3 || liveNeighbors === 4 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8) || (liveNeighbors === 3 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8)))) && (status_1 = 1);
                    break;
                case "2x2":
                    ( // S125
                    ( // B36
                    (alive && (liveNeighbors === 1 || liveNeighbors === 2 || liveNeighbors === 5) || (liveNeighbors === 3 || liveNeighbors === 6)))) && (status_1 = 1);
                    break;
                case "diamoeba":
                    ( // S5678
                    ( // B35678
                    (alive && (liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8) || (liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8)))) && (status_1 = 1);
                    break;
                case "34life":
                    ( // S34
                    ((alive && (liveNeighbors === 3 || liveNeighbors === 4)) ||
                        // B34
                        (liveNeighbors === 3 || liveNeighbors === 4) || spontaneousBirth)) && (status_1 = 1);
                    break;
                case "B25/S4":
                    ( // S4
                    ( // B25
                    (alive && (liveNeighbors === 4) || (liveNeighbors === 2 || liveNeighbors === 5)))) && (status_1 = 1);
                    break;
                case "seeds":
                    ( // S
                    ( // B2
                    (alive || liveNeighbors === 2))) && (status_1 = 1);
                    break;
                case "replicator":
                    ( // S1357
                    ( // B1357
                    (alive && (liveNeighbors === 1 || liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 7) || (liveNeighbors === 1 || liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 7)))) && (status_1 = 1);
                    break;
                case "highlife":
                    ( // S23
                    ( // B36
                    (alive && (liveNeighbors === 2 || liveNeighbors === 3) || (liveNeighbors === 3 || liveNeighbors === 6)))) && (status_1 = 1);
                    break;
                case "life":
                    ( // A23
                    (alive && (liveNeighbors === 2 || liveNeighbors === 3) || // B3
                        liveNeighbors === 3)) && (status_1 = 1);
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
        return "#" + this.colors[Math.floor(Math.random() * this.colorLength)];
    };
    CellularAutomatonEngine.prototype.draw = function (isAnimating) {
        if (isAnimating === void 0) { isAnimating = true; }
        if (isAnimating) {
            this.ctx.fillStyle = "rgba(1,1,1,0)";
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
var SIMULATION_SIZE = 1000;
var canvas = canvas_1.createCanvas(SIMULATION_SIZE, SIMULATION_SIZE);
var simulation = new CellularAutomatonEngine(SIMULATION_SIZE, canvas, INIT_CONTROL_VALUES);
var writeFile = function (canvas) {
    // console.log(" writing File...");
    fs.writeFileSync("CellularAnimationStudio-" + Date.now() + ".png", canvas.toBuffer("image/png"));
};
var cliProgress = require("cli-progress");
// create a new progress bar instance and use shades_classic theme
var progress = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
var TOTAL_FRAMES = 90000;
// start the progress bar with a total value of 200 and start value of 0
progress.start(TOTAL_FRAMES, 0);
var random = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};
simulation.set(random(0, 1000), random(0, 1000), 1);
for (var index = 0; index < TOTAL_FRAMES; index++) {
    simulation.draw(true);
    simulation.update();
    progress.update(index);
    if (index % 1000 === 0) {
        simulation.seedDensity = 45;
        simulation.kill();
        simulation.set(random(0, 1000), random(0, 1000), 1);
    }
    if (index % 300 === 0) {
        writeFile(canvas);
    }
}
writeFile(canvas);
progress.stop();
