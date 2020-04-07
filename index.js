var GameOfLife = /** @class */ (function () {
    function GameOfLife(size, cavnas) {
        this.size = size;
        this.data = GameOfLife.randBoard(this.size);
        this.buffer = new Uint8Array(size * size);
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = true;
        this.alpha = 0.006;
        this.blurEnabled = true;
        this.clearEveryFrame = false;
        this.color = "orange";
        this.pixelSize = 1;
        this.shape = "gliderse";
        this.colorMode = "picker";
        this.colorRadix = 16777215;
        this.ctx.fillStyle = "rgba(0,0,0,1)";
        this.ctx.fillRect(0, 0, this.size * this.pixelSize, this.size * this.pixelSize);
        this.colorRateFps = 1000;
        this.colorRateCounter = 0;
        this.colorCache = this.randColorString();
    }
    GameOfLife.prototype.reset = function () {
        this.data = GameOfLife.randBoard(this.size);
    };
    GameOfLife.prototype.clear = function () {
        this.data = new Uint8Array(this.size * this.size);
    };
    GameOfLife.rand = function (min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    };
    GameOfLife.randBoard = function (size) {
        var _this = this;
        return new Uint8Array(size * size).map(function (_) { return _this.rand(0, 2); });
    };
    GameOfLife.prototype.get = function (x, y) {
        return this.data[y * this.size + x];
    };
    GameOfLife.prototype.set = function (x, y, value) {
        this.data[y * this.size + x] = value;
    };
    GameOfLife.prototype.update = function () {
        for (var i = 0; i < this.buffer.length; i++) {
            var liveNeighbors = 0;
            var status_1 = 0;
            var row = i % this.size;
            var col = Math.floor(i / this.size);
            // Optimization - check for live neighbors
            // Extracting this led to GC Pressure
            // inlining seemsPerFrame to get better performance
            this.get(row - 1, col - 1) && liveNeighbors++;
            this.get(row, col - 1) && liveNeighbors++;
            this.get(row + 1, col - 1) && liveNeighbors++;
            this.get(row - 1, col) && liveNeighbors++;
            this.get(row + 1, col) && liveNeighbors++;
            this.get(row - 1, col + 1) && liveNeighbors++;
            this.get(row, col + 1) && liveNeighbors++;
            this.get(row + 1, col + 1) && liveNeighbors++;
            ((this.get(row, col) && (liveNeighbors === 2 || liveNeighbors === 3)) ||
                liveNeighbors === 3) &&
                (status_1 = 1);
            this.buffer[i] = status_1;
        }
        _a = [this.buffer, this.data], this.data = _a[0], this.buffer = _a[1];
        return 0;
        var _a;
    };
    GameOfLife.prototype.getMousePos = function (evt) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            y: Math.floor((evt.clientX - rect.left) / this.pixelSize),
            x: Math.floor((evt.clientY - rect.top) / this.pixelSize)
        };
    };
    GameOfLife.prototype.hover = function (e) {
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
    GameOfLife.prototype.clickDown = function (e) {
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
    GameOfLife.prototype.randColor = function () {
        if (this.colorRateCounter > this.colorRateFps) {
            debugger;
            this.colorCache = this.randColorString();
            this.colorRateCounter = 0;
        }
        this.colorRateCounter = this.colorRateCounter + 1;
        return this.colorCache;
    };
    GameOfLife.prototype.randColorString = function () {
        return "#" + Math.floor(Math.random() * this.colorRadix).toString(16);
    };
    GameOfLife.prototype.draw = function (blur) {
        if (blur === void 0) { blur = true; }
        if (blur) {
            this.ctx.fillStyle = "rgba(1,1,1," + this.alpha + ")";
            this.ctx.fillRect(0, 0, this.size * this.pixelSize, this.size * this.pixelSize);
        }
        if (this.clearEveryFrame)
            this.ctx.clearRect(0, 0, this.size * this.pixelSize, this.size * this.pixelSize);
        if (this.colorMode === "full") {
            this.ctx.fillStyle = this.randColor();
        }
        else if (this.colorMode === "picker") {
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
    return GameOfLife;
}());
var sel = function (s) {
    return document.querySelector(s);
};
var canvas = sel("canvas");
var gameOfLife = new GameOfLife(750, canvas);
var msPast = null;
var msPerFrame = 41.666666666666664;
var masterOnOff = false;
function tick(now) {
    if (!msPast)
        msPast = now;
    if (!msPast || (now - msPast > msPerFrame && masterOnOff)) {
        msPast = now;
        gameOfLife.draw(gameOfLife.blurEnabled);
        gameOfLife.update();
    }
    window.requestAnimationFrame(tick);
}
window.requestAnimationFrame(tick);
canvas.addEventListener("click", function (e) { return gameOfLife.clickDown(e); }, false);
sel("#delay").addEventListener("input", function (e) {
    gameOfLife.alpha = parseFloat(e.target.value);
}, false);
sel("#color").addEventListener("input", function (e) {
    gameOfLife.color = e.target.value;
    // redraw if paused so the user can see what colors
    masterOnOff || gameOfLife.draw(false);
}, false);
sel("select").addEventListener("input", function (e) {
    var currentState = masterOnOff;
    if (currentState)
        masterOnOff = false;
    gameOfLife.ctx.globalCompositeOperation = e.target.value;
    masterOnOff = currentState;
});
sel("#rate").addEventListener("input", function (e) {
    msPerFrame = e.target.value;
}, false);
var isHovering = false;
sel("#hover").addEventListener("change", function (e) {
    isHovering = !isHovering;
});
canvas.addEventListener("mousemove", function (e) { return isHovering && gameOfLife.hover(e); }, false);
sel("#master").addEventListener("change", function (e) { return (masterOnOff = !masterOnOff); }, false);
sel("#modal-capture-preview").addEventListener("click", function (e) {
    sel("#modal-capture-preview").hidden = true;
}, false);
sel("#screencap").addEventListener("click", function (e) {
    var dataUrl = canvas.toDataURL("image/png");
    var img = new Image();
    img.src = dataUrl;
    img.alt = "CanvasGOL-" + Date.now();
    img.title = "\n    Right click and select \"Save Image As..\"\n    Left click to exit (all your captures are saved until refresh)\n  ";
    sel("#modal-capture").hidden = false;
    sel("#modal-capture-preview").prepend(img);
});
sel("#reset").addEventListener("click", function (e) {
    gameOfLife.reset();
});
sel("#clear").addEventListener("click", function (e) {
    gameOfLife.clear();
});
sel("#setShape").addEventListener("change", function (e) {
    gameOfLife.shape = e.target.value;
});
sel("#colorMode").addEventListener("change", function (e) {
    gameOfLife.colorMode = e.target.value;
    switch (e.target.value) {
        case "picker":
            sel("#radix").style.display = "none";
            sel("#picker").style.display = "block";
            break;
        default:
            sel("#radix").style.display = "block";
            sel("#picker").style.display = "none";
    }
});
sel("#colorRadix").addEventListener("input", function (e) {
    gameOfLife.colorRadix = e.target.value;
});
sel("#colorRadixReset").addEventListener("click", function (e) {
    gameOfLife.colorRadix = 16777215;
    sel("#colorRadix").value = 16777215;
});
var recorders = null;
sel("#record-video").addEventListener("change", function (e) {
    if (e.target.value === "on") {
        var chunks_1 = []; // here we will store our recorded media chunks (Blobs)
        var stream = canvas.captureStream(); // grab our canvas MediaStream
        var rec_1 = new MediaRecorder(stream); // init the recorder
        // every time the recorder has new data, we will store it in our array
        recorders = rec_1;
        rec_1.ondataavailable = function (e) { return chunks_1.push(e.data); };
        // only when the recorder stops, we construct a complete Blob from all the chunks
        rec_1.onstop = function (e) { return exportVid(new Blob(chunks_1, { type: "video/webm" })); };
        rec_1.start();
        setTimeout(function () { return rec_1.stop(); }, 30000); // stop recording in 30s
    }
    else {
        recorders.stop();
    }
});
function exportVid(blob) {
    var vid = document.createElement("video");
    vid.src = URL.createObjectURL(blob);
    vid.controls = true;
    document.body.appendChild(vid);
    var a = document.createElement("a");
    a.download = "myvid.webm";
    a.href = vid.src;
    a.textContent = "download the video";
    sel("#record").appendChild(a);
}
sel("#blurEnabled").addEventListener("change", function (e) {
    gameOfLife.blurEnabled = e.target.checked;
});
sel("#clearFrame").addEventListener("change", function (e) {
    gameOfLife.clearEveryFrame = e.target.checked;
});
sel("#randCycle").addEventListener("input", function (e) {
    gameOfLife.colorRateFps = parseInt(e.target.value);
    gameOfLife.colorRateCounter = 0;
});
