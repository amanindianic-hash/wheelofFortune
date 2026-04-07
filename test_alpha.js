const fs = require('fs');
const PNG = require('pngjs').PNG;
const data = fs.readFileSync('public/assets/premium-wheels/Stand.png');
const png = PNG.sync.read(data);
let transparentPixels = 0;
for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
        let idx = (png.width * y + x) << 2;
        if (png.data[idx + 3] < 255) transparentPixels++;
    }
}
console.log(`Stand.png has ${transparentPixels} transparent pixels out of ${png.width * png.height}`);
const data2 = fs.readFileSync('public/assets/premium-wheels/Wheel.png');
const png2 = PNG.sync.read(data2);
let ts2 = 0;
for (let y = 0; y < png2.height; y++) {
    for (let x = 0; x < png2.width; x++) {
        let idx = (png2.width * y + x) << 2;
        if (png2.data[idx + 3] < 255) ts2++;
    }
}
console.log(`Wheel.png has ${ts2} transparent pixels out of ${png2.width * png2.height}`);
