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
        return ({Z:0,A:1,X:2,Y:3,W:4,N:5, LNK:6, L:6})[name.toUpperCase()];
    }
    function getOperatorOf(name) {
        return ({ADD:0,SUB:1,MUL:2,DIV:3,XOR:4,OR:5,AND:6,SHL:7,SHR:8})[name.toUpperCase()];
    }
    /**
    # 
    # ins

    # r (3 bits opr): z = 0b000, a = 0b001, x = 0b010, y = 0b011, w = 0b100, n = 0b101
    # [group:4, func:3, lowMody:1]

    # r (3 bits opr): z = 0b000, a = 0b001, x = 0b010, y = 0b011, w = 0b100, n = 0b101, lnk = 0b110
    # [group:4, func:3, lowMody:1] [r1:3, r2:3, (r3:r || pad:3)] i8? || i16

    add %rd %ra %rb # 0b0010:0b0000 0bRD:0bRA:0bRB (add)
    addi %rd %ra $i # 0b0010:0b0001 0bRD:0bRA 0x?? (add imm)
    sub %rd %ra %rb # 0b0010:0b0010 0bRD:0bRA:0bRB (sub)
    subi %rd %ra $i # 0b0010:0b0011 0bRD:0bRA 0x?? (sub imm)
    mv %rd %rs      # 0b0001:0b0010 0bRD:0bRS :: %rd = %rs
    mh %r $i        # 0b0001:0bRRR0 0x???? (load high) :: %r = %r | (i << 16)
    ml %r $l        # 0b0001:0bRRR1 0x???? (load low) :: %r = %r | i
    mxl %r $i       # 0b0011:0bRRR? 0x???? (load low zero) :: %r = (%r xor %r) | i
    sb %r %rb+%ro   # 0b0000:0b0000 0bRB:0bRO:0bR (store byte)
    sh %r %rb+%ro   # 0b0000:0b0010 0bRB:0bRO:0bR (store half)
    sw %r %rb+%ro   # 0b0000:0b0100 0bRB:0bRO:0bR (store word)
    lb %r %rb+%ro   # 0b0000:0b1000 0bRB:0bRO:0bR (load byte)
    lh %r %rb+%ro   # 0b0000:0b1010 0bRB:0bRO:0bR (load half)
    lw %r %rb+%ro   # 0b0000:0b1100 0bRB:0bRO:0bR (load word)
    jf %rt %rc $f   # 0b0100:0b0000 0bRT_:0bRC_ 0x?_ (jump if flag)
    */
    function getOpcodeOf(name) {
        let nam = name.toUpperCase();
    
        const instrs = {
            JF: [
                {type: 'const', value: 0b01000000, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'imm', bits: 4},
                {type: 'const', value: 0, bits: (24-18)}
            ],
            MH: [
                {type: 'const', value: 0b0001, bits: 4},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: 1},
                {type: 'imm', bits: 16},
            ],
            ML: [
                {type: 'const', value: 0b0001, bits: 4},
                {type: 'reg', bits: 3},
                {type: 'const', value: 1, bits: 1},
                {type: 'imm', bits: 16},
            ],
            MXL: [
                {type: 'const', value: 0b0011, bits: 4},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: 1},
                {type: 'imm', bits: 16},
            ],
            MV: [
                {type: 'const', value: 0b00010010, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: (24-14)}
            ],
            ADD: [
                {type: 'const', value: 0b00100000, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: (24-17)}
            ],
            ADDI: [
                {type: 'const', value: 0b00100000, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: 2},
                {type: 'imm', bits: 8}
            ],
            SUB: [
                {type: 'const', value: 0b00100010, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: (24-17)}
            ],
            SUBI: [
                {type: 'const', value: 0b00100010, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: 2},
                {type: 'imm', bits: 8}
            ],
            LW: [
                {type: 'const', value: 0b00001100, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'str', value: '+'},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: (24-17)}
            ],
            LH: [
                {type: 'const', value: 0b00001010, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'str', value: '+'},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: (24-17)}
            ],
            LB: [
                {type: 'const', value: 0b00001000, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'str', value: '+'},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: (24-17)}
            ],
            SW: [
                {type: 'const', value: 0b00000100, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'str', value: '+'},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: (24-17)}
            ],
            SH: [
                {type: 'const', value: 0b00000010, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'str', value: '+'},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: (24-17)}
            ],
            SB: [
                {type: 'const', value: 0b00000000, bits: 8},
                {type: 'reg', bits: 3},
                {type: 'reg', bits: 3},
                {type: 'str', value: '+'},
                {type: 'reg', bits: 3},
                {type: 'const', value: 0, bits: (24-17)}
            ],
        }

        if (nam in instrs) return instrs[nam]
    
        return null;
    }
    function createBitWriter() {
        let bytes = [];
        let buffer = 0;
        let used = 0;

        function write(value, bits) {
            value = BigInt(value);
            bits = Number(bits);

            if (bits < 0 || bits > 32) {
                throw new Error(`Invalid field width: ${bits}`);
            }

            const max = 1n << BigInt(bits);

            if (value < 0n || value >= max) {
                throw new Error(
                    `Value ${value} does not fit in ${bits} bits`
                );
            }

            for (let b = bits - 1; b >= 0; b--) {
                buffer = (buffer << 1) |
                    Number((value >> BigInt(b)) & 1n);

                used++;

                if (used === 8) {
                    bytes.push(buffer);
                    buffer = 0;
                    used = 0;
                }
            }
        }

        function finish() {
            if (used !== 0) {
                bytes.push(buffer << (8 - used));
                buffer = 0;
                used = 0;
            }

            return bytes;
        }

        return { write, finish };
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
    function parseStructured(fields) {
        const writer = createBitWriter();

        for (const field of fields) {
            let value;
            let noWrt = false;

            if (field.type === "reg") {
                expect("%", "expected register");

                const regName = consume().value;
                value = getRegOf(regName);

                if (value === undefined) {
                    throw new Error(`Unknown register: ${regName}`);
                }
            }
            else if (field.type === "imm") {
                expect("$", "expected immediate");

                const info = {};
                value = parseSyntx(info);

                if (info.label) {
                    value += context.org;
                }
            }
            else if (field.type === "const") {
                value = field.value;
            }
            else if (field.type === "str") {
                expect(field.value);
                noWrt = true;
            }
            else {
                throw new Error(
                    `Unknown field type: ${field.type}`
                );
            }

            if (!noWrt) 
                writer.write(value, field.bits);
        }

        return writer.finish();
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
        else if (peek().value.toUpperCase() == 'LI') {
            consume();
            expect("%", "expected register");
            let nam = consume().value;
            expect("$", "expected number");
            let inf = {};
            let nu = parseSyntx(inf);
            if (inf.label) {
                nu += context.org;
            }
            let nu0 = nu & 0xFFFF;
            let nu1 = (nu >> 16) & 0xFFFF;
            result.push(...LineAsm(`mh %${nam} $${nu1}`, context));
            result.push(...LineAsm(`ml %${nam} $${nu0}`, context));

        }
        else if (peek().value == '#') return result;
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