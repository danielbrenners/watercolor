const canvasSketch = require("canvas-sketch");
const { lerp } = require("canvas-sketch-util/math");
const random = require("canvas-sketch-util/random");
const palettes = require("nice-color-palettes/1000.json");

const settings = {
  dimensions: [2048, 2048],
  animate: true,
};

const seed = random.getRandomSeed();

const sketch = () => {
  return ({ context, width, height, time, playhead, frame }) => {
    // set random seed
    random.setSeed(seed);

    const getPolygonPoints = (n, x, y, size) => {
      let points = [];
      for (let ptIndex = 0; ptIndex < n; ptIndex++) {
        const edgeVarianceMean = 0.25;
        const edgeVarianceStd = 0.1;
        const edgeVariance = Math.abs(
          random.gaussian(edgeVarianceMean, edgeVarianceStd)
        );
        let u = Math.cos((ptIndex * 2 * Math.PI) / n);
        let v = Math.sin((ptIndex * 2 * Math.PI) / n);
        const angle = Math.atan(v / u);
        let scaledU = u * size;
        let scaledV = v * size;
        let magnitude = Math.sqrt(scaledU * scaledU + scaledV * scaledV);

        points.push({
          position: [u * size + x, v * size + y],
          angle: angle,
          magnitude: magnitude,
          variance: edgeVariance,
        });
      }
      return points;
    };

    const getWarpedPolygonPoints = (x, y, size, originalPoints) => {
      let newPoints = [];
      for (let ptIndex = 0; ptIndex < originalPoints.length; ptIndex++) {
        // get current and next point
        const currentPoint = originalPoints[ptIndex];
        const nextPoint =
          ptIndex < originalPoints.length - 1
            ? originalPoints[ptIndex + 1]
            : originalPoints[0];

        // smaller edges should have less magnitude change
        // edge to bisect
        const edge = [
          nextPoint.position[0] - currentPoint.position[0],
          nextPoint.position[1] - currentPoint.position[1],
        ];
        const edgeUV = [edge[0] / size - x, edge[1] / size - y];
        const edgeAngle = Math.atan(edgeUV[1] / edgeUV[0]);
        const edgeNormal = edgeAngle + Math.PI / 2;
        const edgeLength = Math.sqrt(edge[0] * edge[0] + edge[1] * edge[1]);

        // parameters
        const edgeLengthFactor = 0.0012;
        const varianceFactor = 4; //2-4 circularity
        const magnitudeMean = 256; // 128 -256 crispness
        const magnitudeStd = 10;
        const divisionMean = 0.5;
        const divisionStd = 0.1;
        const angleMean = edgeNormal; //((ptIndex * 2 + 1) * 2 * Math.PI) / (originalPoints.length * 2);
        const angleStd = 200000;

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
        const newX =
          lerp(currentPoint.position[0], nextPoint.position[0], division) +
          magnitude * Math.cos(angle);
        const newY =
          lerp(currentPoint.position[1], nextPoint.position[1], division) +
          magnitude * Math.sin(angle);
        Math.sin((ptIndex * 2 * Math.PI) / (originalPoints.length * 2));
        const newMagnitude = Math.sqrt(newX * newX + newY * newY);

        // add to new array
        newPoints.push(currentPoint);
        newPoints.push({
          position: [newX, newY],
          angle: angle,
          magnitude: newMagnitude,
          variance: currentPoint.variance,
        });
      }
      return newPoints;
    };

    const getBlobPoints = (n, x, y, size, iterations) => {
      let points = getPolygonPoints(n, x, y, size);
      for (let i = 0; i < iterations; i++) {
        points = getWarpedPolygonPoints(x, y, size, points);
      }
      return points;
    };

    const getDetailPoints = (x, y, size, basePoints, iterations) => {
      let points = basePoints;
      for (let i = 0; i < iterations; i++) {
        points = getWarpedPolygonPoints(x, y, size, basePoints);
      }
      return points;
    };

    const drawBlob = (points, fill, opacity = 1, stroke = false) => {
      context.beginPath();
      points.forEach((point) => {
        context.lineTo(point.position[0], point.position[1]);
      });

      context.closePath();
      context.globalAlpha = opacity > 0.05 ? 0.05 : opacity;
      if (stroke) {
        context.stroke();
      }
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
        drawBlob(points, blotches[k].fill, 1, blotches[k].stroke);
        // save blotch points for details later
        blotches[k].basePoints = points;
        blotches[k].detailPoints = [];
      }

      for (let z = 0; z < 3; z++) {
        // use 3 different values to ramp up deformation
        for (let i = 0; i < 20; i++) {
          // twenty times at each level of deformation
          for (let k = 0; k < blotches.length; k++) {
            // go through each color
            for (let j = 0; j < 3; j++) {
              // three layers before switching to next ecolor
              let details = getDetailPoints(
                blotches[k].x,
                blotches[k].y,
                blotches[k].size,
                blotches[k].basePoints,
                z + 1
              );
              drawBlob(
                details,
                blotches[k].fill,
                blotches[k].detailOpacity,
                blotches[k].stroke
              );
              blotches[k].detailPoints.push(details);
            }
          }
        }
      }

      return blotches;
    };

    const repaint = (blotchesData) => {
      // draw main blobs for each blotch
      // 3 iterations of deformation
      for (let k = 0; k < blotchesData.length; k++) {
        const newPoints = blotchesData[k].basePoints.map((point) => {
          if (point.variance < 0.25) {
            const x =
              point.position[0] -
              time * point.variance * 1 * Math.cos(point.angle);
            const y =
              point.position[1] -
              time * point.variance * 1 * Math.sin(point.angle);
            return {
              position: [x, y],
              variance: point.variance,
            };
          } else {
            const x =
              point.position[0] +
              time * point.variance * 1 * Math.cos(point.angle);
            const y =
              point.position[1] +
              time * point.variance * 1 * Math.sin(point.angle);
            return {
              position: [x, y],
              variance: point.variance,
            };
          }
        });
        drawBlob(newPoints, blotchesData[k].fill, 1, blotchesData[k].stroke);
      }

      for (let m = 0; m < blotchesData[0].detailPoints.length / 3; m++) {
        for (let k = 0; k < blotchesData.length; k++) {
          for (let n = 0; n < 3; n++) {
            const points = blotchesData[k].detailPoints[m * 3 + n];

            const newPoints = points.map((point) => {
              const x =
                point.position[0] +
                time * point.variance * 10 * Math.cos(point.angle);
              const y =
                point.position[1] +
                time * point.variance * 10 * Math.sin(point.angle);
              return {
                position: [x, y],
                variance: point.variance,
              };
            });

            drawBlob(
              newPoints,
              blotchesData[k].fill,
              blotchesData[k].detailOpacity,
              blotchesData[k].stroke
            );
          }
        }
      }
    };

    // render
    const numColors = 2;
    const palette = random.shuffle(random.pick(palettes)).slice(0, numColors);
    context.clearRect(0, 0, width, height);
    const blotchesData = paintWatercolor([
      {
        // fill: "#333",
        fill: palette[0],
        detailOpacity: 0.04,
        n: 10,
        x: width / 2 - 200,
        y: height / 2,
        size: 500,
        stroke: true,
      },
      {
        // fill: "#FFDE6A",
        fill: palette[1],
        detailOpacity: 0.04,
        n: 10,
        x: width / 2 + 200,
        y: height / 2,
        size: 500,
        stroke: true,
      },
    ]);
    // animate
    //repaint(blotchesData);
  };
};

canvasSketch(sketch, settings);
