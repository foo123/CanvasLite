"use strict";

const CanvasLite = require(__dirname + '/../build/CanvasLite.js');
const canvas = new CanvasLite(300, 300);
const ctx = canvas.getContext('2d');
// peace sign
ctx.strokeStyle = "red";
ctx.lineWidth = 21;
ctx.beginPath();
ctx.arc(125, 125, 106, 0, 2*Math.PI);
ctx.closePath();
ctx.moveTo(125, 19);
ctx.lineTo(125, 19+212);
ctx.moveTo(125, 125);
ctx.lineTo(125-75, 125+75);
ctx.moveTo(125, 125);
ctx.lineTo(125+75, 125+75);
ctx.stroke();
// save drawing to disk
canvas.toPNG().then((png) => require('fs').writeFile(__dirname + '/peace.png', png, (err) => {
    if (err) console.log(err);
}));
