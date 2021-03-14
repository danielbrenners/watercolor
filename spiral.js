const canvasSketch = require("canvas-sketch");
const { lerp } = require("canvas-sketch-util/math");
const random = require("canvas-sketch-util/random");
const palettes = require("nice-color-palettes/1000.json");

const settings = {
  dimensions: [2048, 2048],
};

const sketch = () => {
  return ({ context, width, height }) => {
    const gaussianFactor = 0.04;
    context.clearRect(0, 0, width, height);

    context.beginPath();
    context.moveTo(width / 2, height / 2);
    const a = 5;
    const b = 5;
    for (i = 0; i < random.rangeFloor(500, 1000); i++) {
      angle = 0.2 * i;
      x =
        width / 2 +
        (a + b * angle) * Math.cos(angle) +
        gaussianFactor * angle * random.gaussian();
      y =
        height / 2 +
        (a + b * angle) * Math.sin(angle) +
        gaussianFactor * angle * random.gaussian();

      context.lineTo(x, y);
    }

    context.strokeStyle = "#000";
    context.lineWidth = 10;
    context.stroke();
  };
};

canvasSketch(sketch, settings);
