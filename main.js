/**
 * Created by ghassaei on 2/20/16.
 */

var gl;
var ccanvas;
var lastState;
var currentState;
var frameBuffer;

var resizedLastState;
var resizedCurrentState;

var width;
var height;

var flipYLocation;
var textureSizeLocation;
var mouseCoordLocation;

var paused = false; //while window is resizing

window.onload = initGL;

function initGL() {
  // Get A WebGL context
  ccanvas = document.getElementById("glcanvas");
  ccanvas.width = ccanvas.clientWidth;
  ccanvas.height = ccanvas.clientHeight;

  ccanvas.onmousemove = onMouseMove;
  ccanvas.ontouchmove = onTouchMove;

  window.onresize = onResize;
  debugger;
  gl =
    ccanvas.getContext("webgl", { antialias: false }) ||
    ccanvas.getContext("experimental-webgl", { antialias: false });
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
  var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

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

function makeRandomArray(rgba) {
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

function makeTexture(gl) {
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

function step() {
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
}

function onResize() {
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
}

function onMouseMove(e) {
  gl.uniform2f(mouseCoordLocation, e.clientX / width, e.clientY / height);
}

function onTouchMove(e) {
  e.preventDefault();
  var touch = e.touches[0];
  gl.uniform2f(mouseCoordLocation, touch.pageX / width, touch.pageY / height);
}
