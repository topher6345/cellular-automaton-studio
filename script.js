"use strict";
exports.__esModule = true;
var canvas_1 = require("canvas");
var fs = require("fs");
var canvas = canvas_1.createCanvas(200, 200);
var ctx = canvas.getContext("2d");
// Write "Awesome!"
ctx.font = "30px Impact";
ctx.rotate(0.1);
ctx.fillText("Awesome!", 50, 100);
// Draw line under text
var text = ctx.measureText("Awesome!");
ctx.strokeStyle = "rgba(0,0,0,0.5)";
ctx.beginPath();
ctx.lineTo(50, 102);
ctx.lineTo(50 + text.width, 102);
ctx.stroke();
// Draw cat with lime helmet
canvas_1.loadImage("lime-cat.jpg").then(function (image) {
    ctx.drawImage(image, 50, 0, 70, 70);
    console.log('<img src="' + canvas.toDataURL() + '" />');
    writeFile(canvas.toDataURL());
});
function writeFile(dataURL) {
    var regex = /^data:.+\/(.+);base64,(.*)$/;
    var matches = dataURL.match(regex);
    var ext = matches[1];
    var data = matches[2];
    var buffer = Buffer.from(data, "base64");
    fs.writeFileSync("data." + ext, buffer);
}
