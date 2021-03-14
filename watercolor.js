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
        const edgeLengthFactor = 0.0012; //.001 - .0012 cloudiness
        const varianceFactor = 4; //2-4 circularity
        const magnitudeMean = 256; // 128 -256 crispness
        const magnitudeStd = 10; //10
        const divisionMean = 0.5; //0.5
        const divisionStd = 0.1; //.25
        const angleMean =
          ((ptIndex * 2 + 1) * 2 * Math.PI) / (originalPoints.length * 2);
        const angleStd = 20000; // 2-2000 not much

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

    const getBlobPoints = (n, x, y, size, iterations) => {
      let points = getPolygonPoints(n, x, y, size);
      for (let i = 0; i < iterations; i++) {
        points = getWarpedPolygonPoints(points);
      }
      return points;
    };

    const getWarpedBlobPoints = (basePoints, iterations) => {
      let points = basePoints;
      for (let i = 0; i < iterations; i++) {
        points = getWarpedPolygonPoints(basePoints);
      }
      return points;
    };

    const drawBlob = (points, fill, opacity = 1) => {
      context.beginPath();
      points.forEach((point) => {
        context.lineTo(point.position[0], point.position[1]);
      });

      context.closePath();
      context.globalAlpha = opacity;
      context.fillStyle = fill;
      context.fill();
    };

    const paintWatercolor = (blotches) => {
      // draw main blobs for each blotch
      // 3 iterations of deformation
      for (let k = 0; k < blotches.length; k++) {
        let points = getBlobPoints(
          blotches[k].n,
          blotches[k].x,
          blotches[k].y,
          blotches[k].size,
          3
        );
        drawBlob(points, blotches[k].fill, 1);
        // save blotch points for details later
        blotches[k].points = points;
      }

      for (let z = 0; z < 3; z++) {
        // use 3 different values to ramp up deformation
        for (let i = 0; i < 20; i++) {
          // twenty times at each level of deformation
          for (let k = 0; k < blotches.length; k++) {
            // go through each color
            for (let j = 0; j < 3; j++) {
              // three layers before switching to next ecolor
              let details = getWarpedBlobPoints(blotches[k].points, z + 1);
              drawBlob(details, blotches[k].fill, blotches[k].detailOpacity);
            }
          }
        }
      }
    };

    paintWatercolor([
      {
        iterations: 60,
        fill: "red",
        detailOpacity: 0.02,
        n: 10,
        x: 1000,
        y: 1000,
        size: 500,
      },
      {
        iterations: 60,
        fill: "blue",
        detailOpacity: 0.02,
        n: 10,
        x: 1500,
        y: 1500,
        size: 500,
      },
    ]);
  };
};

canvasSketch(sketch, settings);
