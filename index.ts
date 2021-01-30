type ControlValues = {
  alpha: number;
  color: string;
  clickShape: string;
  hoverShape: string;
  colorMode: string;
  colorRadix: number;
  blurEnabled: boolean;
  clearEveryFrame: boolean;
  colorRateFrames: number;
  noiseEnabled: boolean;
  noiseRangeValue: number;
  game: string;
  seedDensity: number;
};

const INIT_CONTROL_VALUES: ControlValues = {
  alpha: 0.006,
  color: "orange",
  clickShape: "gliderse",
  hoverShape: "gliderse",
  colorMode: "full",
  colorRadix: 16777215,
  blurEnabled: true,
  clearEveryFrame: false,
  colorRateFrames: 120,
  noiseEnabled: false,
  noiseRangeValue: 0,
  game: "life",
  seedDensity: 1,
};

class HashStorage {
  constructor() {
    try {
      if (this.isEmpty(this.decode(window.location.hash))) {
        window.location.hash = this.encode(INIT_CONTROL_VALUES);
      }
    } catch (e) {
      window.location.hash = this.encode(INIT_CONTROL_VALUES);
    }
  }

  isEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

  isEmpty = (a: any) => a.length === 0;

  state(): ControlValues {
    return this.decode(window.location.hash);
  }

  encode(state: ControlValues) {
    return btoa(JSON.stringify(state));
  }
  decode(hash: any): any {
    return JSON.parse(atob(hash.substring(1)));
  }

  update(data: any) {
    const _state = this.state();
    const updated = { ..._state, ...data };
    if (this.isEqual(updated, _state)) {
      return false;
    } else {
      window.location.hash = this.encode(updated);
      console.log(_state);
      return updated;
    }
  }

  setMasterGain(e: string) {
    this.update({ masterGain: e });
  }
}

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
  game: string;
  seedDensity: number;

  constructor(
    size: number,
    canvas: HTMLCanvasElement,
    controlValues: ControlValues
  ) {
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
    this.ctx.fillRect(
      0,
      0,
      this.size * this.pixelSize,
      this.size * this.pixelSize
    );

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
      switch (this.game) {
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
    debugger;

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

const hashStorage = new HashStorage();
console.log(hashStorage.state());

const canvas = sel("canvas") as HTMLCanvasElement;
const simulation = new CellularAutomatonEngine(
  750,
  canvas,
  hashStorage.state()
);
const favicon = sel("#favicon") as HTMLAnchorElement;

// Update the favicon with the current canvas
favicon.href = canvas.toDataURL();
window.setInterval(() => (favicon.href = canvas.toDataURL()), 5000);

let msPast: number = null;
let msPerFrame: number = 7;
let masterOnOff: boolean = true;

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

const log = (message: string, link?: string, linkText?: string) => {
  const prompt = sel("#prompt");
  const p = document.createElement("p");
  p.innerText = `> ${message}`;
  prompt.append(p);

  if (link) {
    const a = document.createElement("a");
    a.href = link;
    a.innerText = linkText || link;
    a.target = "_blank";
    p.append(a);
  }
  prompt.scrollTop = sel("#prompt").scrollHeight;
};

setTimeout(() => log("Hover over controls for help"), 3000);

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

sel("#delay").addEventListener(
  "change",
  () => {
    hashStorage.update({ alpha: simulation.alpha });
  },
  false
);

const blendModeLink: any = {
  "source-over":
    "https://drafts.fxtf.org/compositing-1/#porterduffcompositingoperators_srcover",
  "source-atop":
    "https://drafts.fxtf.org/compositing-1/#porterduffcompositingoperators_srcatop",
  lighten: "https://drafts.fxtf.org/compositing-1/#blendinglighten",
  xor:
    "https://drafts.fxtf.org/compositing-1/#porterduffcompositingoperators_xor",
  multiply: "https://drafts.fxtf.org/compositing-1/#blendingmultiply",
  n: "https://drafts.fxtf.org/compositing-1/#blendingscreen",
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
  luminosity: "https://drafts.fxtf.org/compositing-1/#blendingluminosity",
};

sel("#setBlendMode").addEventListener("input", (e) => {
  const currentState = masterOnOff;
  if (currentState) masterOnOff = false;

  const blendMode = e.target.value;
  simulation.ctx.globalCompositeOperation = blendMode;

  masterOnOff = currentState;
  log("Blend Mode is now ", blendModeLink[blendMode], blendMode);
});

sel("#rate").addEventListener(
  "input",
  (e) => (msPerFrame = parseInt(e.target.value))
);

sel("#rate").addEventListener("change", () =>
  log(`Speed is now ${msPerFrame} milliseconds per generation`)
);

let isHovering = false;
sel("#hoverOn").addEventListener("input", () => {
  isHovering = true;
  log("Hover ON - the mouse over the canvas will now draw a shape");
});

sel("#hoverOff").addEventListener("input", () => {
  isHovering = false;
  log("Hover OFF - the mouse over the canvas will not draw");
});

canvas.addEventListener(
  "mousemove",
  (e) => isHovering && simulation.hover(e),
  false
);

canvas.addEventListener("click", (e) => simulation.clickDown(e), false);

sel("#masterOn").addEventListener("change", () => {
  masterOnOff = true;
  log("Simulation ON");
});

sel("#masterOff").addEventListener("change", () => {
  masterOnOff = false;
  log("Simulation OFF");
});

sel("#modal-capture-preview").addEventListener(
  "click",
  () => (sel("#modal-capture ").style.display = "none"),
  false
);

sel("#screencap").addEventListener("click", () => {
  const img = new Image();
  const dataUrl = canvas.toDataURL("image/png");
  const imgName = `CellularAnimationStudio-${Date.now()}`;
  img.src = dataUrl;
  img.alt = imgName;
  img.title = `Click to download
  
Click grey border to exit (Simulation has been paused)
`;

  const a: HTMLAnchorElement = document.createElement("a");
  a.href = dataUrl;
  a.append(img);
  a.download = `${imgName}.png`;
  log(`Screenshot captured, the simulation has been paused.`);

  sel("#modal-capture").style.display = "flex";
  sel("#modal-capture-preview").prepend(a);

  masterOnOff = false;
  (sel("#masterOff") as HTMLInputElement).checked = true;
});

sel("#showGallery").addEventListener(
  "click",
  () => (sel("#modal-capture").style.display = "flex")
);

sel("#seed").addEventListener("click", () => {
  simulation.seed();
  log(`Simulation seeded - 1 in ${simulation.seedDensity} odds`);
});

sel("#clear").addEventListener("click", () => {
  simulation.clear();
  log("Screen cleared");
});

sel("#kill").addEventListener("click", () => {
  simulation.kill();
  log("Cells Killed - click Seed or the canvas to add live cells");
});

sel("#seedDensity").addEventListener(
  "input",
  (e) => (simulation.seedDensity = parseInt(e.target.value))
);

sel("#seedDensity").addEventListener("change", (e) =>
  log(`Seed Density changed to ${e.target.value}`)
);

const shapeLink = (shape: string): string => {
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

sel("#setClickShape").addEventListener("change", (e) => {
  simulation.clickShape = e.target.value;
  log(
    "Click Shape is now ",
    shapeLink(simulation.clickShape),
    simulation.clickShape
  );
});

sel("#setHoverShape").addEventListener("change", (e) => {
  simulation.hoverShape = e.target.value;

  log(
    `Hover Shape (${isHovering ? "ON" : "OFF"}) is now ${
      simulation.hoverShape
    }`,
    shapeLink(simulation.hoverShape)
  );
});

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
      log("Color mode is now the native color picker in your browser");
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
      break;
    case "full":
      log(
        "Color mode is now Random Frame - all pixels of each frame will be the same random color"
      );
      break;
    case "row":
      log(
        "Color mode is now Random Row - all pixels of each row will be the same random color"
      );
      break;
    case "each":
      log("Color mode is now Random Pixel- every pixel is a new random color");
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
    const vidName = `CellularAnimationStudio-${Date.now()}`;
    vid.download = `${vidName}.webm`;
    vid.controls = true;

    sel("#modal-capture-preview").prepend(vid);

    masterOnOff = false;
    (sel("#masterOff") as HTMLInputElement).checked = true;
  };

  rec.start();
  log(`Recording started at ${new Date()}..`);
  setTimeout(() => {
    recorders && recorders.stop();
    recorders && log("Recording Stopped after 30 seconds");
    (sel("#recStop") as HTMLInputElement).checked = true;
  }, 1000 * 30);
});

sel("#recStop").addEventListener("change", () => {
  recorders.stop();
  recorders = null;
  log("Recording Stopped, click Gallery to view and download the recording");
});

interface HTMLElement {
  disabled: boolean;
}

sel("#blurOn").addEventListener("input", () => {
  simulation.blurEnabled = true;
  simulation.clearEveryFrame = false;
  sel("#delay").disabled = false;
  log("Blur ON - previous generations will fade out based on Blur Amount");
});

sel("#blurOff").addEventListener("input", () => {
  simulation.blurEnabled = false;
  simulation.clearEveryFrame = false;
  sel("#delay").disabled = true;
  log("Overlay ON - new generation will paint on top of previous one");
});

sel("#clearFrame").addEventListener("change", () => {
  simulation.clearEveryFrame = true;
  simulation.blurEnabled = false;
  sel("#delay").disabled = true;
  log(
    "Clear Frame ON - draw only current generation, erase previous generations"
  );
});

sel("#randCycle").addEventListener("input", (e) => {
  simulation.colorRateFrames = rangeOver(e.target.value, 1000, 1);
  simulation.colorRateCounter = 0;
});

sel("#noiseRangeValue").addEventListener(
  "input",
  (e) => (simulation.noiseRangeValue = rangeOver(e.target.value, 3, 12))
);

sel("#noiseRangeValue").addEventListener("change", () => {
  if (simulation.noiseEnabled) {
    log(
      `Noise (ON) Amount is now 1 in ${simulation.noiseRangeValue.toFixed(
        2
      )} chance of being born`
    );
  } else {
    log(
      `Noise (OFF) Amount is now 1 in ${simulation.noiseRangeValue.toFixed(
        2
      )} chace of being born`
    );
  }
});

sel("#noiseOn").addEventListener("change", () => {
  simulation.noiseEnabled = true;
  log("Noise On - cells will be born randomly");
});

sel("#noiseOff").addEventListener("change", () => {
  simulation.noiseEnabled = false;
  log("Noise Off - cells will be born according to game rules only");
});

const gameLink = (game: string): string => {
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

sel("#gameType").addEventListener("change", (e) => {
  simulation.game = e.target.value;
  hashStorage.update({ game: e.target.value });
  log("Game changed to ", gameLink(simulation.game), simulation.game);
});

sel("#prompt").scrollTop = 0;

setInterval(() => {
  const sum = simulation.data.reduce((a, b) => a + b, 0);

  sel("#currentCount").value = sum;
}, 2000);

const route = (state: ControlValues) => {
  sel("#gameType").value = state.game;

  // TODO: exponential to linear
  // sel("#delay").value = state.alpha.toString();

  // Don't set color in UI
  // sel("").value = state.color;

  sel("#setClickShape").value = state.clickShape;
  sel("#setHoverShape").value = state.hoverShape;
  sel("#colorMode").value = state.colorMode;
  sel("#colorRadix").value = state.colorRadix.toString();
  (sel("#clearFrame") as HTMLInputElement).checked = state.blurEnabled;
  (sel("#clearFrame") as HTMLInputElement).checked = state.clearEveryFrame;

  // TODO: exponential to linear
  // sel("#randCycle").value = state.colorRateFrames;

  (sel("#noiseOn") as HTMLInputElement).checked = state.noiseEnabled;
  sel("#noiseRangeValue").value = state.noiseRangeValue.toString();

  // TODO: exponential to linear
  // sel("#seedDensity").value = state.seedDensity;
};

route(hashStorage.state());
window.addEventListener("hashchange", () => route(hashStorage.state()), false);
