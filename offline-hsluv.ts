import { createCanvas, loadImage, Canvas } from "canvas";
import * as fs from "fs";
import * as hsluv from "hsluv";
type ControlValues = {
  alpha: number;
  blurEnabled: boolean;
  clearEveryFrame: boolean;
  gameType: string;
  seedDensity: number;
};

class Palette {
  color: string;

  constructor(color: string) {
    this.color = color;
  }
}

class CellularAutomatonEngine {
  size: number;
  data: Uint8Array;
  canvas: Canvas;
  ctx: CanvasRenderingContext2D;
  alpha: number;
  pixelSize: number;
  buffer: Uint8Array;
  blurEnabled: boolean;
  clearEveryFrame: boolean;
  pixelScalar: number;
  bufferLength: number;
  gameType: string;
  seedDensity: number;

  constructor(size: number, canvas: Canvas, controlValues: ControlValues) {
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
    this.gameType = controlValues.gameType;
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
      const row = i % this.size;
      const col = Math.floor(i / this.size);

      // Optimization - array-based algorithm led to GC Pressure and low frame rate
      let liveNeighbors = 0;
      const amp = 1;
      this.get(amp * row - 1, amp * (col - 1)) && liveNeighbors++;
      this.get(amp * row, amp * (col - 1)) && liveNeighbors++;
      this.get(amp * row + 1, amp * (col - 1)) && liveNeighbors++;
      this.get(amp * row - 1, amp * col) && liveNeighbors++;
      this.get(amp * row + 1, amp * col) && liveNeighbors++;
      this.get(amp * row - 1, amp * (col + 1)) && liveNeighbors++;
      this.get(amp * row, amp * (col + 1)) && liveNeighbors++;
      this.get(amp * row + 1, amp * (col + 1)) && liveNeighbors++;

      let status = 0;
      const alive = this.get(row, col);
      // prettier-ignore
      switch (this.gameType) {
        case "famine":
          // S6789
          alive &&
            liveNeighbors > 5 &&
            (status = 1);
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
            (status = 1);
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
            (status = 1);
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
            (status = 1);
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
            (status = 1);
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
            (status = 1);
          break;
        case "34life":
          // S34
          ((alive && (liveNeighbors === 3 || liveNeighbors === 4)) ||
            // B34
            liveNeighbors === 3 ||
            liveNeighbors === 4) &&
            (status = 1);
          break;
        case "B25/S4":
          // S4
          ((alive && liveNeighbors === 4) ||
            // B25
            liveNeighbors === 2 ||
            liveNeighbors === 5) &&
            (status = 1);
          break;
        case "seeds":
          // S
          (alive ||
            // B2
            liveNeighbors === 2) &&
            (status = 1);
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
            (status = 1);
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
            (status = 1);
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
            (status = 1);
          break;
        case "dotlife":
          // 023
          ((alive && (liveNeighbors === 0 || liveNeighbors === 2)) ||
            // B3
            liveNeighbors === 3) &&
            (status = 1);
          break;
        case "highlife":
          // S23
          ((alive && (liveNeighbors === 2 || liveNeighbors === 3)) ||
            // B36
            liveNeighbors === 3 ||
            liveNeighbors === 6) &&
            (status = 1);
          break;
        case "life":
          // A23
          ((alive && (liveNeighbors === 2 || liveNeighbors === 3)) ||
            // B3
            liveNeighbors === 3) &&
            (status = 1);
          break;
      }
      this.buffer[i] = status;
    }
    [this.data, this.buffer] = [this.buffer, this.data];
    return 0;
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

  draw(isAnimating = true, fillStyle: string): void {
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

    this.ctx.fillStyle = fillStyle;
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.get(row, col) === 1) {
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

const simulation = new CellularAutomatonEngine(SIMULATION_SIZE, canvas, {
  alpha: 0.00095,
  blurEnabled: true,
  clearEveryFrame: false,
  gameType: "replicator",
  seedDensity: 1,
});

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
let hue = 180;
let saturation = 70;
let color = "";
for (let index = 0; index < TOTAL_FRAMES; index++) {
  if (index % 200 === 0) {
    hue = Math.abs((hue + random(-12, 12)) % 360);
    saturation = Math.abs((hue + random(-4, 4)) % 100);
    color = [
      "#",
      ...hsluv
        .hsluvToRgb([hue, saturation, 50.0])
        .map((e) => Math.round(e * 255.0))
        .map((e) => e.toString(16)),
    ].join("");
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
