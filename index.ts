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
  mode: string;

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
// const canvas = sel("#twodcanvas") as HTMLCanvasElement;
// const gameOfLife = new GameOfLife(750, canvas);

let msPast: number = null;
let msPerFrame: number = 41.666666666666664;
let masterOnOff: boolean = true;
let masterCacheState: boolean = masterOnOff;

// function tick(now: number) {
//   if (!msPast) msPast = now;

//   if (!msPast || (now - msPast > msPerFrame && masterOnOff)) {
//     msPast = now;
//     gameOfLife.draw(gameOfLife.blurEnabled);
//     gameOfLife.update();
//   }
//   window.requestAnimationFrame(tick);
// }

// window.requestAnimationFrame(tick);

// canvas.addEventListener("click", (e) => gameOfLife.clickDown(e), false);

sel("#delay").addEventListener(
  "input",
  (e: InputEvent) => {
    // gameOfLife.alpha = parseFloat(e.target.value as any);
  },
  false
);

sel("#color").addEventListener(
  "input",
  (e) => {
    // gameOfLife.color = e.target.value as any;
    // redraw if paused so the user can see what colors
    // masterOnOff || gameOfLife.draw(false);
  },
  false
);

sel("select").addEventListener("input", (e) => {
  const currentState = masterOnOff;
  if (currentState) masterOnOff = false;
  // gameOfLife.ctx.globalCompositeOperation = e.target.value as any;

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
sel("#hoverOn").addEventListener("input", (e) => {
  isHovering = true;
});

sel("#hoverOff").addEventListener("input", (e) => {
  isHovering = false;
});

// canvas.addEventListener(
//   "mousemove",
//   (e) => isHovering && gameOfLife.hover(e),
//   false
// );

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
    masterOnOff = masterCacheState;
  },
  false
);

// sel("#screencap").addEventListener("click", (e) => {
//   const dataUrl = canvas.toDataURL("image/png");

//   const img = new Image();
//   img.src = dataUrl;
//   img.alt = `CanvasGOL-${Date.now()}`;
//   img.title = `Right click and select "Save Image As.."
// Left click to exit (all your captures are saved until refresh)
// `;

//   const a = document.createElement("a");
//   a.href = dataUrl;
//   a.append(img as any);
//   a.download = `CanvasGOL-${Date.now()}.png`;
//   sel("#modal-capture").style.display = "flex";
//   sel("#modal-capture-preview").prepend(a as any);
// });

sel("#reset").addEventListener("click", (e) => {
  // gameOfLife.reset();
});

sel("#clear").addEventListener("click", (e) => {
  // gameOfLife.clear();
});

sel("#setShape").addEventListener("change", (e) => {
  // gameOfLife.shape = e.target.value as any;
});

sel("#colorMode").addEventListener("change", (e) => {
  // gameOfLife.colorMode = e.target.value as any;
  switch (e.target.value as any) {
    case "picker":
      sel("#colorRadix").style.display = "none";
      sel('label[for="colorRadix"]').style.display = "none";
      sel("#randCycle").style.display = "none";
      sel('label[for="randCycle"').style.display = "none";

      sel("#color").style.display = "block";
      sel('label[for="color"]').style.display = "block";
      break;
    default:
      sel("#colorRadix").style.display = "block";
      sel('label[for="colorRadix"]').style.display = "block";
      sel("#randCycle").style.display = "block";
      sel('label[for="randCycle"]').style.display = "block";
      sel("#color").style.display = "none";
      sel('label[for="color"]').style.display = "none";
  }
});

sel("#colorRadix").addEventListener("input", (e) => {
  // gameOfLife.colorRadix = e.target.value as any;
});

let recorders: MediaRecorder = null;
// sel("#recStart").addEventListener("change", (e) => {
//   const chunks: BlobPart[] = []; // here we will store our recorded media chunks (Blobs)
//   const stream = canvas.captureStream(); // grab our canvas MediaStream
//   const rec = new MediaRecorder(stream); // init the recorder
//   // every time the recorder has new data, we will store it in our array
//   recorders = rec;
//   rec.ondataavailable = (chunk) => chunks.push(chunk.data);
//   // only when the recorder stops, we construct a complete Blob from all the chunks
//   rec.onstop = () => {
//     const vid = document.createElement("video");
//     vid.src = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
//     vid.controls = true;
//     sel("#modal-capture-preview").prepend(vid as any);
//     masterCacheState = masterOnOff;
//     masterOnOff = false;
//   };

//   rec.start();
//   setTimeout(() => {
//     recorders && recorders.stop();
//     (sel("#recStop") as any).checked = true;
//     (sel("#recStop") as any).checked = true;
//   }, 30000); // stop recording in 30s
// });

sel("#recStop").addEventListener("change", () => {
  recorders.stop();
  recorders = null;
});

sel("#blurOn").addEventListener("input", (e) => {
  // gameOfLife.blurEnabled = true;
  // gameOfLife.clearEveryFrame = false;
  (sel("#delay") as any).disabled = false;
});

sel("#blurOff").addEventListener("input", (e) => {
  // gameOfLife.blurEnabled = false;
  // gameOfLife.clearEveryFrame = false;
  (sel("#delay") as any).disabled = true;
});
sel("#clearFrame").addEventListener("change", (e) => {
  // gameOfLife.clearEveryFrame = true;
  // gameOfLife.blurEnabled = false;
  (sel("#delay") as any).disabled = true;
});

sel("#randCycle").addEventListener("input", (e) => {
  // gameOfLife.colorRateFps = parseInt((e.target as any).value as any);
  // gameOfLife.colorRateCounter = 0;
});

sel("#noiseRangeValue").addEventListener("input", (e) => {
  // gameOfLife.noiseRangeValue = parseInt((e.target as any).value as any);
});

sel("#noiseOn").addEventListener("change", (e) => {
  // gameOfLife.spontaneousRegeneration = true;
  (sel("#noiseRangeValue") as any).disabled = false;
});

sel("#noiseOff").addEventListener("change", (e) => {
  // gameOfLife.spontaneousRegeneration = false;
  (sel("#noiseRangeValue") as any).disabled = true;
});

sel("#gameType").addEventListener("change", (e) => {
  // gameOfLife.mode = e.target.value as any;
});

//from http://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html

/**
 * Creates and compiles a shader.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} shaderSource The GLSL source code for the shader.
 * @param {number} shaderType The type of shader, VERTEX_SHADER or
 *     FRAGMENT_SHADER.
 * @return {!WebGLShader} The shader.
 */
function compileShader(
  gl: WebGLRenderingContext,
  shaderSource: string,
  shaderType: number
) {
  // Create the shader object
  var shader = gl.createShader(shaderType);

  // Set the shader source code.
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check if it compiled
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    // Something went wrong during compilation; get the error
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }

  return shader;
}

/**
 * Creates a program from 2 shaders.
 *
 * @param {!WebGLRenderingContext) gl The WebGL context.
 * @param {!WebGLShader} vertexShader A vertex shader.
 * @param {!WebGLShader} fragmentShader A fragment shader.
 * @return {!WebGLProgram} A program.
 */
function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) {
  // create a program.
  var program = gl.createProgram();

  // attach the shaders.
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // link the program.
  gl.linkProgram(program);

  // Check if it linked.
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    // something went wrong with the link
    throw "program filed to link:" + gl.getProgramInfoLog(program);
  }

  return program;
}

/**
 * Creates a shader from the content of a script tag.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} scriptId The id of the script tag.
 * @param {string} opt_shaderType. The type of shader to create.
 *     If not passed in will use the type attribute from the
 *     script tag.
 * @return {!WebGLShader} A shader.
 */
function createShaderFromScript(
  gl: WebGLRenderingContext,
  scriptId: string,
  opt_shaderType?: string
) {
  // look up the script tag by id.
  var shaderScript = document.getElementById(scriptId) as any;
  if (!shaderScript) {
    throw "*** Error: unknown script element" + scriptId;
  }

  // extract the contents of the script tag.
  var shaderSource = shaderScript.text;

  // If we didn't pass in a type, use the 'type' from
  // the script tag.
  if (!opt_shaderType) {
    if (shaderScript.type == "x-shader/x-vertex") {
      opt_shaderType = gl.VERTEX_SHADER.toString();
    } else if (shaderScript.type == "x-shader/x-fragment") {
      opt_shaderType = gl.FRAGMENT_SHADER.toString();
    } else if (!opt_shaderType) {
      throw "*** Error: shader type not set";
    }
  }

  return compileShader(gl, shaderSource, parseInt(opt_shaderType));
}

/**
 * Creates a program from 2 script tags.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} vertexShaderId The id of the vertex shader script tag.
 * @param {string} fragmentShaderId The id of the fragment shader script tag.
 * @return {!WebGLProgram} A program
 */
function createProgramFromScripts(
  gl: WebGLRenderingContext,
  vertexShaderId: string,
  fragmentShaderId: string
) {
  var vertexShader = createShaderFromScript(gl, vertexShaderId);
  var fragmentShader = createShaderFromScript(gl, fragmentShaderId);
  return createProgram(gl, vertexShader, fragmentShader);
}

/**
 * Created by ghassaei on 2/20/16.
 */

let gl: WebGLRenderingContext;
var ccanvas: HTMLCanvasElement;
var lastState: WebGLTexture;
var currentState: WebGLTexture;
var frameBuffer: WebGLFramebuffer;

let resizedLastState: WebGLTexture;
var resizedCurrentState: WebGLTexture;

var width: number;
var height: number;

var flipYLocation: WebGLUniformLocation;
var textureSizeLocation: WebGLUniformLocation;
var mouseCoordLocation: WebGLUniformLocation;

var paused = false; //while window is resizing

window.onload = initGL;

function initGL() {
  // Get A WebGL context
  ccanvas = document.getElementById("glcanvas") as HTMLCanvasElement;
  ccanvas.width = ccanvas.clientWidth;
  ccanvas.height = ccanvas.clientHeight;

  ccanvas.onmousemove = onMouseMove;
  ccanvas.ontouchmove = onTouchMove;

  window.onresize = onResize;
  gl =
    (ccanvas.getContext("webgl", {
      antialias: false,
    }) as WebGLRenderingContext) ||
    (ccanvas.getContext("experimental-webgl", {
      antialias: false,
    }) as WebGLRenderingContext);
  if (!gl) {
    alert("Could not initialize WebGL, try another browser");
    return;
  }

  //setpixelated(ccanvas.getContext('2d'));
  //function setpixelated(context){
  //    context['imageSmoothingEnabled'] = false;       /* standard */
  //    context['mozImageSmoothingEnabled'] = false;    /* Firefox */
  //    context['oImageSmoothingEnabled'] = false;      /* Opera */
  //    context['webkitImageSmoothingEnabled'] = false; /* Safari */
  //    context['msImageSmoothingEnabled'] = false;     /* IE */
  //}

  gl.disable(gl.DEPTH_TEST);

  // setup a GLSL program
  var program = createProgramFromScripts(
    gl,
    "2d-vertex-shader",
    "2d-fragment-shader"
  );
  gl.useProgram(program);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");

  // Create a buffer for positions
  var bufferPos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferPos);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1.0,
      -1.0,
      1.0,
      -1.0,
      -1.0,
      1.0,
      -1.0,
      1.0,
      1.0,
      -1.0,
      1.0,
      1.0,
    ]),
    gl.STATIC_DRAW
  );

  //flip y
  flipYLocation = gl.getUniformLocation(program, "u_flipY");

  //set texture location
  const texCoordLocation: number = gl.getAttribLocation(program, "a_texCoord");

  textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

  mouseCoordLocation = gl.getUniformLocation(program, "u_mouseCoord");

  // provide texture coordinates for the rectangle.
  var texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      1.0,
      0.0,
      1.0,
      1.0,
      0.0,
      1.0,
      1.0,
    ]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  onResize();

  lastState = resizedLastState;
  currentState = resizedCurrentState;
  resizedLastState = null;
  resizedCurrentState = null;

  frameBuffer = gl.createFramebuffer();

  gl.bindTexture(gl.TEXTURE_2D, lastState); //original texture

  render();
}

function makeRandomArray(rgba: Uint8Array) {
  var numPixels = rgba.length / 4;
  var probability = 0.15;
  for (var i = 0; i < numPixels; i++) {
    var ii = i * 4;
    var state = Math.random() < probability ? 1 : 0;
    rgba[ii] = rgba[ii + 1] = rgba[ii + 2] = state ? 255 : 0;
    rgba[ii + 3] = 255;
  }
  return rgba;
}

function makeTexture(gl: WebGLRenderingContext): WebGLTexture {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return texture;
}

function render() {
  if (!paused) {
    if (resizedLastState) {
      lastState = resizedLastState;
      resizedLastState = null;
    }
    if (resizedCurrentState) {
      currentState = resizedCurrentState;
      resizedCurrentState = null;
    }

    // don't y flip images while drawing to the textures
    gl.uniform1f(flipYLocation, 1);

    step();

    gl.uniform1f(flipYLocation, -1); // need to y flip for ccanvas
    gl.bindTexture(gl.TEXTURE_2D, lastState);

    //draw to ccanvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, lastState);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  window.requestAnimationFrame(render);
}

const step = () => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    currentState,
    0
  );

  gl.bindTexture(gl.TEXTURE_2D, lastState);

  gl.drawArrays(gl.TRIANGLES, 0, 6); //draw to framebuffer

  var temp = lastState;
  lastState = currentState;
  currentState = temp;
};

const onResize = () => {
  paused = true;

  ccanvas.width = ccanvas.clientWidth;
  ccanvas.height = ccanvas.clientHeight;
  width = ccanvas.clientWidth;
  height = ccanvas.clientHeight;

  gl.viewport(0, 0, width, height);

  // set the size of the texture
  gl.uniform2f(textureSizeLocation, width, height);

  //texture for saving output from frag shader
  resizedCurrentState = makeTexture(gl);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );

  resizedLastState = makeTexture(gl);
  //fill with random pixels
  var rgba = new Uint8Array(width * height * 4);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    makeRandomArray(rgba)
  );

  paused = false;
};

function onMouseMove(e: MouseEvent) {
  gl.uniform2f(mouseCoordLocation, e.clientX / width, e.clientY / height);
}

function onTouchMove(e: TouchEvent) {
  e.preventDefault();
  var touch = e.touches[0];
  gl.uniform2f(mouseCoordLocation, touch.pageX / width, touch.pageY / height);
}

sel("#color").addEventListener(
  "input",
  (e) => {
    // gameOfLife.color = e.target.value as any;
    // redraw if paused so the user can see what colors
    // masterOnOff || gameOfLife.draw(false);
  },
  false
);