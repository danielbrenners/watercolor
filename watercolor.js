const canvasSketch = require("canvas-sketch");
const { lerp } = require("canvas-sketch-util/math");

const settings = {
  dimensions: [2048, 2048],
};

const sketch = () => {
  return ({ context, width, height }) => {
    const getPolygonPoints = (n, x, y, size) => {
      let points = [];
      for (edge = 0; edge < n; edge++) {
        let u = x + size * Math.cos((edge * 2 * Math.PI) / n);
        let v = y + size * Math.sin((edge * 2 * Math.PI) / n);
        points.push([u, v]);
      }
      return points;
    };

    const warpPoints = (points) => {
      let newPoints = [];
      points.forEach((point, index) => {
        let currentPoint = point;
        let nextPoint =
          index < points.length - 1 ? points[index + 1] : points[0];
        let midPoint = [
          lerp(currentPoint[0], nextPoint[0], 0.5) + 100,
          lerp(currentPoint[1], nextPoint[1], 0.5) + 10,
        ];
        newPoints.push(point);
        newPoints.push(midPoint);
      });

      return newPoints;
    };

    points = getPolygonPoints(4, width / 2, height / 2, 500);
    const warpedPoints = warpPoints(points);

    context.beginPath();
    warpedPoints.forEach((point) => {
      context.lineTo(point[0], point[1]);
    });

    context.closePath();
    //context.lineWidth = 15;
    //context.stroke();
    context.fillStyle = "#333333";
    context.fill();
  };
};

canvasSketch(sketch, settings);
