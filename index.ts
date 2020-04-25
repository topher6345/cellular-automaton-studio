class CellularAutomatonEngine {
  size: number;
  data: Uint8Array;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  alpha: number;
  color: string;
  pixelSize: number;
  clickShape: string;
  hoverShape: string;
  colorMode: string;
  colorRadix: number;
  buffer: Uint8Array;
  blurEnabled: boolean;
  clearEveryFrame: boolean;
  colorRateFrames: number;
  colorCache: string;
  colorRateCounter: number;
  noiseEnabled: boolean;
  noiseRangeValue: number;
  pixelScalar: number;
  bufferLength: number;
  mode: string;
  seedDensity: number;

  constructor(size: number, canvas: HTMLCanvasElement) {
    this.size = size;
    this.pixelSize = 1;
    this.pixelScalar = 1;
    this.data = CellularAutomatonEngine.randBoard(this.size);
    this.buffer = new Uint8Array(this.size * this.size);
    this.bufferLength = this.buffer.length;

    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this.ctx.imageSmoothingEnabled = true;
    this.alpha = 0.006;
    this.blurEnabled = false;
    this.clearEveryFrame = false;
    this.color = "orange";

    this.clickShape = "gliderse";
    this.hoverShape = "3x3";
    this.colorMode = "full";
    this.colorRadix = 16777215;
    this.ctx.fillStyle = "rgba(0,0,0,1)";
    this.ctx.fillRect(
      0,
      0,
      this.size * this.pixelSize,
      this.size * this.pixelSize
    );

    this.colorRateFrames = 120;
    this.colorRateCounter = 0;
    this.colorCache = this.randColorString();
    this.noiseEnabled = false;
    this.noiseRangeValue = 0;
    this.mode = "life";

    this.seedDensity = 1;
  }

  seed(): void {
    const data = CellularAutomatonEngine.randBoard(this.size, this.seedDensity);

    for (let i = 0; i < data.length; i++) {
      if (this.data[i]) data[i] = 1;
    }
    this.data = data;
  }

  clear(): void {
    this.ctx.clearRect(
      0,
      0,
      this.size * this.pixelSize,
      this.size * this.pixelSize
    );
  }

  kill(): void {
    this.data = new Uint8Array(this.size * this.size);
  }

  static rand(min: number, max: number, density: number) {
    const pass = Math.floor(Math.random() * density);

    if (pass === 0) {
      return Math.floor(Math.random() * (max - min)) + min;
    }

    return 0;
  }

  static randBoard(size: number, density = 0): Uint8Array {
    return new Uint8Array(size * size).map(() => this.rand(0, 2, density));
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
      // Noise
      const spontaneousBirth =
        this.noiseEnabled &&
        CellularAutomatonEngine.rand(0, 1000, 0) > 985 + this.noiseRangeValue;

      if (spontaneousBirth) {
        this.buffer[i] = 1;
        continue;
      }

      const row = i % this.size;
      const col = Math.floor(i / this.size);

      // Optimization - array-based algorithm led to GC Pressure and low frame rate
      let liveNeighbors = 0;
      this.get(row - 1, col - 1) && liveNeighbors++;
      this.get(row, col - 1) && liveNeighbors++;
      this.get(row + 1, col - 1) && liveNeighbors++;
      this.get(row - 1, col) && liveNeighbors++;
      this.get(row + 1, col) && liveNeighbors++;
      this.get(row - 1, col + 1) && liveNeighbors++;
      this.get(row, col + 1) && liveNeighbors++;
      this.get(row + 1, col + 1) && liveNeighbors++;

      let status = 0;
      const alive = this.get(row, col);
      // prettier-ignore
      switch (this.mode) {
        case "famine":
          ( // S6789
            (alive && (liveNeighbors > 5)) || spontaneousBirth
          ) && (status = 1);
          break;
        case "anneal":
          ( // S35678
            (alive && (liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 6|| liveNeighbors === 7|| liveNeighbors === 8)) ||
            // B4678
            (liveNeighbors === 4 || liveNeighbors === 6|| liveNeighbors === 7 || liveNeighbors === 8)
          ) && (status = 1);
          break;
        case "morley":
          ( // S245
            (alive && (liveNeighbors === 2 || liveNeighbors === 4 || liveNeighbors === 5)) ||
            // B368
            (liveNeighbors === 3 || liveNeighbors === 6|| liveNeighbors === 8)
          ) && (status = 1);
          break;
        case "day&night":
          ( // S34678
            (alive && (liveNeighbors === 3 || liveNeighbors === 4 || liveNeighbors === 6  || liveNeighbors === 7 || liveNeighbors === 8)) ||
            // B3678
            (liveNeighbors === 3 || liveNeighbors === 6|| liveNeighbors === 7|| liveNeighbors === 8)
          ) && (status = 1);
          break;
        case "2x2":
          ( // S125
            (alive && (liveNeighbors === 1 || liveNeighbors === 2 || liveNeighbors === 5)) ||
            // B36
            (liveNeighbors === 3 || liveNeighbors === 6)
          ) && (status = 1);
          break;
        case "diamoeba":
          ( // S5678
            (alive && (liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7|| liveNeighbors === 8)) ||
            // B35678
            (liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8)
          ) && (status = 1);
          break;
        case "34life":
          ( // S34
            (alive && (liveNeighbors === 3 || liveNeighbors === 4)) ||
            // B34
            (liveNeighbors === 3 || liveNeighbors === 4) ||
            spontaneousBirth
          ) && (status = 1);
          break;
        case "B25/S4":
          ( // S4
            (alive && (liveNeighbors === 4)) ||
            // B25
            (liveNeighbors === 2 || liveNeighbors === 5)
          ) && (status = 1);
          break;
        case "seeds":
          ( // S
            (alive ) ||
            // B2
            (liveNeighbors === 2)
          ) && (status = 1);
          break;
        case "replicator":
          ( // S1357
            (alive && (liveNeighbors === 1 || liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 7)) ||
            // B1357
            (liveNeighbors === 1 || liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 7)
          ) && (status = 1);
          break;
        case "highlife":
          ( // S23
          (alive && (liveNeighbors === 2 || liveNeighbors === 3)) ||
          // B36
          (liveNeighbors === 3 || liveNeighbors === 6)
        ) && (status = 1);
          break;
        case "life":
          (// A23
          (alive && (liveNeighbors === 2 || liveNeighbors === 3)) ||
          // B3
          liveNeighbors === 3
        ) && (status = 1);
          break;
      }

      this.buffer[i] = status;
    }
    [this.data, this.buffer] = [this.buffer, this.data];
    return 0;
  }

  getMousePos(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      y: Math.floor(
        ((event.clientX - rect.left) / this.pixelSize) * this.pixelScalar
      ),
      x: Math.floor(
        ((event.clientY - rect.top) / this.pixelSize) * this.pixelScalar
      ),
    };
  }

  hover(e: MouseEvent) {
    const { x, y } = this.getMousePos(e);
    this.drawShape(x, y, this.hoverShape);
  }

  drawShape(x: number, y: number, shape: string) {
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
        this.set(x - 1, y - 1, 1);
        this.set(x - 1, y, 1);
        this.set(x - 1, y + 1, 1);
        this.set(x, y - 1, 1);
        this.set(x, y, 1);
        this.set(x, y + 1, 1);
        this.set(x - 1, y - 1, 1);
        this.set(x - 1, y, 1);
        this.set(x - 1, y + 1, 1);
        break;
      case "1x1":
        this.set(x, y, 1);
        break;
      default:
    }
  }

  clickDown(e: MouseEvent) {
    const { x, y } = this.getMousePos(e);
    this.drawShape(x, y, this.clickShape);
  }

  randColor(): string {
    if (this.colorRateCounter > this.colorRateFrames) {
      this.colorCache = this.randColorString();
      this.colorRateCounter = 0;
    }
    this.colorRateCounter = this.colorRateCounter + 1;
    return this.colorCache;
  }

  randColorString(): string {
    return "#" + Math.floor(Math.random() * this.colorRadix).toString(16);
  }

  draw(isAnimating = true): void {
    if (isAnimating) {
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

const sel = (selector: string): HTMLElement => document.querySelector(selector);

const canvas = sel("canvas") as HTMLCanvasElement;
const simulation = new CellularAutomatonEngine(750, canvas);
const favicon = sel("#favicon") as HTMLAnchorElement;

// Update the favicon with the current canvas
favicon.href = canvas.toDataURL();
window.setInterval(() => (favicon.href = canvas.toDataURL()), 5000);

let msPast: number = null;
let msPerFrame: number = 7;
let masterOnOff: boolean = true;
let masterCacheState: boolean = masterOnOff;

function tick(now: number) {
  if (!msPast) msPast = now;

  if (!msPast || (now - msPast > msPerFrame && masterOnOff)) {
    msPast = now;
    simulation.draw(simulation.blurEnabled);
    simulation.update();
  }
  window.requestAnimationFrame(tick);
}

window.requestAnimationFrame(tick);

const log = (message: string) => {
  const prompt = sel("#prompt");
  const p = document.createElement("p");
  p.innerText = message;
  prompt.append(p);
  prompt.scrollTop = sel("#prompt").scrollHeight;
};

setTimeout(() => log("> Hover over controls for help"), 3000);

const rangeOver = (input: string, max: number, floor: number) =>
  expon(input) * max + floor;

const expon = (x: string): number => {
  let value = parseFloat(x);
  value = value < 0.0 ? 0.0 : value;
  value = value > 1.0 ? 1.0 : value;
  return -Math.sqrt(-value + 1) + 1;
};

interface EventTarget {
  value: string;
}

sel("#delay").addEventListener(
  "input",
  (e) => (simulation.alpha = rangeOver(e.target.value, 1.0, 0)),
  false
);

sel("#setBlendMode").addEventListener("input", (e) => {
  const currentState = masterOnOff;
  if (currentState) masterOnOff = false;

  simulation.ctx.globalCompositeOperation = e.target.value;

  masterOnOff = currentState;
});

sel("#rate").addEventListener(
  "input",
  (e) => (msPerFrame = parseInt(e.target.value))
);

let isHovering = false;
sel("#hoverOn").addEventListener("input", () => (isHovering = true));
sel("#hoverOff").addEventListener("input", () => (isHovering = false));
canvas.addEventListener(
  "mousemove",
  (e) => isHovering && simulation.hover(e),
  false
);

canvas.addEventListener("click", (e) => simulation.clickDown(e), false);

sel("#masterOn").addEventListener("change", () => {
  masterOnOff = true;
  log("$ The simulation has been started.");
});
sel("#masterOff").addEventListener("change", () => {
  masterOnOff = false;
  log("$ The simulation has been paused.");
});

sel("#modal-capture-preview").addEventListener(
  "click",
  () => (sel("#modal-capture ").style.display = "none"),
  false
);

sel("#screencap").addEventListener("click", () => {
  const img = new Image();
  const dataUrl = canvas.toDataURL("image/png");

  img.src = dataUrl;
  img.alt = `CanvasGOL-${Date.now()}`;
  img.title = `Click to download
  
Click grey border to exit (Simulation has been paused)
`;

  const a: HTMLAnchorElement = document.createElement("a");
  a.href = dataUrl;
  a.append(img);
  a.download = `CanvasGOL-${Date.now()}.png`;

  sel("#modal-capture").style.display = "flex";
  sel("#modal-capture-preview").prepend(a);

  masterOnOff = false;
  (sel("#masterOff") as HTMLInputElement).checked = true;
});
sel("#showGallery").addEventListener(
  "click",
  () => (sel("#modal-capture").style.display = "flex")
);

sel("#seed").addEventListener("click", () => simulation.seed());
sel("#clear").addEventListener("click", () => simulation.clear());
sel("#kill").addEventListener("click", () => simulation.kill());

sel("#seedDensity").addEventListener(
  "input",
  (e) => (simulation.seedDensity = parseInt(e.target.value))
);

sel("#setClickShape").addEventListener(
  "change",
  (e) => (simulation.clickShape = e.target.value)
);

sel("#setHoverShape").addEventListener(
  "change",
  (e) => (simulation.hoverShape = e.target.value)
);

sel("#color").addEventListener(
  "input",
  (e) => {
    simulation.color = e.target.value;

    // redraw if paused so the user can see what colors
    masterOnOff || simulation.draw(false);
  },
  false
);

// HSLUV picker
sel(".input-hex").addEventListener(
  "input",
  (e) => {
    simulation.color = e.target.value;

    // redraw if paused so the user can see what colors
    masterOnOff || simulation.draw(false);
  },
  false
);

sel("#colorMode").addEventListener("change", (e) => {
  simulation.colorMode = e.target.value;
  switch (e.target.value) {
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

sel("#colorRadix").addEventListener(
  "input",
  (e) => (simulation.colorRadix = parseInt(e.target.value))
);

interface HTMLCanvasElement {
  captureStream(): MediaStream;
}

let recorders: MediaRecorder = null;
sel("#recStart").addEventListener("change", () => {
  const chunks: BlobPart[] = []; // here we will store our recorded media chunks (Blobs)
  const stream = canvas.captureStream();
  const rec = new MediaRecorder(stream);

  // every time the recorder has new data, we will store it in our array
  recorders = rec;
  rec.ondataavailable = (chunk) => chunks.push(chunk.data);

  // only when the recorder stops, we construct a complete Blob from all the chunks
  rec.onstop = () => {
    const vid = document.createElement("video");
    vid.src = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
    vid.controls = true;

    sel("#modal-capture-preview").prepend(vid);

    masterCacheState = masterOnOff;
    masterOnOff = false;
  };

  rec.start();
  setTimeout(() => {
    recorders && recorders.stop();
    (sel("#recStop") as HTMLInputElement).checked = true;
  }, 1000 * 30); // stop recording in 30s
});

sel("#recStop").addEventListener("change", () => {
  recorders.stop();
  recorders = null;
});

interface HTMLElement {
  disabled: boolean;
}

sel("#blurOn").addEventListener("input", () => {
  simulation.blurEnabled = true;
  simulation.clearEveryFrame = false;
  sel("#delay").disabled = false;
  log("> Draw Mode:Blur - older generations will fade out.");
});

sel("#blurOff").addEventListener("input", () => {
  simulation.blurEnabled = false;
  simulation.clearEveryFrame = false;
  sel("#delay").disabled = true;
  log("> Draw Mode:Overlay - new generations will paint on top of old ones.");
});

sel("#clearFrame").addEventListener("change", () => {
  simulation.clearEveryFrame = true;
  simulation.blurEnabled = false;
  sel("#delay").disabled = true;
  log("> Draw Mode:Clear Frame - only newest generation shown.");
});

sel("#setBlendMode").addEventListener(
  "input",
  (e) => (simulation.ctx.globalCompositeOperation = e.target.value)
);

sel("#randCycle").addEventListener("input", (e) => {
  simulation.colorRateFrames = rangeOver(e.target.value, 1000, 1);
  simulation.colorRateCounter = 0;
});

sel("#noiseRangeValue").addEventListener(
  "input",
  (e) => (simulation.noiseRangeValue = rangeOver(e.target.value, 3, 12))
);

sel("#noiseOn").addEventListener(
  "change",
  () => (simulation.noiseEnabled = true)
);

sel("#noiseOff").addEventListener(
  "change",
  () => (simulation.noiseEnabled = false)
);

sel("#gameType").addEventListener("change", (e) => {
  simulation.mode = e.target.value;
  log(`> Game type has been changed to ${simulation.mode}`);
});

sel("#prompt").scrollTop = 0;
