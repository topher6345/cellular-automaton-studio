var GameOfLife = /** @class */ (function () {
    function GameOfLife(size, cavnas) {
        this.size = size;
        this.data = GameOfLife.blankBoard(this.size);
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.alpha = 0.006;
        this.color = "orange";
        this.pixelSize = 1;
        this.shape = "gliderse";
        this.colorMode = "picker";
        this.colorRadix = 16777215;
    }
    GameOfLife.prototype.reset = function () {
        this.data = GameOfLife.blankBoard(this.size);
    };
    GameOfLife.rand = function (min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    };
    GameOfLife.blankBoard = function (size) {
        var _this = this;
        return new Uint8Array(size * size).map(function (_) { return _this.rand(0, 2); });
    };
    GameOfLife.prototype.neighborValues = function (x, y) {
        return [
            this.get(x - 1, y - 1),
            this.get(x, y - 1),
            this.get(x + 1, y - 1),
            this.get(x - 1, y),
            this.get(x + 1, y),
            this.get(x - 1, y + 1),
            this.get(x, y + 1),
            this.get(x + 1, y + 1)
        ];
    };
    GameOfLife.prototype.get = function (x, y) {
        return this.data[y * this.size + x];
    };
    GameOfLife.prototype.set = function (x, y, value) {
        this.data[y * this.size + x] = value;
        return 0;
    };
    GameOfLife.prototype.liveNeighbors = function (x, y) {
        return this.neighborValues(x, y).filter(function (value) { return value === 1; }).length;
    };
    GameOfLife.prototype.alive = function (row, col) {
        var liveNeighbors = this.liveNeighbors(row, col);
        if (this.get(row, col) === 1) {
            // IF ALIVE
            if (liveNeighbors < 2) {
                return 0;
            }
            else if (liveNeighbors === 2 || liveNeighbors === 3) {
                return 1;
            }
            else if (liveNeighbors > 3) {
                return 0;
            }
        }
        else {
            // IF DEAD
            if (liveNeighbors === 3) {
                return 1;
            }
            else {
                return 0;
            }
        }
    };
    GameOfLife.prototype.update = function () {
        var newGame = new GameOfLife(this.size);
        for (var row = 0; row < this.size; row++) {
            for (var col = 0; col < this.size; col++) {
                newGame.set(row, col, this.alive(row, col));
            }
        }
        this.data = newGame.data;
        return 0;
    };
    GameOfLife.prototype.getMousePos = function (evt) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };
    GameOfLife.prototype.click = function (e) {
        var pos = this.getMousePos(e);
        var x = Math.floor(pos.x / 3);
        var y = Math.floor(pos.y / 3);
        this.set(y, x, 1);
    };
    GameOfLife.prototype.clickDown = function (e) {
        var pos = this.getMousePos(e);
        var x = Math.floor(pos.x / this.pixelSize);
        var y = Math.floor(pos.y / this.pixelSize);
        // Glider SE
        switch (this.shape) {
            case "gliderse":
                this.set(y - 1, x, 1);
                this.set(y, x + 1, 1);
                this.set(y + 1, x - 1, 1);
                this.set(y + 1, x, 1);
                this.set(y + 1, x + 1, 1);
                break;
            case "3x3":
            default:
                this.set(y - 1, x - 1, 1);
                this.set(y - 1, x, 1);
                this.set(y - 1, x + 1, 1);
                this.set(y, x - 1, 1);
                this.set(y, x, 1);
                this.set(y, x + 1, 1);
                this.set(y - 1, x - 1, 1);
                this.set(y - 1, x, 1);
                this.set(y - 1, x + 1, 1);
        }
    };
    GameOfLife.prototype.inspect = function (blur) {
        if (blur === void 0) { blur = true; }
        if (blur) {
            this.ctx.fillStyle = "rgba(1,1,1," + this.alpha + ")";
            this.ctx.fillRect(0, 0, this.size * this.pixelSize, this.size * this.pixelSize);
        }
        var color;
        if (this.colorMode === "full") {
            color = "#" + Math.floor(Math.random() * this.colorRadix).toString(16);
        }
        else if (this.colorMode === "picker") {
            color = this.color;
        }
        for (var row = 0; row < this.size; row++) {
            if (this.colorMode === "row") {
                color = "#" + Math.floor(Math.random() * this.colorRadix).toString(16);
            }
            for (var col = 0; col < this.size; col++) {
                if (this.get(row, col) === 1) {
                    if (this.colorMode === "each") {
                        color =
                            "#" + Math.floor(Math.random() * this.colorRadix).toString(16);
                    }
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(col * this.pixelSize, row * this.pixelSize, this.pixelSize, this.pixelSize);
                }
            }
        }
    };
    return GameOfLife;
}());
var canvas = document.querySelector("canvas");
var gameOfLife = new GameOfLife(750, canvas);
var past = null;
var ms = 41.666666666666664;
var masterOnOff = false;
function tick(now) {
    if (!past)
        past = now;
    if (!past || (now - past > ms && masterOnOff)) {
        past = now;
        gameOfLife.inspect();
        gameOfLife.update();
    }
    window.requestAnimationFrame(tick);
}
window.requestAnimationFrame(tick);
canvas.addEventListener("click", function (e) { return gameOfLife.clickDown(e); }, false);
var slider = document.querySelector("#delay");
slider.addEventListener("input", function (e) {
    gameOfLife.alpha = parseFloat(e.target.value);
}, false);
document.querySelector("#color").addEventListener("input", function (e) {
    gameOfLife.color = e.target.value;
    // redraw if paused so the user can see what colors
    masterOnOff || gameOfLife.inspect(false);
}, false);
// document.querySelector("select").addEventListener("input", (e) => {
//   gameOfLife.ctx.globalCompositeOperation = e.target.value;
// });
document.querySelector("#rate").addEventListener("input", function (e) {
    ms = e.target.value;
}, false);
var isHovering = false;
document.querySelector("#hover").addEventListener("change", function (e) {
    isHovering = !isHovering;
});
canvas.addEventListener("mousemove", function (e) { return isHovering && gameOfLife.click(e); }, false);
document
    .querySelector("#master")
    .addEventListener("change", function (e) { return (masterOnOff = !masterOnOff); }, false);
document
    .querySelector("#modal-capture-preview")
    .addEventListener("click", function (e) {
    document.querySelector("#modal-capture-preview").hidden = true;
});
document.querySelector("#screencap").addEventListener("click", function (e) {
    var dataUrl = canvas.toDataURL("image/png");
    var img = new Image();
    img.src = dataUrl;
    img.alt = "CanvasGOL-" + Date.now();
    img.title = "\n    Right click and select \"Save Image As..\"\n    Left click to exit (all your captures are saved until refresh)\n  ";
    document.querySelector("#modal-capture").hidden = false;
    document.querySelector("#modal-capture-preview").prepend(img);
});
document.querySelector("#reset").addEventListener("click", function (e) {
    gameOfLife.reset();
});
document.querySelector("#setShape").addEventListener("change", function (e) {
    gameOfLife.shape = e.target.value;
});
document.querySelector("#colorMode").addEventListener("change", function (e) {
    gameOfLife.colorMode = e.target.value;
    switch (e.target.value) {
        case "picker":
            document.querySelector("#radix").style.display = "none";
            document.querySelector("#picker").style.display = "block";
            break;
        default:
            document.querySelector("#radix").style.display = "block";
            document.querySelector("#picker").style.display = "none";
    }
});
document.querySelector("#colorRadix").addEventListener("input", function (e) {
    gameOfLife.colorRadix = e.target.value;
});
document.querySelector("#colorRadixReset").addEventListener("click", function (e) {
    gameOfLife.colorRadix = 16777215;
    document.querySelector("#colorRadix").value = 16777215;
});
var recorders = null;
document.querySelector("#record-video").addEventListener("change", function (e) {
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
    document.querySelector("#record").appendChild(a);
}
