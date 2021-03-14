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
      for (let ptIndex = 0; ptIndex < n; ptIndex++) {
        const edgeVarianceMean = 0.25;
        const edgeVarianceStd = 0.1;
        const edgeVariance = Math.abs(
          random.gaussian(edgeVarianceMean, edgeVarianceStd)
        );
        let u = x + size * Math.cos((ptIndex * 2 * Math.PI) / n);
        let v = y + size * Math.sin((ptIndex * 2 * Math.PI) / n);
        points.push({ position: [u, v], variance: edgeVariance });
      }
      return points;
    };

    const getWarpedPolygonPoints = (originalPoints) => {
      let newPoints = [];
      for (let ptIndex = 0; ptIndex < originalPoints.length; ptIndex++) {
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
        const varianceFactor = 4;
        const magnitudeMean = 64;
        const magnitudeStd = 10;
        const divisionMean = 0.5;
        const divisionStd = 0.25;
        const angleMean =
          ((ptIndex * 2 + 1) * 2 * Math.PI) / (originalPoints.length * 2);
        const angleStd = 2;

        // calculate random value
        const magnitude =
          Math.abs(random.gaussian(magnitudeMean, magnitudeStd)) *
          edgeLength *
          edgeLengthFactor *
          currentPoint.variance *
          varianceFactor;
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
        newPoints.push(currentPoint);
        newPoints.push({
          position: [midPoint[0], midPoint[1]],
          variance: currentPoint.variance,
        });
      }
      return newPoints;
    };

    const getBlobPoints = (iterations, basePoints) => {
      let points;
      if (basePoints) {
        points = basePoints;
      } else {
        points = getPolygonPoints(10, width / 2, height / 2, 500);
      }
      for (let i = 0; i < iterations; i++) {
        points = getWarpedPolygonPoints(points);
      }
      return points;
    };

    const drawBlob = (points, opacity = 1) => {
      context.beginPath();
      points.forEach((point) => {
        context.lineTo(point.position[0], point.position[1]);
      });

      context.closePath();
      context.globalAlpha = opacity;
      context.fillStyle = "#333333";
      context.fill();
    };

    const drawDetails = (iterations, opacity) => {
      for (let i = 0; i < iterations; i++) {
        let details = getBlobPoints(3, baseBlobPoints);
        drawBlob(details, opacity);
      }
    };

    const baseBlobPoints = getBlobPoints(3);
    drawBlob(baseBlobPoints);
    drawDetails(50, 0.1);
  };
};

canvasSketch(sketch, settings);
