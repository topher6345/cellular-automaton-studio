class GameOfLife {
  size: number;
  data: Uint8Array;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  alpha: number;
  color: string;
  pixelSize: number;
  shape: string;
  colorMode: string;
  colorRadix: number;
  buffer: Uint8Array;

  constructor(size: number, cavnas?: HTMLCanvasElement) {
    this.size = size;
    this.data = GameOfLife.randBoard(this.size);
    this.buffer = new Uint8Array(size * size);

    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");

    this.alpha = 0.006;
    this.color = "orange";
    this.pixelSize = 1;
    this.shape = "gliderse";
    this.colorMode = "picker";
    this.colorRadix = 16777215;
  }

  reset(): void {
    this.data = GameOfLife.randBoard(this.size);
  }

  clear(): void {
    this.data = new Uint8Array(this.size * this.size);
  }

  static rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  static randBoard(size: number): Uint8Array {
    return new Uint8Array(size * size).map((_) => this.rand(0, 2));
  }

  get(x: number, y: number): number {
    return this.data[y * this.size + x];
  }

  set(x: number, y: number, value: number): void {
    this.data[y * this.size + x] = value;
  }

  update() {
    for (let i = 0; i < this.buffer.length; i++) {
      let liveNeighbors = 0;
      let status = 0;
      const row = i % this.size;
      const col = Math.floor(i / this.size);

      // Optimization - check for live neighbors
      // Extracting this led to GC Pressure
      // inlining seems to get better performance
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
        (status = 1);

      this.buffer[i] = status;
    }
    [this.data, this.buffer] = [this.buffer, this.data];
    return 0;
  }

  getMousePos(evt: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      y: Math.floor((evt.clientX - rect.left) / this.pixelSize),
      x: Math.floor((evt.clientY - rect.top) / this.pixelSize),
    };
  }

  hover(e: MouseEvent) {
    const { x, y } = this.getMousePos(e);
    this.set(x, y, 1);
  }

  clickDown(e: MouseEvent) {
    const { x, y } = this.getMousePos(e);

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
  }

  randColor(): string {
    return "#" + Math.floor(Math.random() * this.colorRadix).toString(16);
  }

  draw(blur = true): void {
    if (blur) {
      this.ctx.fillStyle = `rgba(1,1,1,${this.alpha})`;
      this.ctx.fillRect(
        0,
        0,
        this.size * this.pixelSize,
        this.size * this.pixelSize
      );
    }
    if (this.colorMode === "full") {
      this.ctx.fillStyle = this.randColor();
    } else if (this.colorMode === "picker") {
      this.ctx.fillStyle = this.color;
    }

    for (let row = 0; row < this.size; row++) {
      if (this.colorMode === "row") {
        this.ctx.fillStyle = this.randColor();
      }

      for (let col = 0; col < this.size; col++) {
        if (this.get(row, col) === 1) {
          if (this.colorMode === "each") {
            this.ctx.fillStyle = this.randColor();
          }

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

const sel = (s: string): HTMLElement => {
  return document.querySelector(s);
};
const canvas = sel("canvas") as HTMLCanvasElement;
const gameOfLife = new GameOfLife(750, canvas);

let past: number = null;
let ms = 41.666666666666664;
let masterOnOff = false;
function tick(now: number) {
  if (!past) past = now;

  if (!past || (now - past > ms && masterOnOff)) {
    past = now;
    gameOfLife.draw();
    gameOfLife.update();
  }
  window.requestAnimationFrame(tick);
}

window.requestAnimationFrame(tick);

canvas.addEventListener("click", (e) => gameOfLife.clickDown(e), false);

sel("#delay").addEventListener(
  "input",
  (e: InputEvent) => {
    gameOfLife.alpha = parseFloat(e.target.value as any);
  },
  false
);

sel("#color").addEventListener(
  "input",
  (e) => {
    gameOfLife.color = e.target.value as any;

    // redraw if paused so the user can see what colors
    masterOnOff || gameOfLife.draw(false);
  },
  false
);

sel("select").addEventListener("input", (e) => {
  gameOfLife.ctx.globalCompositeOperation = e.target.value as any;
});

sel("#rate").addEventListener(
  "input",
  (e) => {
    ms = e.target.value as any;
  },
  false
);

let isHovering = false;
sel("#hover").addEventListener("change", (e) => {
  isHovering = !isHovering;
});

canvas.addEventListener(
  "mousemove",
  (e) => isHovering && gameOfLife.hover(e),
  false
);

sel("#master").addEventListener(
  "change",
  (e) => (masterOnOff = !masterOnOff),
  false
);

sel("#modal-capture-preview").addEventListener(
  "click",
  (e) => {
    sel("#modal-capture-preview").hidden = true;
  },
  false
);

sel("#screencap").addEventListener("click", (e) => {
  const dataUrl = canvas.toDataURL("image/png");

  const img = new Image();
  img.src = dataUrl;
  img.alt = `CanvasGOL-${Date.now()}`;
  img.title = `
    Right click and select "Save Image As.."
    Left click to exit (all your captures are saved until refresh)
  `;
  sel("#modal-capture").hidden = false;
  sel("#modal-capture-preview").prepend(img as any);
});

sel("#reset").addEventListener("click", (e) => {
  gameOfLife.reset();
});

sel("#clear").addEventListener("click", (e) => {
  gameOfLife.clear();
});

sel("#setShape").addEventListener("change", (e) => {
  gameOfLife.shape = e.target.value as any;
});

sel("#colorMode").addEventListener("change", (e) => {
  gameOfLife.colorMode = e.target.value as any;
  switch (e.target.value as any) {
    case "picker":
      sel("#radix").style.display = "none";
      sel("#picker").style.display = "block";
      break;
    default:
      sel("#radix").style.display = "block";
      sel("#picker").style.display = "none";
  }
});

sel("#colorRadix").addEventListener("input", (e) => {
  gameOfLife.colorRadix = e.target.value as any;
});

sel("#colorRadixReset").addEventListener("click", (e) => {
  gameOfLife.colorRadix = 16777215;
  sel("#colorRadix").value = 16777215;
});

let recorders: MediaRecorder = null;
sel("#record-video").addEventListener("change", (e) => {
  if ((e.target.value as any) === "on") {
    const chunks: BlobPart[] = []; // here we will store our recorded media chunks (Blobs)
    const stream = canvas.captureStream(); // grab our canvas MediaStream
    const rec = new MediaRecorder(stream); // init the recorder
    // every time the recorder has new data, we will store it in our array
    recorders = rec;
    rec.ondataavailable = (e) => chunks.push(e.data);
    // only when the recorder stops, we construct a complete Blob from all the chunks
    rec.onstop = (e) => exportVid(new Blob(chunks, { type: "video/webm" }));

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
  sel("#record").appendChild(a as any);
}
