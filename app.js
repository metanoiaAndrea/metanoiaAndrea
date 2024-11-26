// Paletas de color

const pastelPalette = [
    [255, 179, 186],
    [255, 223, 186],
    [255, 255, 186],
    [186, 255, 201],
    [186, 225, 255],
    [201, 186, 255],
    [255, 186, 250]
];

const vibrantPalette = [
    [255, 0, 0],     // Rojo
    [255, 165, 0],   // Naranja
    [255, 255, 0],   // Amarillo
    [0, 255, 0],     // Verde
    [0, 255, 255],   // Cian
    [0, 0, 255],     // Azul
    [128, 0, 128]    // Morado
];

const coolPalette = [
    [0, 0, 128],     // Azul oscuro
    [0, 128, 128],   // Verde azulado
    [0, 255, 255],   // Cian
    [135, 206, 250], // Azul cielo
    [173, 216, 230], // Azul claro
    [224, 255, 255], // Azul muy claro
    [240, 248, 255]  // Azul alice
];

const warmPalette = [
    [128, 0, 0],     // Rojo oscuro
    [165, 42, 42],   // Marrón
    [255, 69, 0],    // Naranja rojizo
    [255, 140, 0],   // Naranja oscuro
    [255, 215, 0],   // Oro
    [255, 255, 0],   // Amarillo
    [255, 228, 181]  // Mocasín
];

const blueMonochromePalette = [
    [230, 240, 255],
    [204, 224, 255],
    [179, 208, 255],
    [153, 192, 255],
    [128, 176, 255],
    [102, 160, 255],
    [77, 144, 255]
];

const earthTonesPalette = [
    [101, 67, 33],   // Marrón oscuro
    [120, 94, 47],   // Marrón medio
    [141, 110, 99],  // Marrón claro
    [205, 133, 63],  // Marrón arenoso
    [222, 184, 135], // Beige
    [245, 222, 179], // Trigo
    [255, 228, 196]  // Blanched Almond
];

const sunsetPalette = [
    [255, 94, 77],   // Rojo anaranjado
    [255, 146, 51],  // Naranja
    [255, 201, 107], // Amarillo anaranjado
    [255, 226, 159], // Amarillo claro
    [255, 246, 211], // Crema
    [218, 194, 255], // Lavanda
    [179, 152, 255]  // Morado claro
];

const darkVioletPalette = [
    [48, 25, 52],    // Violeta muy oscuro
    [75, 37, 97],    // Púrpura intenso
    [102, 51, 153],  // Violeta clásico (Purple)
    [123, 63, 162],  // Violeta profundo
    [142, 68, 173],  // Lavanda oscura
    [93, 53, 86],    // Ciruela madura
    [64, 28, 52]     // Berenjena
];


// CANVAS PART

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


noise.seed(Math.random());
paper.setup(canvas);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  paper.view.viewSize = new paper.Size(canvas.width, canvas.height);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// MORPHING PART

const shapes = {};
let nextShape;
let morph = 0;
let morphSpeed = 0.009; // Ajusta para cambiar la velocidad de transición
let isPaused = true;
let pauseTime = 200; // Ajusta para cambiar el tiempo de pausa (en frames)
let pauseCounter = 0;

let pauseDuration = 20; // Pausa de 3000 milisegundos (3 segundos)
let pauseStartTime = 0;

// Funciones para obtener las formas
function getTextPath(text, fontUrl, fontSize) {
  return new Promise((resolve, reject) => {
    opentype.load(fontUrl, function(err, font) {
      if (err) {
        reject('No se pudo cargar la fuente: ' + err);
      } else {
        const pathData = font.getPath(text, 0, 0, fontSize).toPathData(2);
        const textPath = new paper.Path(pathData);
        resolve(textPath);
      }
    });
  });
}

function resamplePath(path, numPoints) {
  const length = path.length;
  const resampled = [];
  for (let i = 0; i <= numPoints; i++) {
    const point = path.getPointAt((i / numPoints) * length);
    resampled.push({ x: point.x, y: point.y });
  }
  return resampled;
}

function scaleAndCenterPoints(points, width, height) {
  // Calcula los límites
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  points.forEach(pt => {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  });

  // Calcula escala y desplazamiento
  const scale = Math.min(width / (maxX - minX), height / (maxY - minY)) * 0.8;
  const offsetX = (width - (maxX + minX) * scale) / 2;
  const offsetY = (height - (maxY + minY) * scale) / 2;

  // Invertir el eje Y y aplicar escala y desplazamiento
  return points.map(pt => ({
    x: pt.x * scale + offsetX,
    y: height - (pt.y * scale + offsetY)
  }));
}

async function getTextPoints(text, fontUrl, fontSize, numPoints) {
  const path = await getTextPath(text, fontUrl, fontSize);
  const points = resamplePath(path, numPoints);
  const scaledPoints = scaleAndCenterPoints(points, canvas.width, canvas.height);
  return scaledPoints;
}


function resamplePoints(points, numPoints) {
    const resampled = [];
    const totalLength = calculateTotalLength(points);
    const segmentLength = totalLength / numPoints;
    let accumulatedLength = 0;
    let targetLength = segmentLength;
    resampled.push(points[0]);

    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const dist = Math.hypot(dx, dy);
        accumulatedLength += dist;

        while (accumulatedLength >= targetLength) {
            const ratio = (accumulatedLength - targetLength) / dist;
            const x = points[i - 1].x * (1 - ratio) + points[i].x * ratio;
            const y = points[i - 1].y * (1 - ratio) + points[i].y * ratio;
            resampled.push({
                x,
                y
            });
            targetLength += segmentLength;
        }
    }

    // Asegura que el número de puntos es exacto
    while (resampled.length < numPoints) {
        resampled.push(resampled[resampled.length - 1]);
    }

    return resampled;
}
/*
function getMaxY(points) {
    let maxY = -Infinity;
    points.forEach(pt => {
      if (pt.y > maxY) maxY = pt.y;
    });
    return maxY;
  }

function calculateTotalLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        length += Math.hypot(dx, dy);
    }
    return length;
}

const shapes = {};
let shapesLoaded = 0;

function onShapeLoaded() {
    shapesLoaded++;
    if (shapesLoaded === 2) {
        // Una vez que las formas de texto están cargadas, iniciamos la animación
        startAnimation();
    }
}*/

const totalPoints = 50000; // Ajusta según tus necesidades
/*
getTextPoints('ANDREA', 'fonts/sho.ttf', 250, totalPoints, function (points) {
    shapes.andrea = points;
    onShapeLoaded();
});

getTextPoints('IS', 'fonts/sho.ttf', 250, totalPoints, function (points) {
    shapes.is = points;
    onShapeLoaded();
});
*//*
// Las formas del corazón y la flor se pueden obtener inmediatamente
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
*/

function getHeartPoints(centerX, centerY, size, numPoints) {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
        const t = (Math.PI * 2 * i) / numPoints;
        const x = centerX + 10 * 16 * Math.pow(Math.sin(t), 3);
        const y = centerY - 10 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        points.push({
            x,
            y
        });
    }
    return points;
}

function getFlowerPoints(centerX, centerY, size, numPoints, options = {}) {
    const points = [];
    const petals = options.petals || 20; // Número de pétalos
    const petalWidth = options.petalWidth || 0.7; // Ancho de los pétalos
    const innerRadius = options.innerRadius || 0.3; // Radio interno (centro de la flor)
  
    for (let i = 0; i < numPoints; i++) {
      const angle = (Math.PI * 2 * i) / numPoints;
      const r =
        size * 4 *
        (innerRadius +
          (1 - innerRadius) *
            Math.pow(Math.abs(Math.cos((petals * angle) / 2)), petalWidth));
  
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      points.push({ x, y });
    }
  
    return points;
  }

  function getRosePoints(centerX, centerY, size, numPoints, options = {}) {
    const k = options.k || 5; // Número de pétalos si k es entero
    const points = [];
    const maxAngle = Math.PI * 2;

    for (let i = 0; i <= numPoints; i++) {
        const t = (maxAngle * i) / numPoints;
        const r = size * Math.cos(k * t);
        const x = centerX + r * Math.cos(t);
        const y = centerY + r * Math.sin(t);
        points.push({ x, y });
    }
    return points;
}

function getFivePointStarPoints(centerX, centerY, size) {
  const points = [];
  const outerRadius = size;
  // Calculamos el radio interior para una estrella de 5 puntas perfecta
  const innerRadius = size * Math.sin(Math.PI / 10) / Math.sin(7 * Math.PI / 10);
  const angleOffset = -Math.PI / 2; // Rotamos para que una punta esté hacia arriba

  for (let i = 0; i < 10; i++) {
      const angle = angleOffset + (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push({ x, y });
  }
  return points;
}

function getButterflyPoints(centerX, centerY, size, numPoints) {
  const points = [];
  const scale = size / 50; // Ajusta el tamaño de la mariposa
  const maxT = 12 * Math.PI;

  for (let i = 0; i <= numPoints; i++) {
      const t = (maxT * i) / numPoints;
      const x =
          Math.sin(t) *
          (Math.exp(Math.cos(t)) -
              2 * Math.cos(4 * t) -
              Math.pow(Math.sin(t / 12), 5));
      const y =
          Math.cos(t) *
          (Math.exp(Math.cos(t)) -
              2 * Math.cos(4 * t) -
              Math.pow(Math.sin(t / 12), 5));
      points.push({
          x: centerX + scale * x,
          y: centerY - scale * y,
      });
  }
  return points;
}

function getStarPoints(centerX, centerY, size, numPoints) {
  const points = [];
  const outerRadius = size;
  const innerRadius = size / 2;
  const angleStep = Math.PI / numPoints;

  for (let i = 0; i < 2 * numPoints; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * angleStep;
      const x = centerX + radius * Math.sin(angle);
      const y = centerY - radius * Math.cos(angle);
      points.push({ x, y });
  }
  return points;
}

//shapes.heart = getHeartPoints(centerX, centerY, size, totalPoints);
//shapes.flower = getFlowerPoints(centerX, centerY, size, totalPoints);

let currentShape;

function startAnimation() {
    currentShape = shapes.flower;
    nextShape = shapes.andrea;
    animate();
}


// Funciones de interpolación y dibujo
function interpolateShapes(shapeA, shapeB, t) {
    const interpolated = [];
    for (let i = 0; i < shapeA.length; i++) {
      const x = shapeA[i].x + (shapeB[i].x - shapeA[i].x) * t;
      const y = shapeA[i].y + (shapeB[i].y - shapeA[i].y) * t;
      interpolated.push({ x, y });
    }
    return interpolated;
  }
  
  function drawShape(points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fill();
  }
  
  function updateMorph() {
    if (!isPaused) {
      morph += morphSpeed;
      if (morph >= 1) {
        morph = 1;
        isPaused = true;
      }
    } else {
      pauseCounter++;
      if (pauseCounter >= pauseTime) {
        pauseCounter = 0;
        isPaused = false;
        morph = 0;
  
        currentShape = nextShape;
        pauseTime = 200;
        if (nextShape === shapes.andrea) {
          nextShape = shapes.R;
        } else if (nextShape === shapes.R) {
          nextShape = shapes.is;
        } else if (nextShape === shapes.is) {
          nextShape = shapes.heart;
        } else if (nextShape === shapes.heart) {
          nextShape = shapes.flower;
          pauseTime = 400
        } else {
          nextShape = shapes.andrea;
        }
      }
    }
  }
// BACKGROUND GRADIENT

let time = 0;
const stepSize = 4; // Ajusta según el rendimiento y la calidad

const palettes = [
    pastelPalette, // eso que tu me das
    darkVioletPalette, // gata only
    vibrantPalette, // She is a rainbow
    coolPalette, // en otra vida
    warmPalette, // videogames
    blueMonochromePalette, // holocene
    earthTonesPalette, // apocalypse
    sunsetPalette // here comes the sun
];

let currentPaletteIndex = 0;
let nextPaletteIndex = 1;
let paletteTransitionProgress = 0; // Valor entre 0 y 1
let isTransitioningPalette = false;
let paletteTransitionSpeed = 0.1; // Ajusta la velocidad de transición de la paleta



function interpolateColor(color1, color2, factor) {
    const result = [];
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(color1[i] + factor * (color2[i] - color1[i]));
    }
    return result;
}

function getColorFromPalette(value, palette1, palette2, progress) {
    const normalizedValue = (value + 1) / 2; // Valor entre 0 y 1
    const scaledValue = normalizedValue * (palette1.length - 1);
    const index = Math.floor(scaledValue);
    const nextIndex = (index + 1) % palette1.length;
    const factor = scaledValue - index;

    // Obtener colores interpolados de cada paleta
    const color1Palette1 = palette1[index];
    const color2Palette1 = palette1[nextIndex];
    const color1 = interpolateColor(color1Palette1, color2Palette1, factor);

    const color1Palette2 = palette2[index];
    const color2Palette2 = palette2[nextIndex];
    const color2 = interpolateColor(color1Palette2, color2Palette2, factor);

    // Interpolar entre las dos paletas según el progreso
    const finalColor = interpolateColor(color1, color2, progress);

    return finalColor;
}

const escalaEspacial = 0.001;
const velocidadTemporal = 0.009;

function drawBackground() {
    time += velocidadTemporal;

    // Actualizar el progreso de la transición de paleta
    if (isTransitioningPalette) {
        paletteTransitionProgress += paletteTransitionSpeed;
        if (paletteTransitionProgress >= 1) {
            paletteTransitionProgress = 0;
            isTransitioningPalette = false;
            currentPaletteIndex = nextPaletteIndex;
            nextPaletteIndex = (nextPaletteIndex + 1) % palettes.length;
        }
    }

    const currentPalette = palettes[currentPaletteIndex];
    const nextPalette = palettes[nextPaletteIndex];

    for (let x = 0; x < canvas.width; x += stepSize) {
        for (let y = 0; y < canvas.height; y += stepSize) {
            const value = noise.perlin3(x * escalaEspacial, y * escalaEspacial, time);
            const rgb = getColorFromPalette(value, currentPalette, nextPalette, paletteTransitionProgress);
            ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            ctx.fillRect(x, y, stepSize, stepSize);
        }
    }
}

canvas.addEventListener('click', changePalette);
canvas.addEventListener('touchstart', changePalette);

function changePalette() {
    if (!isTransitioningPalette) {
        isTransitioningPalette = true;
        nextPaletteIndex = (currentPaletteIndex + 1) % palettes.length;
    }
}

// ANIMATION



function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    updateMorph();
    
    if (isPaused) {
        // Dibuja la figura actual sin interpolación
        drawShape(nextShape);
      } else {
        // Realiza la interpolación entre las formas
        const interpolatedShape = interpolateShapes(currentShape, nextShape, morph);
        drawShape(interpolatedShape);
      }
  //drawShape(interpolatedShape);

    //drawShape(interpolatedShape);

    requestAnimationFrame(animate);
}


// Cargar las formas y comenzar la animación
(async function() {
    const fontUrl = 'fonts/PlayfulTime-BLBB8.ttf';
    const fontSize = 200;
    const numPoints = 1000;
  
    // Cargar las formas de texto
    //shapes.andrea = await getTextPoints('U', fontUrl, fontSize, numPoints - 1);
    //shapes.is = await getTextPoints('A', fontUrl, fontSize, numPoints - 1);
    //shapes.R = await getTextPoints('R', fontUrl, fontSize, numPoints - 1);

  
    // Cargar las formas de corazón y flor
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 50;
  
    shapes.andrea = await getRosePoints(centerX, centerY, size * 2, numPoints - 1);
    shapes.is = getFlowerPoints(centerX, centerY, size, numPoints, {petals: 7, width: 0.1, radius: 0.9})
    shapes.R = await getButterflyPoints(centerX, centerY, size * 60, numPoints - 1);
    shapes.heart = getHeartPoints(centerX, centerY, size, numPoints);
    shapes.flower = getFlowerPoints(centerX, centerY, size, numPoints);
  
    // Iniciar la animación
    console.log('Formas cargadas:', shapes);
    console.log('Iniciando animación');
    startAnimation();
  })();

animate();

