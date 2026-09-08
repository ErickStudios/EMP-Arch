import * as fileSystem from "node:fs";
const tablaBitOr = [];
const tablaAndOr = [];

for (let a = 0; a < 16; a++) {
    for (let b = 0; b < 16; b++) {
        tablaBitOr.push(a | b);
        tablaAndOr.push(a & b);
    }
}

fileSystem.writeFileSync('andlist.txt',tablaAndOr.map(String).join("\n"));
fileSystem.writeFileSync('orlist.txt',tablaBitOr.map(String).join("\n"));