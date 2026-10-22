
import { g3asm, cpuEmus } from "./Toolchain/emukit.js"

let cpu = new cpuEmus.cpuGen3();
let rom = g3asm.parseAsm(`
    local 0xf0000
reset:
    li %a $0xABCDEF
    lh %x %a+%z
    mxl %x $0x134
    sw %x %a+%z
.sa:
    li %l $.sa
    jf %l %z $0 # always equ
tax:
    rsv (0xfff0-$)
    li %l $reset
    jf %l %z $0 # always equ
    rsv (0x10000-$)
`).result
let pc;

// Write Bus 8 bit
function WriteBus8(adr, val) {
}

// Write Bus 16 bit
function WriteBus16(adr, val) {
    WriteBus8(adr, (val >> 8) & 0xFF);
    WriteBus8(adr+1, val & 0xFF);
}

// Write Bus 32 bit
function WriteBus32(adr, val) {
    WriteBus16(adr, (val >> 16) & 0xFFFF);
    WriteBus16(adr+2, val & 0xFFFF);
}

// Write Bus General
function WriteBus(adr, mft, val) {
    console.log(`W${mft} #${adr.toString(16).padStart(8, '0')} ${val.toString(16).padStart(8, '0')}`)

    if (mft == 0)
        WriteBus8(adr, val);
    else if (mft == 1)
        WriteBus16(adr, val);
    else if (mft == 2)
        WriteBus32(adr, val);
}

// Read Bus 8 bit
function ReadBus8(adr) {
    if (adr >= 0xF0000 && adr <= 0xFFFFF)
        return rom[adr - 0xF0000];
}

// Read Bus 16 bit
function ReadBus16(adr) {
    return (ReadBus8(adr) << 8) | ReadBus8(adr+1);
}

// Read Bus 32 bit
function ReadBus32(adr) {
    return (ReadBus16(adr) << 16) | ReadBus16(adr+2);
}

// Read Bus General
function ReadBus(adr, mtf) {

    console.log(`R${mtf} #${adr.toString(16).padStart(8, '0')}`)

    if (mtf == 0)
        return ReadBus8(adr);
    else if (mtf == 1)
        return ReadBus16(adr);
    else if (mtf == 2)
        return ReadBus32(adr);
}

// Instruction Fetcher
function FetchInstruction(adr) {
    return ((ReadBus8(adr) << 16) | (ReadBus8(adr+1) << 8) | ReadBus8(adr+2));
}

cpu.rst = (a) => { 
    pc = 0xFFFF0;
}
cpu.jf = (a) => {
    pc = a - 3;
}
cpu.rex = ReadBus;
cpu.wex = WriteBus;

cpu.rst()

let v = setInterval(function () {
    let ins = FetchInstruction(
        pc
    ); cpu.exi(ins);

    console.log(`#${pc.toString(16).padStart(8, '0')} ${ins.toString(16).padStart(6, '0')}`)

    pc = pc + 3;
}, 50)