"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var canvas_1 = require("canvas");
var fs = require("fs");
var hsluv = require("hsluv");
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
    CellularAutomatonEngine.prototype.set3 = function (x, y, value) {
        this.set(x + 1, y - 1, 1);
        this.set(x + 1, y, 1);
        this.set(x + 1, y + 1, 1);
        this.set(x, y - 1, 1);
        this.set(x, y, 1);
        this.set(x, y + 1, 1);
        this.set(x - 1, y - 1, 1);
        this.set(x - 1, y, 1);
        this.set(x - 1, y + 1, 1);
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
    CellularAutomatonEngine.prototype.draw = function (isAnimating, fillStyle) {
        if (isAnimating === void 0) { isAnimating = true; }
        if (isAnimating) {
            this.ctx.fillStyle = "rgba(1,1,1,".concat(this.alpha, ")");
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
var SIMULATION_SIZE = 1000;
var canvas = (0, canvas_1.createCanvas)(SIMULATION_SIZE, SIMULATION_SIZE);
var simulation = new CellularAutomatonEngine(SIMULATION_SIZE, canvas, {
    alpha: 0.00095,
    blurEnabled: true,
    clearEveryFrame: false,
    gameType: "replicator",
    seedDensity: 1
});
var writeFile = function (canvas) {
    // console.log(" writing File...");
    fs.writeFileSync("CellularAnimationStudio-".concat(Date.now(), ".png"), canvas.toBuffer("image/png"));
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
simulation.set3(random(0, 1000), random(0, 1000), 1);
simulation.set3(random(0, 1000), random(0, 1000), 1);
var hue = 180;
var saturation = 70;
var color = "";
for (var index = 0; index < TOTAL_FRAMES; index++) {
    if (index % 200 === 0) {
        hue = Math.abs((hue + random(-12, 12)) % 360);
        saturation = Math.abs((hue + random(-4, 4)) % 100);
        color = __spreadArray([
            "#"
        ], hsluv
            .hsluvToRgb([hue, saturation, 50.0])
            .map(function (e) { return Math.round(e * 255.0); })
            .map(function (e) { return e.toString(16); }), true).join("");
    }
    simulation.draw(true, color);
    simulation.update();
    progress.update(index);
    if (index % 400 === 0) {
        simulation.seedDensity = 45;
        simulation.kill();
        simulation.set3(random(0, 1000), random(0, 1000), 1);
        simulation.set3(random(0, 1000), random(0, 1000), 1);
        simulation.ctx.globalCompositeOperation =
            simulation.ctx.globalCompositeOperation === "difference"
                ? "source-over"
                : "difference";
    }
    if (index % 100 === 0) {
        writeFile(canvas);
    }
}
writeFile(canvas);
progress.stop();
