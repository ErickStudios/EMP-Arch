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
        return ({A:0,B:1,C:2,P:3,X:4,Y:5,Z:6,W:7,M:8,H:9,K:15})[name.toUpperCase()];
    }
    function getFlagOf(name) {
        return ({C:0,D:6})[name.toUpperCase()];
    }
    function getOpcodeOf(name) {
        let nam = name.toUpperCase();
        if (nam.startsWith('CP') && nam.length == 3) {
            return [0x01, [0x00 | getRegOf(nam[2])]];
        }
        if (nam == 'TSA') {
            return [0x00, [0x0, 'r']];
        }
        if (nam == 'MVA') {
            return [0x00, [0x1, 'r']];
        }
        if (nam == 'ADC') {
            return [0x03, [0x0, 'r']];
        }
        if (nam == 'MUL') {
            return [0x03, [0x6, 'r']];
        }
        if (nam == 'ML8') {
            return [0x03, [0x7, 'r']];
        }
        if (nam == 'SHR') {
            return [0x03, [0x2, 'r']];
        }
        if (nam == 'SHL') {
            return [0x03, [0x3, 'r']];
        }
        if (nam == 'AND') {
            return [0x03, [0x4, 'r']];
        }
        if (nam == 'ORB') {
            return [0x03, [0x5, 'r']];
        }
        if (nam == 'SSA') {
            return [0x0F, [0x0, 'r']];
        }
        if (nam == 'SLA') {
            return [0x0F, [0x1, 'r']];
        }
        if (nam == 'SBB') {
            return [0x03, [0x1, 'r']];
        }
        if (nam == 'PAG') {
            return [0x04, 'n'];
        }
        if (nam == 'PG2') {
            return [0x10, 'n'];
        }
        if (nam == 'PG3') {
            return [0x11, 'n'];
        }
        if (nam == 'STA') {
            return [0x05, [0x00, 'r']];
        }
        if (nam == 'CTA') {
            return [0x0a, 'n'];
        }
        if (nam.startsWith('ZR') && nam.length == 3) {
            return [0x02, 0x00 | getFlagOf(nam[2])];
        }
        if (nam.startsWith('ST') && nam.length == 3 && (getFlagOf(nam[2]) !== undefined)) {
            return [0x02, 0x10 | getFlagOf(nam[2])];
        }
        if (nam == 'CHA') {
            return [0x06, 'n'];
        }
        if (nam == 'CHB') {
            return [0x09, 'n'];
        }
        if (nam == 'TWI') {
            return [0x12, 'n'];
        }
        if (nam == 'CHZ') {
            return [0x0E, 'n'];
        }
        if (nam == 'CHC') {
            return [0x0D, 'n'];
        }
        if (nam == 'CHH') {
            return [0x13, 'n'];
        }
        if (nam == 'LDA') {
            return [0x05, [0x1, 'r']];
        }
        if (nam == 'LDB') {
            return [0x05, [0x2, 'r']];
        }
        if (nam == 'CDA') {
            return [0x0c, 'n'];
        }
        if (nam == 'LDC') {
            return [0x07, 'n'];
        }
        if (nam == 'BCC') {
            return [0x0b, 'n'];
        }
        if (nam == 'BRC') {
            return [0x08, [0x0, 'r']];
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
            else if (v == 'r') {
                expect("%", 'expected register');
                return Number(getRegOf(consume().value));
            }
            return Number(v);
        })
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
            let opr = getOpcodeOf(consume().value);
            let pr = parseStructured(opr);
            result.push(...pr);
        }
        else if (peek().value.toUpperCase() === 'JIC') {
            consume();
            expect("$", 'expected number');
            let inf = {};
            let pk = parseSyntx(inf);
            if (inf.label) pk += context.org;
            result.push(...LineAsm(`PAG $${(pk >> 8) & 0xFF} BCC $${pk & 0xFF}`, context));
        }
        else if (peek().value.toUpperCase() === 'STR') {
            consume();
            expect("$", 'expected number');
            let inf = {};
            let pk = parseSyntx(inf);
            if (peek() && peek().value === ',') {
                consume();
                result.push(...parseStructured([0x06, 'n']));
            }
            if (inf.label) pk += context.org;
            result.push(...LineAsm(`PAG $${(pk >> 8) & 0xFF} CTA $${pk & 0xFF}`, context));
        }
        else if (peek().value.toUpperCase() === 'LDS') {
            consume();
            expect("$", 'expected number');
            let inf = {};
            let pk = parseSyntx(inf);
            if (inf.label) pk += context.org;
            result.push(...LineAsm(`PAG $${(pk >> 8) & 0xFF} CDA $${pk & 0xFF}`, context));
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
  if(bytes.length < 2) return `DB ${bytes[0]}`;
  const [op, arg] = bytes
  const hi = (arg >> 4) & 0xF
  const lo = arg & 0xF

  const regName = (n) => (['A','B','C','P','X','Y','Z','W','M','H','?', '?','?','?','?','K'][n] || `R${n}`)
  const flagName = (n) => n===0? 'C' : n===6? 'D' : `F${n}`

  const reg = `%${regName(lo)}`

  switch(op){
    case 0x00:
      if(hi===0) return `TSA ${reg}`
      if(hi===1) return `MVA ${reg}`
      break
    case 0x02:
      if((hi & 0xC) === 0x0) return `ZR${flagName(lo)}`
      if((hi & 0xC) === 0x1) return `ST${flagName(lo)}`
      break
    case 0x03:
      if(hi===0) return `ADC ${reg}`
      if(hi===1) return `SBB ${reg}`
      if(hi===2) return `SHR ${reg}`
      if(hi===3) return `SHL ${reg}`
      if(hi===4) return `AND ${reg}`
      if(hi===5) return `ORB ${reg}`
      if(hi===6) return `MUL ${reg}`
      if(hi===7) return `ML8 ${reg}`
      break
    case 0x05:
      if(hi===0) return `STA ${reg}`
      if(hi===1) return `LDA ${reg}`
      if(hi===2) return `LDB ${reg}`
      break
    case 0x0F:
      if(hi===0) return `SSA ${reg}`
      if(hi===1) return `SLA ${reg}`
      break
    case 0x08:
      return `BRC ${reg}`

    // 1 arg numérico $n
    case 0x04: return `PAG $${arg.toString(16).toUpperCase()}`
    case 0x10: return `PG2 $${arg.toString(16).toUpperCase()}`
    case 0x11: return `PG3 $${arg.toString(16).toUpperCase()}`
    case 0x06: return `CHA $${arg}`
    case 0x09: return `CHB $${arg}`
    case 0x0A: return `CTA $${arg}`
    case 0x0B: return `BCC $${arg}`
    case 0x07: return `LDC $${arg}`
    case 0x0C: return `CDA $${arg}`
    case 0x0D: return `CHC $${arg}`
    case 0x0E: return `CHZ $${arg}`
    case 0x13: return `CHH $${arg}`
    case 0x12: return `TWI $${arg}`
  }
  return `db $${op.toString(16)}, $${arg.toString(16)} ;??`
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