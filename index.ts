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
  pixelScalar: number;
  bufferLength: number;
  mode: string;

  constructor(size: number, canvas?: HTMLCanvasElement) {
    this.size = size;
    this.pixelSize = 1;
    this.pixelScalar = 1;
    this.data = GameOfLife.randBoard(this.size);
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
    this.ctx.fillStyle = `rgba(0,0,0,1)`;
    this.ctx.fillRect(
      0,
      0,
      this.size * this.pixelSize,
      this.size * this.pixelSize
    );

    this.colorRateFps = 120;
    this.colorRateCounter = 0;
    this.colorCache = this.randColorString();
    this.spontaneousRegeneration = false;
    this.noiseRangeValue = 0;
    this.mode = "life";
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

  set(x: number, y: number, value: number): void {
    this.data[y * this.size + x] = value;
  }

  get(x: number, y: number): number {
    const size = this.size;
    const yy = y < 0 ? size + y : y % size;
    const xx = x < 0 ? size + x : x % size;
    return this.data[yy * size + xx];
  }

  update() {
    for (let i = 0; i < this.buffer.length; i++) {
      let liveNeighbors = 0;
      let status = 0;
      const row = i % this.size;
      const col = Math.floor(i / this.size);

      // Optimization - check for live neighbors
      // An array-based algorithm led to GC Pressure and low frame rate
      this.get(row - 1, col - 1) && liveNeighbors++;
      this.get(row, col - 1) && liveNeighbors++;
      this.get(row + 1, col - 1) && liveNeighbors++;
      this.get(row - 1, col) && liveNeighbors++;
      this.get(row + 1, col) && liveNeighbors++;
      this.get(row - 1, col + 1) && liveNeighbors++;
      this.get(row, col + 1) && liveNeighbors++;
      this.get(row + 1, col + 1) && liveNeighbors++;

      switch (this.mode) {
        case "famine":
          // prettier-ignore
          ( // S8
            (this.get(row, col) && (liveNeighbors > 5)) ||
            // spontaneous generation
            (this.spontaneousRegeneration && (
              GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
            )
          ) && (status = 1);
          break;
        case "anneal":
          // prettier-ignore
          ( // S35678
            (this.get(row, col) && (liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 6|| liveNeighbors === 7|| liveNeighbors === 8)) ||
            // B4678
            (liveNeighbors === 4 || liveNeighbors === 6|| liveNeighbors === 7 || liveNeighbors === 8) ||
            // spontaneous generation
            (this.spontaneousRegeneration && (
              GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
            )
          ) && (status = 1);
          break;
        case "morley":
          // prettier-ignore
          ( // S245
            (this.get(row, col) && (liveNeighbors === 2 || liveNeighbors === 4 || liveNeighbors === 5)) ||
            // B368
            (liveNeighbors === 3 || liveNeighbors === 6|| liveNeighbors === 8) ||
            // spontaneous generation
            (this.spontaneousRegeneration && (
              GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
            )
          ) && (status = 1);
          break;
        case "day&night":
          // prettier-ignore
          ( // S34678
            (this.get(row, col) && (liveNeighbors === 3 || liveNeighbors === 4 || liveNeighbors === 6  || liveNeighbors === 7 || liveNeighbors === 8)) ||
            // B3678
            (liveNeighbors === 3 || liveNeighbors === 6|| liveNeighbors === 7|| liveNeighbors === 8) ||
            // spontaneous generation
            (this.spontaneousRegeneration && (
              GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
            )
          ) && (status = 1);
          break;
        case "2x2":
          // prettier-ignore
          ( // S125
            (this.get(row, col) && (liveNeighbors === 1 || liveNeighbors === 2 || liveNeighbors === 5)) ||
            // B36
            (liveNeighbors === 3 || liveNeighbors === 6) ||
            // spontaneous generation
            (this.spontaneousRegeneration && (
              GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
            )
          ) && (status = 1);
          break;
        case "diamoeba":
          // prettier-ignore
          ( // S5678
            (this.get(row, col) && (liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7|| liveNeighbors === 8)) ||
            // B35678
            (liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8) ||
            // spontaneous generation
            (this.spontaneousRegeneration && (
              GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
            )
          ) && (status = 1);
          break;
        case "34life":
          // prettier-ignore
          ( // S34
            (this.get(row, col) && (liveNeighbors === 3 || liveNeighbors === 4)) ||
            // B34
            (liveNeighbors === 3 || liveNeighbors === 4) ||
            // spontaneous generation
            (this.spontaneousRegeneration && (
              GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
            )
          ) && (status = 1);
          break;
        case "B25/S4":
          // prettier-ignore
          ( // S4
            (this.get(row, col) && (liveNeighbors === 4)) ||
            // B25
            (liveNeighbors === 2 || liveNeighbors === 5) ||
            // spontaneous generation
            (this.spontaneousRegeneration && (
              GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
            )
          ) && (status = 1);
          break;
        case "seeds":
          // prettier-ignore
          ( // S
            (this.get(row, col) ) ||
            // B2
            (liveNeighbors === 2) ||
            // spontaneous generation
            (this.spontaneousRegeneration && (
              GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
            )
          ) && (status = 1);
          break;
        case "replicator":
          // prettier-ignore
          ( // S1357
            (this.get(row, col) && (liveNeighbors === 1 || liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 7)) ||
            // B1357
            (liveNeighbors === 1 || liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 7) ||
            // spontaneous generation
            (this.spontaneousRegeneration && (
              GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
            )
          ) && (status = 1);
          break;
        case "highlife":
          // prettier-ignore
          ( // Alive and 2-3 live neighbors
          (this.get(row, col) && (liveNeighbors === 2 || liveNeighbors === 3)) ||
          // Dead and 3 live neighbors
          (liveNeighbors === 3 || liveNeighbors === 6) ||
          // spontaneous generation
          (this.spontaneousRegeneration && (
            GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
          )
        ) && (status = 1);
          break;
        case "life":
          // prettier-ignore
          (// Alive and 2-3 live neighbors
          (this.get(row, col) && (liveNeighbors === 2 || liveNeighbors === 3)) ||
          // Dead and 3 live neighbors
          liveNeighbors === 3 ||
          // spontaneous generation
          (this.spontaneousRegeneration && (
            GameOfLife.rand(0, 1000) > (985 + this.noiseRangeValue))
          )
        ) && (status = 1);
          break;
      }

      this.buffer[i] = status;
    }
    [this.data, this.buffer] = [this.buffer, this.data];
    return 0;
  }

  getMousePos(evt: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      y: Math.floor(
        ((evt.clientX - rect.left) / this.pixelSize) * this.pixelScalar
      ),
      x: Math.floor(
        ((evt.clientY - rect.top) / this.pixelSize) * this.pixelScalar
      ),
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
    } else if (this.colorMode === "picker" || this.colorMode === "hsluv") {
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
canvas;
const gameOfLife = new GameOfLife(750, canvas);

let msPast: number = null;
let msPerFrame: number = 7;
let masterOnOff: boolean = true;
let masterCacheState: boolean = masterOnOff;

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

const favicon: any = sel("#favicon");
favicon.href = canvas.toDataURL();
window.setInterval((e: any) => {
  favicon.href = canvas.toDataURL();
}, 5000);

const rangeOver = (input: string, max: number, floor: number) => {
  return expon(input) * max + floor;
};

const expon = (x: string): number => {
  let value = parseFloat(x);
  value = value < 0.0 ? 0.0 : value;
  value = value > 1.0 ? 1.0 : value;
  return -Math.sqrt(-value + 1) + 1;
};

canvas.addEventListener("click", (e) => gameOfLife.clickDown(e), false);

sel("#delay").addEventListener(
  "input",
  (e: any) => {
    const alpha = rangeOver(e.target.value, 1.0, 0);
    console.log(alpha);
    console.log(e.target.value);
    gameOfLife.alpha = alpha;
  },
  false
);

sel(".input-hex").addEventListener(
  "input",
  (e: any) => {
    gameOfLife.color = e.target.value as any;

    // redraw if paused so the user can see what colors
    masterOnOff || gameOfLife.draw(false);
  },
  false
);

sel("select").addEventListener("input", (e: any) => {
  const currentState = masterOnOff;
  if (currentState) masterOnOff = false;
  gameOfLife.ctx.globalCompositeOperation = e.target.value as any;

  masterOnOff = currentState;
});

sel("#rate").addEventListener(
  "input",
  (e: any) => {
    msPerFrame = parseInt(e.target.value as any);
  },
  false
);

let isHovering = false;
sel("#hoverOn").addEventListener("input", (e) => {
  isHovering = true;
});

sel("#hoverOff").addEventListener("input", (e) => {
  isHovering = false;
});

canvas.addEventListener(
  "mousemove",
  (e) => isHovering && gameOfLife.hover(e),
  false
);

sel("#masterOn").addEventListener("change", (e) => (masterOnOff = true), false);

sel("#masterOff").addEventListener(
  "change",
  (e) => (masterOnOff = false),
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
  img.title = `Right click and select "Save Image As.."
Left click to exit (all your captures are saved until refresh)
`;

  const a: any = document.createElement("a");
  a.href = dataUrl;
  a.append(img as any);
  a.download = `CanvasGOL-${Date.now()}.png`;
  sel("#modal-capture").style.display = "flex";
  sel("#modal-capture-preview").prepend(a as any);
  masterOnOff = false;
  (sel("#masterOff") as any).checked = true;
});
sel("#showGallery").addEventListener("click", (e: any) => {
  sel("#modal-capture").style.display = "flex";
});

sel("#reset").addEventListener("click", (e) => {
  gameOfLife.reset();
});

sel("#clear").addEventListener("click", (e) => {
  gameOfLife.clear();
});

sel("#setShape").addEventListener("change", (e: any) => {
  gameOfLife.shape = e.target.value as any;
});

sel("#color").addEventListener(
  "input",
  (e: any) => {
    gameOfLife.color = e.target.value as any;

    // redraw if paused so the user can see what colors
    masterOnOff || gameOfLife.draw(false);
  },
  false
);

sel("#colorMode").addEventListener("change", (e: any) => {
  gameOfLife.colorMode = e.target.value as any;
  switch (e.target.value as any) {
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

sel("#colorRadix").addEventListener("input", (e: any) => {
  gameOfLife.colorRadix = e.target.value as any;
});

let recorders: MediaRecorder = null;
sel("#recStart").addEventListener("change", (e) => {
  const chunks: BlobPart[] = []; // here we will store our recorded media chunks (Blobs)
  const stream = (canvas as any).captureStream(); // grab our canvas MediaStream
  const rec = new MediaRecorder(stream); // init the recorder
  // every time the recorder has new data, we will store it in our array
  recorders = rec;
  rec.ondataavailable = (chunk) => chunks.push(chunk.data);
  // only when the recorder stops, we construct a complete Blob from all the chunks
  rec.onstop = () => {
    const vid = document.createElement("video");
    vid.src = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
    vid.controls = true;
    sel("#modal-capture-preview").prepend(vid as any);
    masterCacheState = masterOnOff;
    masterOnOff = false;
  };

  rec.start();
  setTimeout(() => {
    recorders && recorders.stop();
    (sel("#recStop") as any).checked = true;
    (sel("#recStop") as any).checked = true;
  }, 30000); // stop recording in 30s
});

sel("#recStop").addEventListener("change", () => {
  recorders.stop();
  recorders = null;
});

sel("#blurOn").addEventListener("input", (e) => {
  gameOfLife.blurEnabled = true;
  gameOfLife.clearEveryFrame = false;
  (sel("#delay") as any).disabled = false;
});

sel("#blurOff").addEventListener("input", (e) => {
  gameOfLife.blurEnabled = false;
  gameOfLife.clearEveryFrame = false;
  (sel("#delay") as any).disabled = true;
});
sel("#clearFrame").addEventListener("change", (e) => {
  gameOfLife.clearEveryFrame = true;
  gameOfLife.blurEnabled = false;
  (sel("#delay") as any).disabled = true;
});

sel("#setBlendMode").addEventListener("change", (e: any) => {
  gameOfLife.ctx.globalCompositeOperation = e.target.value;
});

sel("#randCycle").addEventListener("input", (e: any) => {
  const value = rangeOver(e.target.value, 1000, 1);
  gameOfLife.colorRateFps = value;
  console.log(value);
  gameOfLife.colorRateCounter = 0;
});

sel("#noiseRangeValue").addEventListener("input", (e: any) => {
  const noiseRangeValue = rangeOver(e.target.value, 3, 12);
  console.log(noiseRangeValue);
  gameOfLife.noiseRangeValue = noiseRangeValue;
});

sel("#noiseOn").addEventListener("change", (e) => {
  gameOfLife.spontaneousRegeneration = true;
});

sel("#noiseOff").addEventListener("change", (e) => {
  gameOfLife.spontaneousRegeneration = false;
});

sel("#gameType").addEventListener("change", (e: any) => {
  gameOfLife.mode = e.target.value as any;
});
