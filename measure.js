const fs = require('fs');
const PNG = require('pngjs').PNG;
const data = fs.readFileSync('public/assets/premium-wheels/Stand.png');
const stand = PNG.sync.read(data);

let sb = { minX: stand.width, maxX: 0, minY: stand.height, maxY: 0 };
for (let y = 0; y < stand.height; y++) {
    for (let x = 0; x < stand.width; x++) {
        let idx = (stand.width * y + x) << 2;
        if (stand.data[idx + 3] >= 50) { // Opaque
            if (x < sb.minX) sb.minX = x;
            if (x > sb.maxX) sb.maxX = x;
            if (y < sb.minY) sb.minY = y;
            if (y > sb.maxY) sb.maxY = y;
        }
    }
}
console.log(`Stand Bounds: X[${sb.minX}-${sb.maxX}], Y[${sb.minY}-${sb.maxY}]`);

const wheel = PNG.sync.read(fs.readFileSync('public/assets/premium-wheels/Wheel.png'));
let wb = { minX: wheel.width, maxX: 0, minY: wheel.height, maxY: 0 };
for (let y = 0; y < wheel.height; y++) {
    for (let x = 0; x < wheel.width; x++) {
        let idx = (wheel.width * y + x) << 2;
        if (wheel.data[idx + 3] >= 50) { // Opaque
            if (x < wb.minX) wb.minX = x;
            if (x > wb.maxX) wb.maxX = x;
            if (y < wb.minY) wb.minY = y;
            if (y > wb.maxY) wb.maxY = y;
        }
    }
}
console.log(`Wheel Bounds: X[${wb.minX}-${wb.maxX}], Y[${wb.minY}-${wb.maxY}]`);

// Find the radius of the wheel (opaque part)
let wWidth = wb.maxX - wb.minX;
console.log(`Wheel Width ratio to Full Image: ${wWidth / wheel.width}`);

