class GameOfLife {
  size: any;
  data: number[][];
  canvas: HTMLCanvasElement;
  ctx: any;
  alpha: number;
  color: string;
  pixelSize: number;
  shape: string;
  colorMode: string;
  colorRadix: number;

  constructor(size: number, cavnas?: HTMLCanvasElement) {
    this.size = size;
    this.data = this.blankBoard(this.size);
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");

    this.alpha = 0.006;
    this.color = "orange";
    this.pixelSize = 1;
    this.shape = "gliderse";
    this.colorMode = "picker";
    this.colorRadix = 16777215;
  }

  reset() {
    this.data = this.blankBoard(this.size);
  }

  rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  blankBoard(size: number): number[][] {
    const rows: number[][] = [];
    let columns = [];
    let val = 0;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        val = this.rand(0, 2);
        columns.push(val);
      }
      rows.push(columns);
      columns = [];
    }

    return rows;
  }

  neighborLocationsFor(x: number, y: number): number[][][] {
    return [
      [
        [x - 1, y - 1],
        [x, y - 1],
        [x + 1, y - 1]
      ],
      [
        [x - 1, y],
        [x, y],
        [x + 1, y]
      ],
      [
        [x - 1, y + 1],
        [x, y + 1],
        [x + 1, y + 1]
      ]
    ];
  }

  neighborValues(x: number, y: number) {
    return [
      [this.get(x - 1, y - 1), this.get(x, y - 1), this.get(x + 1, y - 1)],
      [this.get(x - 1, y), this.get(x, y), this.get(x + 1, y)],
      [this.get(x - 1, y + 1), this.get(x, y + 1), this.get(x + 1, y + 1)]
    ];
  }

  get(x: number, y: number) {
    return this.data[Math.abs(x % this.size)][Math.abs(y % this.size)];
  }

  set(x: number, y: number, value: number) {
    this.data[Math.abs(x % this.size)][Math.abs(y % this.size)] = value;
    return 0;
  }

  liveNeighbors(x: number, y: number): number {
    let count = 0;
    const values = this.neighborValues(x, y);
    for (var row = 0; row < values.length; row++) {
      for (var col = 0; col < values.length; col++) {
        if (row === 1 && col === 1) {
        } else {
          if (values[row][col] === 1) {
            count++;
          }
        }
      }
    }
    return count;
  }

  update() {
    const newGame = new GameOfLife(this.size);
    newGame.data = this.blankBoard(this.size);
    let liveNeighbors: number;

    for (var row = 0; row < this.data.length; row++) {
      for (var col = 0; col < this.data.length; col++) {
        liveNeighbors = this.liveNeighbors(row, col);

        if (this.data[row][col] === 1) {
          // IF ALIVE
          if (liveNeighbors < 2) {
            newGame.set(row, col, 0);
          } else if (liveNeighbors === 2 || liveNeighbors === 3) {
            newGame.set(row, col, 1);
          } else if (liveNeighbors > 3) {
            newGame.set(row, col, 0);
          }
        } else {
          // IF DEAD
          if (liveNeighbors === 3) {
            newGame.set(row, col, 1);
          } else {
            newGame.set(row, col, 0);
          }
        }
      }
    }
    this.data = newGame.data;
    return 0;
  }

  getMousePos(evt: MouseEvent) {
    var rect = this.canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  click(e: MouseEvent) {
    const pos = this.getMousePos(e);
    const x = Math.floor(pos.x / 3);
    const y = Math.floor(pos.y / 3);
    this.set(y, x, 1);
  }

  clickDown(e: MouseEvent) {
    const pos = this.getMousePos(e);
    const x = Math.floor(pos.x / this.pixelSize);
    const y = Math.floor(pos.y / this.pixelSize);

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
  }

  inspect(blur = true) {
    if (blur) {
      this.ctx.fillStyle = `rgba(1,1,1,${this.alpha})`;
      this.ctx.fillRect(
        0,
        0,
        this.size * this.pixelSize,
        this.size * this.pixelSize
      );
    }
    let color;

    if (this.colorMode === "full") {
      color = "#" + Math.floor(Math.random() * this.colorRadix).toString(16);
    } else if (this.colorMode === "picker") {
      color = this.color;
    }

    for (var row = 0; row < this.data.length; row++) {
      if (this.colorMode === "row") {
        color = "#" + Math.floor(Math.random() * this.colorRadix).toString(16);
      }

      for (var col = 0; col < this.data.length; col++) {
        if (this.data[row][col] === 1) {
          // this.ctx.fillStyle = this.color;
          if (this.colorMode === "each") {
            color =
              "#" + Math.floor(Math.random() * this.colorRadix).toString(16);
          }

          this.ctx.fillStyle = color;
          this.ctx.fillRect(
            col * this.pixelSize,
            row * this.pixelSize,
            this.pixelSize,
            this.pixelSize
          );
        }
      }
    }
  }
}

const canvas = document.querySelector("canvas");
const gameOfLife = new GameOfLife(750, canvas);

let past: number = null;

let ms = 41.666666666666664;

let masterOnOff = false;
function tick(now: number) {
  if (!past) past = now;

  if (!past || (now - past > ms && masterOnOff)) {
    past = now;
    gameOfLife.inspect();
    gameOfLife.update();
  }
  window.requestAnimationFrame(tick);
}

window.requestAnimationFrame(tick);

canvas.addEventListener("click", e => gameOfLife.clickDown(e), false);

const slider = document.querySelector("#delay");

slider.addEventListener(
  "input",
  (e: InputEvent) => {
    gameOfLife.alpha = parseFloat(e.target.value as any);
  },
  false
);

document.querySelector("#color").addEventListener(
  "input",
  e => {
    gameOfLife.color = e.target.value as any;

    // redraw if paused so the user can see what colors
    masterOnOff || gameOfLife.inspect(false);
  },
  false
);

// document.querySelector("select").addEventListener("input", (e) => {
//   gameOfLife.ctx.globalCompositeOperation = e.target.value;
// });

document.querySelector("#rate").addEventListener(
  "input",
  e => {
    ms = e.target.value as any;
  },
  false
);

let isHovering = false;
document.querySelector("#hover").addEventListener("change", e => {
  isHovering = !isHovering;
});

canvas.addEventListener(
  "mousemove",
  e => isHovering && gameOfLife.click(e),
  false
);

document
  .querySelector("#master")
  .addEventListener("change", e => (masterOnOff = !masterOnOff), false);

document
  .querySelector("#modal-capture-preview")
  .addEventListener("click", e => {
    document.querySelector("#modal-capture-preview").hidden = true;
  });

document.querySelector("#screencap").addEventListener("click", e => {
  var dataUrl = canvas.toDataURL("image/png");

  var img = new Image();
  img.src = dataUrl;
  img.alt = `CanvasGOL-${Date.now()}`;
  img.title = `
    Right click and select "Save Image As.."
    Left click to exit (all your captures are saved until refresh)
  `;
  document.querySelector("#modal-capture").hidden = false;
  document.querySelector("#modal-capture-preview").prepend(img as any);
});

document.querySelector("#reset").addEventListener("click", e => {
  gameOfLife.reset();
});

document.querySelector("#setShape").addEventListener("change", e => {
  gameOfLife.shape = e.target.value as any;
});

document.querySelector("#colorMode").addEventListener("change", e => {
  gameOfLife.colorMode = e.target.value as any;
  switch (e.target.value as any) {
    case "picker":
      document.querySelector("#radix").style.display = "none";
      document.querySelector("#picker").style.display = "block";
      break;
    default:
      document.querySelector("#radix").style.display = "block";
      document.querySelector("#picker").style.display = "none";
  }
});

document.querySelector("#colorRadix").addEventListener("input", e => {
  gameOfLife.colorRadix = e.target.value as any;
});

document.querySelector("#colorRadixReset").addEventListener("click", e => {
  gameOfLife.colorRadix = 16777215;
  document.querySelector("#colorRadix").value = 16777215;
});

let recorders: MediaRecorder = null;
document.querySelector("#record-video").addEventListener("change", e => {
  if ((e.target.value as any) === "on") {
    const chunks: BlobPart[] = []; // here we will store our recorded media chunks (Blobs)
    const stream = canvas.captureStream(); // grab our canvas MediaStream
    const rec = new MediaRecorder(stream); // init the recorder
    // every time the recorder has new data, we will store it in our array
    recorders = rec;
    rec.ondataavailable = e => chunks.push(e.data);
    // only when the recorder stops, we construct a complete Blob from all the chunks
    rec.onstop = e => exportVid(new Blob(chunks, { type: "video/webm" }));

    rec.start();
    setTimeout(() => rec.stop(), 30000); // stop recording in 30s
  } else {
    recorders.stop();
  }
});

function exportVid(blob: Blob) {
  const vid = document.createElement("video");
  vid.src = URL.createObjectURL(blob);
  vid.controls = true;
  document.body.appendChild(vid as any);
  const a = document.createElement("a");
  a.download = "myvid.webm";
  a.href = vid.src;
  a.textContent = "download the video";
  document.querySelector("#record").appendChild(a as any);
}
