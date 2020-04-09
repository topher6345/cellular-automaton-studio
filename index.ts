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
  blurEnabled: boolean;
  clearEveryFrame: boolean;
  colorRateFps: number;
  colorCache: string;
  colorRateCounter: number;
  spontaneousRegeneration: boolean;
  noiseRangeValue: number;

  constructor(size: number, cavnas?: HTMLCanvasElement) {
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
    this.colorMode = "full";
    this.colorRadix = 16777215;
    this.ctx.fillStyle = `rgba(0,0,0,1)`;
    this.ctx.fillRect(
      0,
      0,
      this.size * this.pixelSize,
      this.size * this.pixelSize
    );

    this.colorRateFps = 100;
    this.colorRateCounter = 0;
    this.colorCache = this.randColorString();
    this.spontaneousRegeneration = false;
    this.noiseRangeValue = 0;
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
      // inlining seemsPerFrame to get better performance
      this.get(row - 1, col - 1) && liveNeighbors++;
      this.get(row, col - 1) && liveNeighbors++;
      this.get(row + 1, col - 1) && liveNeighbors++;
      this.get(row - 1, col) && liveNeighbors++;
      this.get(row + 1, col) && liveNeighbors++;
      this.get(row - 1, col + 1) && liveNeighbors++;
      this.get(row, col + 1) && liveNeighbors++;
      this.get(row + 1, col + 1) && liveNeighbors++;

      // prettier-ignore
      ( // Alive and 2-3 live neighbors
        (this.get(row, col) && (liveNeighbors === 2 || liveNeighbors === 3)) ||
        // Dead and 3 live neighbors
        liveNeighbors === 3 ||
        // spontaneous generation
        (this.spontaneousRegeneration && (
          GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
        )
      ) && (status = 1);

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
    if (this.colorRateCounter > this.colorRateFps) {
      this.colorCache = this.randColorString();
      this.colorRateCounter = 0;
    }
    this.colorRateCounter = this.colorRateCounter + 1;
    return this.colorCache;
  }
  randColorString(): string {
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

    if (this.clearEveryFrame)
      this.ctx.clearRect(
        0,
        0,
        this.size * this.pixelSize,
        this.size * this.pixelSize
      );

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

let msPast: number = null;
let msPerFrame: number = 41.666666666666664;
let masterOnOff: boolean = true;

function tick(now: number) {
  if (!msPast) msPast = now;

  if (!msPast || (now - msPast > msPerFrame && masterOnOff)) {
    msPast = now;
    gameOfLife.draw(gameOfLife.blurEnabled);
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
  const currentState = masterOnOff;
  if (currentState) masterOnOff = false;
  gameOfLife.ctx.globalCompositeOperation = e.target.value as any;

  masterOnOff = currentState;
});

sel("#rate").addEventListener(
  "input",
  (e) => {
    msPerFrame = e.target.value as any;
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
    sel("#modal-capture ").style.display = "none";
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

  const a = document.createElement("a");
  a.href = dataUrl;
  a.append(img as any);
  a.download = `CanvasGOL-${Date.now()}.png`;
  sel("#modal-capture").style.display = "flex";
  sel("#modal-capture-preview").prepend(a as any);
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
    setTimeout(() => recorders && recorders.stop(), 30000); // stop recording in 30s
  } else {
    recorders.stop();
    recorders = null;
  }
});

function exportVid(blob: Blob) {
  const vid = document.createElement("video");
  vid.src = URL.createObjectURL(blob);
  vid.controls = true;
  sel("#modal-capture-preview").prepend(vid as any);
}

sel("#blurEnabled").addEventListener("change", (e) => {
  gameOfLife.blurEnabled = (e.target as any).checked as any;
});

sel("#clearFrame").addEventListener("change", (e) => {
  gameOfLife.clearEveryFrame = (e.target as any).checked as any;
});

sel("#randCycle").addEventListener("input", (e) => {
  gameOfLife.colorRateFps = parseInt((e.target as any).value as any);
  gameOfLife.colorRateCounter = 0;
});

sel("#noiseRangeValue").addEventListener("input", (e) => {
  gameOfLife.noiseRangeValue = parseInt((e.target as any).value as any);
});

sel("#noiseEnabled").addEventListener("change", (e) => {
  gameOfLife.spontaneousRegeneration = (e.target as any).checked as any;
});
