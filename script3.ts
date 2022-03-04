import { createCanvas, loadImage, Canvas } from "canvas";
import * as fs from "fs";

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
  blurEnabled: false,
  clearEveryFrame: false,
  colorRateFrames: 120,
  noiseEnabled: false,
  noiseRangeValue: 0,
  game: "seeds",
  seedDensity: 1,
};

class CellularAutomatonEngine {
  size: number;
  data: Uint8Array;
  canvas: Canvas;
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

  constructor(size: number, canvas: Canvas, controlValues: ControlValues) {
    this.size = size;
    this.pixelSize = 1;
    this.pixelScalar = 1;
    this.data = new Uint8Array(size * size).map(() => 0);
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

  set3(x: number, y: number, value: number): void {
    this.set(x + 1, y - 1, 1);
    this.set(x + 1, y, 1);
    this.set(x + 1, y + 1, 1);
    this.set(x, y - 1, 1);
    this.set(x, y, 1);
    this.set(x, y + 1, 1);
    this.set(x - 1, y - 1, 1);
    this.set(x - 1, y, 1);
    this.set(x - 1, y + 1, 1);
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
            (alive && (liveNeighbors > 5) || spontaneousBirth)
          ) && (status = 1);
          break;
        case "anneal":
          ( // S35678
            (// B4678
            (alive && (liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 6|| liveNeighbors === 7|| liveNeighbors === 8) || (liveNeighbors === 4 || liveNeighbors === 6|| liveNeighbors === 7 || liveNeighbors === 8)))
          ) && (status = 1);
          break;
        case "morley":
          ( // S245
            (// B368
            (alive && (liveNeighbors === 2 || liveNeighbors === 4 || liveNeighbors === 5) || (liveNeighbors === 3 || liveNeighbors === 6 || liveNeighbors === 8)))
          ) && (status = 1);
          break;
        case "day&night":
          ( // S34678
            (// B3678
            (alive && (liveNeighbors === 3 || liveNeighbors === 4 || liveNeighbors === 6  || liveNeighbors === 7 || liveNeighbors === 8) || (liveNeighbors === 3 || liveNeighbors === 6|| liveNeighbors === 7 || liveNeighbors === 8)))
          ) && (status = 1);
          break;
        case "2x2":
          ( // S125
            (// B36
            (alive && (liveNeighbors === 1 || liveNeighbors === 2 || liveNeighbors === 5) || (liveNeighbors === 3 || liveNeighbors === 6)))
          ) && (status = 1);
          break;
        case "diamoeba":
          ( // S5678
            (// B35678
            (alive && (liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7|| liveNeighbors === 8) || (liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 6 || liveNeighbors === 7 || liveNeighbors === 8)))
          ) && (status = 1);
          break;
        case "34life":
          ( // S34
            ((alive && (liveNeighbors === 3 || liveNeighbors === 4)) ||
            // B34
            (liveNeighbors === 3 || liveNeighbors === 4) || spontaneousBirth)
          ) && (status = 1);
          break;
        case "B25/S4":
          ( // S4
            (// B25
            (alive && (liveNeighbors === 4) || (liveNeighbors === 2 || liveNeighbors === 5)))
          ) && (status = 1);
          break;
        case "seeds":
          ( // S
            (// B2
            (alive || liveNeighbors === 2))
          ) && (status = 1);
          break;
        case "replicator":
          ( // S1357
            (// B1357
            (alive && (liveNeighbors === 1 || liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 7) || (liveNeighbors === 1 || liveNeighbors === 3 || liveNeighbors === 5 || liveNeighbors === 7)))
          ) && (status = 1);
          break;
        case "highlife":
          ( // S23
          (// B36
          (alive && (liveNeighbors === 2 || liveNeighbors === 3) || (liveNeighbors === 3 || liveNeighbors === 6)))
        ) && (status = 1);
          break;
        case "life":
          (// A23
          (alive && (liveNeighbors === 2 || liveNeighbors === 3) || // B3
          liveNeighbors === 3)
        ) && (status = 1);
          break;
      }

      this.buffer[i] = status;
    }
    [this.data, this.buffer] = [this.buffer, this.data];
    return 0;
  }

  getMousePos(event: MouseEvent) {
    const rect: any = (this.canvas as any).getBoundingClientRect();
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
      this.ctx.fillStyle = `rgba(1,1,1,0)`;
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

const SIMULATION_SIZE = 1000;
const canvas = createCanvas(SIMULATION_SIZE, SIMULATION_SIZE);

const simulation = new CellularAutomatonEngine(
  SIMULATION_SIZE,
  canvas,
  INIT_CONTROL_VALUES
);

const writeFile = (canvas) => {
  // console.log(" writing File...");

  fs.writeFileSync(
    `CellularAnimationStudio-${Date.now()}.png`,
    canvas.toBuffer("image/png")
  );
};

import * as cliProgress from "cli-progress";

// create a new progress bar instance and use shades_classic theme
const progress = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

const TOTAL_FRAMES = 90000;
// start the progress bar with a total value of 200 and start value of 0
progress.start(TOTAL_FRAMES, 0);
const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min)) + min;
simulation.set3(random(0, 1000), random(0, 1000), 1);
simulation.set3(random(0, 1000), random(0, 1000), 1);
for (let index = 0; index < TOTAL_FRAMES; index++) {
  simulation.draw(true);
  simulation.update();
  progress.update(index);

  if (index % 400 === 0) {
    simulation.seedDensity = 45;
    simulation.kill();
    simulation.set3(random(0, 1000), random(0, 1000), 1);
    simulation.set3(random(0, 1000), random(0, 1000), 1);
  }
  if (index % 100 === 0) {
    writeFile(canvas);
  }
}
writeFile(canvas);
progress.stop();
