const canvasSketch = require("canvas-sketch");
const { lerp } = require("canvas-sketch-util/math");
const random = require("canvas-sketch-util/random");
const palettes = require("nice-color-palettes/1000.json");

const settings = {
  dimensions: [2048, 2048],
  animate: false,
};

const seed = random.getRandomSeed();

const nDetailLayers = 50; // 50 for stills, 8 for animation
const mainLayerOpacity = 0.75; // .75-1
const detailLayerOpacity = 0.05; // .1
const animationCoefficient = 25; // 25
const maxExpansionCoefficient = 50; // 50
const nSides = 10; // 8 - 10
const hasStroke = false;
const mainBlobIterations = 3; //3
const angleStd = Math.PI;
// angleMean is edgeNormal

const edgeLengthFactor = 0.001; // .001
const varianceFactor = 4; // 2 (circle) 4(abstract)
const magnitudeMean = 400; // 100 (circle) 400 (abstract)
const magnitudeStd = 0; /// 0
// division mean is 0.5
const divisionStd = 0.01; //0-.01

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
      (nextPoint.position[1] - currentPoint.position[1]) * -1,
    ];

    const isOutsideArcTanRange = edge[0] < 0;

    let edgeAngle = isOutsideArcTanRange
      ? Math.atan(edge[1] / edge[0]) + Math.PI
      : Math.atan(edge[1] / edge[0]);

    const edgeNormal = edgeAngle + Math.PI / 2;
    const edgeLength = Math.sqrt(edge[0] * edge[0] + edge[1] * edge[1]);

    /*
    if (ptIndex === 3) {
      console.log(currentPoint.position);
      console.log(nextPoint.position);
      console.log(edge);
      console.log("angle", edgeAngle);
      console.log("normal", edgeNormal);
      console.log("outside range", isOutsideArcTanRange);
    }
    */

    // calculate random value
    const magnitude =
      Math.abs(random.gaussian(magnitudeMean, magnitudeStd)) *
      edgeLength *
      edgeLengthFactor *
      currentPoint.variance *
      varianceFactor;
    const division = Math.abs(random.gaussian(0.5, divisionStd));
    const angle = Math.abs(random.gaussian(edgeNormal, angleStd));

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

const getWatercolorData = (blotches) => {
  // draw main blobs for each blotch
  // 3 iterations of deformation
  for (let k = 0; k < blotches.length; k++) {
    let points = getBlobPoints(
      blotches[k].n,
      blotches[k].x,
      blotches[k].y,
      blotches[k].size,
      mainBlobIterations
    );
    // save blotch points for details later
    blotches[k].basePoints = points;
    blotches[k].detailPoints = [];
  }

  for (let z = 0; z < 3; z++) {
    // use 3 different values to ramp up deformation
    for (let i = 0; i < nDetailLayers; i++) {
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
          blotches[k].detailPoints.push(details);
        }
      }
    }
  }

  return blotches;
};

const sketch = () => {
  const numColors = 2;
  const palette = random.shuffle(random.pick(palettes)).slice(0, numColors);
  const blotchesData = getWatercolorData([
    {
      //fill: "#333",
      fill: palette[0],
      detailOpacity: detailLayerOpacity,
      n: nSides,
      x: settings.dimensions[0] / 2 + 300,
      y: settings.dimensions[1] / 2,
      size: 500,
      stroke: hasStroke,
    },
    {
      //fill: "#FFDE6A",
      fill: palette[1],
      detailOpacity: detailLayerOpacity,
      n: nSides,
      x: settings.dimensions[0] / 2 - 300,
      y: settings.dimensions[1] / 2,
      size: 500,
      stroke: hasStroke,
    },
  ]);

  return ({ context, width, height, time }) => {
    // set random seed

    random.setSeed(seed);

    const drawBlob = (
      points,
      fill,
      opacity = mainLayerOpacity,
      stroke = false
    ) => {
      context.beginPath();
      points.forEach((point) => {
        context.lineTo(point.position[0], point.position[1]);
      });

      context.closePath();
      context.globalAlpha =
        opacity < mainLayerOpacity ? opacity : mainLayerOpacity;

      if (stroke) {
        // const oldOpacity = context.globalAlpha;
        // context.globalAlpha = 0.5 * Math.sin(time) + 0.5;
        context.stroke();
        // context.globalAlpha = oldOpacity;
      }
      context.fillStyle = fill;
      context.fill();
    };

    const paint = (blotchesData) => {
      // draw main blobs for each blotch
      // 3 iterations of deformation

      let expansionCoefficient =
        settings.animate === false
          ? 1
          : animationCoefficient * Math.log(time + 1);

      if (expansionCoefficient > maxExpansionCoefficient) {
        expansionCoefficient = maxExpansionCoefficient;
      }

      for (let k = 0; k < blotchesData.length; k++) {
        const newPoints = blotchesData[k].basePoints.map((point) => {
          const x =
            point.position[0] + expansionCoefficient * Math.cos(point.angle);
          const y =
            point.position[1] + expansionCoefficient * Math.sin(point.angle);

          return {
            position: [x, y],
            variance: point.variance,
          };
        });
        drawBlob(newPoints, blotchesData[k].fill, 1, blotchesData[k].stroke);
      }

      // details
      for (let m = 0; m < blotchesData[0].detailPoints.length / 3; m++) {
        for (let k = 0; k < blotchesData.length; k++) {
          for (let n = 0; n < 3; n++) {
            const points = blotchesData[k].detailPoints[m * 3 + n];

            const newPoints = points.map((point) => {
              const x =
                point.position[0] +
                expansionCoefficient * Math.cos(point.angle);

              const y =
                point.position[1] +
                expansionCoefficient * Math.sin(point.angle);

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

    context.clearRect(0, 0, width, height);
    // context.fillStyle = "white";
    // context.fillRect(0, 0, width, height);

    // animate
    paint(blotchesData);
  };
};

canvasSketch(sketch, settings);
