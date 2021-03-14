const canvasSketch = require("canvas-sketch");
const { lerp } = require("canvas-sketch-util/math");
const random = require("canvas-sketch-util/random");

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
        // get current and next point
        const currentPoint = originalPoints[ptIndex];
        const nextPoint =
          ptIndex < originalPoints.length - 1
            ? originalPoints[ptIndex + 1]
            : originalPoints[0];

        // smaller edges should have less magnitude change
        const edgeLength = Math.sqrt(
          (nextPoint.position[0] - currentPoint.position[0]) *
            (nextPoint.position[0] - currentPoint.position[0]) +
            (nextPoint.position[1] - currentPoint.position[1]) *
              (nextPoint.position[1] - currentPoint.position[1])
        );

        // parameters
        const edgeLengthFactor = 0.004;
        const magnitudeMean = 64;
        const magnitudeStd = 10;
        const divisionMean = 0.5;
        const divisionStd = 0.2;
        const angleMean =
          ((ptIndex * 2 + 1) * 2 * Math.PI) / (originalPoints.length * 2);
        const angleStd = 1;

        // calculate random value
        const magnitude =
          Math.abs(random.gaussian(magnitudeMean, magnitudeStd)) *
          edgeLength *
          edgeLengthFactor;
        const division = Math.abs(random.gaussian(divisionMean, divisionStd));
        const angle = Math.abs(random.gaussian(angleMean, angleStd));

        // get new point
        const midU =
          lerp(currentPoint.position[0], nextPoint.position[0], division) +
          magnitude * Math.cos(angle);
        const midV =
          lerp(currentPoint.position[1], nextPoint.position[1], division) +
          magnitude * Math.sin(angle);
        Math.sin((ptIndex * 2 * Math.PI) / (originalPoints.length * 2));
        const midPoint = [midU, midV];

        // add to new array
        newPoints.push({
          position: [currentPoint.position[0], currentPoint.position[1]],
        });
        newPoints.push({ position: [midPoint[0], midPoint[1]] });
      }
      return newPoints;
    };

    const getBlob = (iterations) => {
      let points = getPolygonPoints(10, width / 2, height / 2, 500);
      for (i = 0; i < iterations; i++) {
        points = warpPolygonPoints(points);
      }
      return points;
    };

    const blobPoints = getBlob(6);

    context.beginPath();
    blobPoints.forEach((point) => {
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
