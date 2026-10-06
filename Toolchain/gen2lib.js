function tokenize(code) {
    const tokens = [];
    let i = 0;
    const isLetter = (c) => /[a-zA-Z_]/.test(c);
    const isNumber = (c) => /[0-9]/.test(c);
    while (i < code.length) {
        let c = code[i];
        if (/\s/.test(c)) {
            i++;
            continue;
        }
        if (c === "/" && code[i + 1] === "/") {
            while (i < code.length && code[i] !== "\n") {
                i++;
            }
            continue;
        }
        if (c === "'") {
            let quoteType = c;
            let value = "";
            i++;
            while (i < code.length && code[i] !== quoteType) {
                value += code[i++];
            }
            i++;
            for (let a = 0; a < value.length; a++) {
                tokens.push({ type: "number", value: value.charCodeAt(a) });
                if (a !== (value.length - 1)) {
                    tokens.push({ type: "symbol", value: ',' });
                }
            }
            continue;
        }
        if (isLetter(c)) {
            let value = "";
            while (i < code.length && (isLetter(code[i]) || isNumber(code[i]))) {
                value += code[i++];
            }
            tokens.push({ type: "identifier", value });
            continue;
        }
        if (isNumber(c)) {
            let value = "";

            while (
                i < code.length &&
                (
                    isNumber(code[i]) ||
                    "ABCDEFabcdef".includes(code[i])
                )
            ) {
                value += code[i++];
            }

            if (
                i < code.length &&
                code[i].toLowerCase() === "h"
            ) {
                i++;
                value = parseInt(value, 16);
            }
            else if (value === "0" && code[i] === "x") {
                i++;
                let value2 = "";
                while (i < code.length && (isNumber(code[i]) || ['A', 'B', 'C', 'D', 'E', 'F'].includes(code[i].toUpperCase()))) {
                    value2 += code[i++];
                }
                value = parseInt(value2, 16);
            }
            else {
                value = Number(value);
            }

            tokens.push({
                type: "number",
                value
            });

            continue;
        }
        tokens.push({ type: "symbol", value: c });
        i++;
    }
    return tokens;
}
export class Context {
    constructor() {
        this.symbs = new Map();
        this.equals = new Map();
        this.codeLen = 0;
        this.currentIp = 0;
        this.currentLabel = 'start';
        this.result = [];
        this.list = {};
        this.instr_assumes = new Map();
        this.org = 0;
    }
}
export function LineAsm(line, context) {
    let toks = tokenize(line);
    let i = 0;
    function peek() {
        return toks[i];
    }
    function consume() {
        return toks[i++];
    }
    function expect(x, msg) {
        let a = consume();
        if (a.value != x) {
            throw new Error(msg);
        }
        return a;
    }
    function getRegOf(name) {
        return ({A:0,X:1,Y:2,ZERO:3, Z:3})[name.toUpperCase()];
    }
    function getFlagOf(name) {
        return ({C:0,D:6})[name.toUpperCase()];
    }
    function getOperatorOf(name) {
        return ({ADD:0,SUB:1,MUL:2,DIV:3,XOR:4,OR:5,AND:6,SHL:7,SHR:8})[name.toUpperCase()];
    }
    /**
    A, X, Y, ZERO
    0b0000:0xO 0xRS      = {O} %R %S
    0b1000:0xO 0xSSSS    = {O} $S
    0b1001:0bRRII 0xXXYY = LDR %I $XXYYh
    0b1010:0bRRII 0xXXYY = STR %I $XXYYh
    0b1100:0bRRII 0xXXYY = LBR %I $XXYYh
    0b1101:0bRRII 0xXXYY = SBR %I $XXYYh
    0b1011:0x0 0xXXYY    = JMP $XXYYh
    0b1011:0x1 0xXXYY    = BCF $XXYYh
    0b0001:0x0 0x?R      = JMP %R
    0b0001:0x1 0x?R      = BCF %R
    0b1110:0b00RR 0xXXYY = CHR $XXYYh
    0b1111:0b00RR 0xXXYY = TIR $XXYYh
    0b0010:0b00RR 0x?R   = TSR %R
    0b0010:0b0100 0xVV   = LCF $VV
    */
    function getOpcodeOf(name) {
        let nam = name.toUpperCase();
        if (nam == 'LCF') {
            return [[0b0010, 0b0100], 'n'];
        }
        if (nam.startsWith('LD') && nam.length == 3) {
            return [[0b1001, [getRegOf(nam[2]), 'r']], 'n16'];
        }
        if (nam.startsWith('ST') && nam.length == 3) {
            return [[0b1010, [getRegOf(nam[2]), 'r']], 'n16'];
        }
        if (nam.startsWith('TI') && nam.length == 3) {
            return [[0b1111, [0, getRegOf(nam[2])]], 'n16'];
        }
        if (nam.startsWith('CH') && nam.length == 3) {
            return [[0b1110, [0, getRegOf(nam[2])]], 'n16'];
        }
        if (nam.startsWith('TS') && nam.length == 3) {
            return [[0b0010, [0, getRegOf(nam[2])]], 'r'];
        }
        if (nam.startsWith('LB') && nam.length == 3) {
            return [[0b1100, [getRegOf(nam[2]), 'r']], 'n16'];
        }
        if (nam.startsWith('SB') && nam.length == 3) {
            return [[0b1101, [getRegOf(nam[2]), 'r']], 'n16'];
        }
        if (nam == 'JMP') {
            let a = i;
            consume();
            let flg = false;
            if (peek().value === '$') {
                flg = true;
            }
            i = a;
            if (flg) {
                return [[0b1011, 0x0], 'n16'];
            }
            else {
                return [[0b0001, 0x0], ['r']];
            }
        }
        if (nam == 'BCF') {
            let a = i;
            consume();
            let flg = false;
            if (peek().value === '$') {
                flg = true;
            }
            i = a;
            if (flg) {
                return [[0b1011, 0x1], 'n16'];
            }
            else {
                return [[0b0001, 0x1], ['r']];
            }
        }
        if (getOperatorOf(name) !== undefined) {
            let a = i;
            consume();
            let flg = false;
            if (peek().value === '$') {
                flg = true;
            }
            i = a;
            if (flg) {
                return [[0b1000, getOperatorOf(name)], 'n16'];
            }
            else {
                return [[0b0000, getOperatorOf(name)], ['r', 'r']];
            }
        }
        return null;
    }
    function toBigEndianBytes(n, x) {
        if (n == 0) {
            return new Array(x).fill(0);
        }

        let bytes = [];
        while (n > 0) {
            bytes.push(n & 0xFF);
            n = n >>> 8;
        }
        bytes.reverse();
        while (bytes.length < x) {
            bytes.unshift(0);
        }
        return bytes;
    }
    function parseStructured(str, bd=8) {
        return str.map(v => {
            if (Array.isArray(v)) {
			    let bs = parseStructured(v,bd/2);
                let ata = 0;
                bs.forEach(c => {
                    ata = (ata << (bd/2)) | Number(c);
                })
                return ata;
            }
            else if (v == 'n') {
                expect("$", 'expected number');
                if (peek().type != 'number') {
                    let inf = {};
                    let na = parseSyntx(inf);
                    if (inf.label) na += context.org;
                    if (peek() && peek().value == '.') {
                        consume();
                        let pat = consume().value.toUpperCase();
                        if (pat == 'H') {
                            return (na >> 8) & 0xFF;
                        }
                        else if (pat == 'L') {
                            return na & 0xFF;
                        }
                    }
                    return na;
                }
                return Number(consume().value);
            }
            else if (v == 'n16') {
                expect("$", 'expected number');
                if (peek().type != 'number') {
                    let inf = {};
                    let na = parseSyntx(inf);
                    if (inf.label) na += context.org;
                    return toBigEndianBytes(na, 2);
                }
                return toBigEndianBytes(Number(consume().value), 2);
            }
            else if (v == 'r') {
                expect("%", 'expected register');
                return Number(getRegOf(consume().value));
            }
            return Number(v);
        }).flat()
    }
    function parseSize(name) {
        switch (name) {
        case 'db': return 1;
        case 'dw': return 2;
        case 'dd': return 4;
        case 'dq': return 8;
        case 'byte': return 1;
        case 'word': return 2;
        }
    }
    function parseSyntx(info={}) {
        info.label = false;
        if (peek().value == '(') {
            consume();
            let infa = {};
            let result = parseSyntx(infa);
            if (infa.label) result += context.org;
            let steps = [result];
            while (peek() && peek().value != ')') {
                if (peek().value !== ')') {
                    let xc = consume().value;
                    steps.push(xc);
                    if (xc == '+') {
                        let fomi = {};
                        let ra = parseSyntx(fomi);
                        steps.push(ra);
                        result = result + ra;
                    }
                    else if (xc == '-') {
                        let fomi = {};
                        let ra = parseSyntx(fomi);
                        steps.push(ra);
                        result = result - ra;
                    }
                    else if (xc == '*') {
                        let fomi = {};
                        let ra = parseSyntx(fomi);
                        steps.push(ra);
                        result = result * ra;
                    }
                    else if (xc == '/') {
                        let fomi = {};
                        let ra = parseSyntx(fomi);
                        steps.push(ra);
                        result = result / ra;
                    }
                    else if (xc == '%') {
                        let fomi = {};
                        let ra = parseSyntx(fomi);
                        steps.push(ra);
                        result = result % ra;
                    }
                }
            }
            consume();
            return result;
        }
        if (peek().type == 'number') return consume().value;
        if (peek().value == '.') {
            consume();
            info.label = true;
            return context.symbs.get(context.currentLabel + '.' + consume().value);
        }
        if (context.equals.has(peek().value)) {
            return context.equals.get(consume().value);
        }
        if (peek().value == '$') {
            consume();
            info.label = true;
            return context.currentIp;
        }
        if (peek().value == 'offs8') {
            consume();
            let syn = parseSyntx();
            syn = syn - context.currentIp;
            if (syn < 0) {
                syn = 0x80 | (-syn);
            }
            return syn & 0xFF;
        }
        if (context.symbs.has(peek().value)) {
            info.label = true;
            return context.symbs.get(consume().value);
        }
        if (peek().type !== 'number') {
            consume();
            return 0;
        }
        return consume().value;
    }
    let result = [];
    while (i < toks.length) {
        if (getOpcodeOf(peek().value) !== null) {
            let opr = getOpcodeOf(peek().value);
            consume()
            let pr = parseStructured(opr);
            result.push(...pr);
        }
        else if (peek().value == ';') return result;
        else if (parseSize(peek().value.toLowerCase()) !== undefined) {
            let sizeof = parseSize(consume().value.toLowerCase());
            let primarys = toBigEndianBytes(parseSyntx(), sizeof);
            while (peek() && peek().value === ",") {
            consume();
            primarys.push(...toBigEndianBytes(
                parseSyntx(), sizeof
            ));
            }
            result.push(...primarys);
        }
        else if (peek().value.toUpperCase() === 'DEF') {
            consume();
            let nam = consume().value.toUpperCase();
            function arrayParse() {
                let arr = [];
                while (peek() && peek().value !== ')') {
                    if (peek().value == '(') {
                        consume();
                        arr.push(arrayParse());
                    }
                    else if (peek().type === 'number') {
                        arr.push(consume().value);
                    }
                    else {
                        arr.push(consume().value.toLowerCase());
                    }
                }
                return arr;
            }
            expect('(', 'expected exp');
            context.instr_assumes.set(nam, arrayParse());
        }
        else if (context.instr_assumes.has(peek().value.toUpperCase())) {
            let al = consume().value.toUpperCase();
            let opr = context.instr_assumes.get(al);
            let pr = parseStructured(opr);
            result.push(...pr);
        }
        else if (peek().value.toUpperCase() === 'LOCAL') {
            consume();
            context.org = parseSyntx();
        }
        else if (peek().value.toUpperCase() == 'RESERVE' || peek().value.toUpperCase() == 'RSV') {
            consume();
            let sx = parseSyntx();
            result.push(...(new Array(sx).fill(0)));
        }
        else if (peek().value == '.') {
            consume();
            let ident = consume().value;
            expect(":");
            context.symbs.set(context.currentLabel + '.' + ident, context.currentIp);
        }
        else if (peek().type == 'identifier') {
            let ident = consume().value;
            if (peek().value.toUpperCase() == 'EQU') {
                consume();
                context.equals.set(ident, parseSyntx())
            }
            else if (parseSize(peek().value.toLowerCase()) !== undefined) {
                context.symbs.set(ident, context.currentIp)
            }
            else {
                expect(":");
                context.currentLabel = ident
                context.symbs.set(ident, context.currentIp)
            }
        }
        else {
            consume();
        }
    }
    return result;
}
export function LineDisasm(bytes, context=null) {
  if(!bytes || bytes.length==0) return "";
  if(bytes.length==1) return `DB $${bytes[0].toString(16).padStart(2,'0').toUpperCase()}`;

  const b0 = bytes[0];
  const b1 = bytes[1];
  const b2 = bytes[2]||0;

  const lenx = (b0>>7)&1;
  const actx = (b0>>4)&0b111;
  const subg = b0&0xF;
  const rdst = (subg>>2)&0b11;
  const ridx = subg&0b11;

  const ropr1 = (b1>>4)&0b11;
  const ropr2 = b1&0b11;
  const rus = b1&0b11;

  const rName = n=>['A','X','Y','Z'][n]||`R${n}`;
  const opName = o=>['ADD','SUB','MUL','DIV','XOR','OR','AND','SHR','SHL'][o]||`OP${o}`;
  
  const i16 = (b1<<8)|b2;
  const i16h = `$0${i16.toString(16).padStart(4,'0').toUpperCase()}h`;

  if(!lenx){
    switch(actx){
      case 0b000:
        return `${opName(subg)} %${rName(ropr1)} %${rName(ropr2)}`;
      case 0b001:
        if(subg==0) return `JMP %${rName(rus)}`;
        if(subg==1) return `BCF %${rName(rus)}`;
        break;
      case 0b010:
        if((subg>>2)==0) return `TS${rName(ridx)} %${rName(rus)}`;
        if(subg==0b0100) return `LCF $0${b1.toString(16).toUpperCase()}h`;
        break;
    }
    return `DB $${b0.toString(16).padStart(2,'0')} $${b1.toString(16).padStart(2,'0')}`;
  }

  switch(actx){
    case 0b000: return `${opName(subg)} ${i16h}`;
    case 0b001: return `LD${rName(rdst)} %${rName(ridx)} ${i16h}`;
    case 0b010: return `ST${rName(rdst)} %${rName(ridx)} ${i16h}`;
    case 0b100: return `LB${rName(rdst)} %${rName(ridx)} ${i16h}`;
    case 0b101: return `SB${rName(rdst)} %${rName(ridx)} ${i16h}`;
    case 0b011:
      if(subg==0) return `JMP ${i16h}`;
      if(subg==1) return `BCF ${i16h}`;
      break;
    case 0b110: return `CH${rName(ridx)} $${i16h}`;
    case 0b111: {
      return `TI${rName(ridx)} ${i16h}`;
    }
  }
  return `DB $${b0.toString(16).padStart(2,'0')} $${b1.toString(16).padStart(2,'0')} $${b2.toString(16).padStart(2,'0')}`;
}
export function parseAsm(code) {
    let ctx = new Context();
    let lines = code.split("\n");
    lines.forEach(line => {
        let instr = LineAsm(line, ctx);
        ctx.currentIp += instr.length;
    });
    ctx.currentIp = 0;
    lines.forEach(line => {
        let instr = LineAsm(line, ctx);
        ctx.result.push(...instr);
        if (!ctx.list[ctx.currentIp]) ctx.list[ctx.currentIp] = [];
        ctx.list[ctx.currentIp].push({instr, line});
        ctx.currentIp += instr.length;
    })
    return ctx;
}

export var compiler = {
    make: parseAsm,
    info: Context,
    inspect: LineDisasm
}