const fs = require('fs');
const buffer = fs.readFileSync('public/assets/premium-wheels/Stand.png');
// check PNG header
console.log("Is PNG:", buffer.toString('hex', 0, 8) === '89504e470d0a1a0a');
// IType
console.log("Color type:", buffer[25]); 
