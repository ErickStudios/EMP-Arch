import * as fileSystem from "node:fs";
const tablaAndOr = [];

for (let a = 0; a < 16; a++) {
    for (let b = 0; b < 16; b++) {
        tablaAndOr.push(a & b);
        tablaAndOr.push(a | b);
        tablaAndOr.push(a ^ b);
    }
}

fileSystem.writeFileSync('andlist.txt',tablaAndOr.map(String).join("\n"));