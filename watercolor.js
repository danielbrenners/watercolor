const canvasSketch = require("canvas-sketch");
const { lerp } = require("canvas-sketch-util/math");

const settings = {
  dimensions: [2048, 2048],
};

const sketch = () => {
  return ({ context, width, height }) => {
    const getPolygonPoints = (n, x, y, size) => {
      let points = [];
      for (ptIndex = 0; ptIndex < n; ptIndex++) {
        let u = x + size * Math.cos((ptIndex * 2 * Math.PI) / n);
        let v = y + size * Math.sin((ptIndex * 2 * Math.PI) / n);
        points.push({ position: [u, v] });
      }
      return points;
    };

    const warpPolygonPoints = (originalPoints) => {
      let newPoints = [];
      for (ptIndex = 0; ptIndex < originalPoints.length; ptIndex++) {
        const currentPoint = originalPoints[ptIndex];
        const nextPoint =
          ptIndex < originalPoints.length - 1
            ? originalPoints[ptIndex + 1]
            : originalPoints[0];

        const midU =
          lerp(currentPoint.position[0], nextPoint.position[0], 0.5) + 10;
        const midV =
          lerp(currentPoint.position[1], nextPoint.position[1], 0.5) + 100;
        const midPoint = [midU, midV];

        newPoints.push({
          position: [currentPoint.position[0], currentPoint.position[1]],
        });
        newPoints.push({ position: [midPoint[0], midPoint[1]] });
      }
      return newPoints;
    };

    points = getPolygonPoints(4, width / 2, height / 2, 500);
    const warpedPoints = warpPolygonPoints(points);

    context.beginPath();
    warpedPoints.forEach((point) => {
      context.lineTo(point.position[0], point.position[1]);
    });

    context.closePath();
    //context.lineWidth = 15;
    //context.stroke();
    context.fillStyle = "#333333";
    context.fill();
  };
};

canvasSketch(sketch, settings);
