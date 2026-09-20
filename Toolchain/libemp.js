// Toolchain/pocket_cpu.js
var cpuGen1 = class {
  constructor(model = 1028) {
    this.model = model;
    this.def();
    this.rst();
  }
  def() {
    this.ar = 0;
    this.br = 0;
    this.cr = 0;
    this.pr = 0;
    this.xr = 0;
    this.yr = 0;
    this.zr = 0;
    this.tr = 0;
    this.ofr = 0;
    this.altpr = 0;
    this.alt2r = 0;
    this.xtr = 0;
    this.hr = 0;
  }
  rst() {
    this.ar = 0;
    this.br = 0;
    this.cr = 0;
    this.pr = 0;
    this.fr = [0, 0, 0, 0, 0, 0, 0];
    this.adr = 0;
  }
  init() {
    return 0;
  }
  setReg(id, val) {
    switch (id) {
      case 0:
        this.ar = val;
        break;
      case 1:
        this.br = val;
        break;
      case 2:
        this.cr = val;
        break;
      case 3:
        this.pr = val;
        break;
      case 4:
        this.xr = val;
        break;
      case 5:
        this.yr = val;
        break;
      case 6:
        this.zr = val;
        break;
      case 7:
        this.altpr = val;
        break;
      case 8:
        this.alt2r = val;
        break;
      case 9:
        this.hr = val;
        break;
      default:
        break;
    }
  }
  getReg(id) {
    switch (id) {
      case 0:
        return this.ar;
      case 1:
        return this.br;
      case 2:
        return this.cr;
      case 3:
        return this.pr;
      case 4:
        return this.xr;
      case 5:
        return this.yr;
      case 6:
        return this.zr;
      case 7:
        return this.altpr;
      case 8:
        return this.alt2r;
      case 9:
        return this.hr;
      default:
        return 0;
    }
  }
  normalize(x) {
    return (x % 256 + 256) % 256;
  }
  exi(ins) {
    let opcode = ins >> 8 & 255;
    let imm_vv = ins & 255;
    let reg_r = imm_vv & 15;
    let imm_nibl = imm_vv >> 4;
    switch (opcode) {
      case 0:
        if (imm_nibl == 0) {
          this.tr = this.ar - this.getReg(reg_r);
          this.fr[1] = 0;
          if (this.tr == 0) {
            this.fr[1] = 1;
            this.fr[4] = 0;
          } else {
            this.fr[1] = 0;
            this.fr[4] = 1;
          }
          if (this.tr < 0) {
            fr[2] = 1;
            fr[3] = 0;
          } else {
            this.fr[2] = 0;
            this.fr[3] = 0;
          }
        } else if (imm_nibl == 1) {
          this.ar = this.getReg(reg_r);
        }
        break;
      // 01 0r: CPr (r = a)
      case 1:
        this.setReg(reg_r, this.ar);
        break;
      // 02 00: ZRf/STf (fF = 0/1)
      case 2:
        if (imm_nibl == 0) this.fr[reg_r] = 0;
        else if (imm_nibl == 1) this.fr[reg_r] = 1;
        break;
      // 03 0r: ADC/SBB r (a = a +/- r +/- CF)
      case 3:
        if (imm_nibl == 0) {
          this.ar = this.ar + this.getReg(reg_r) + this.fr[0];
          this.fr[5] = this.ar >> 8;
          this.ar = this.ar & 255;
        } else if (imm_nibl == 1) {
          this.ar = this.normalize(this.ar - this.getReg(reg_r) + this.fr[0]);
        } else if (imm_nibl == 2) {
          this.ar = this.ar >> this.getReg(reg_r) & 255;
        } else if (imm_nibl == 3) {
          this.ar = this.ar << this.getReg(reg_r) & 255;
        } else if (imm_nibl == 4) {
          this.ar = this.ar & this.getReg(reg_r);
        } else if (imm_nibl == 5) {
          this.ar = this.ar | this.getReg(reg_r);
        } else if (imm_nibl == 6 && this.model >= 1028) {
          this.xtr = (this.hr << 8 | this.ar) * this.getReg(reg_r);
          this.ar = this.xtr & 255;
          this.hr = this.xtr >> 8 & 255;
        } else if (imm_nibl == 7 && this.model >= 1028) {
          this.xtr = this.ar * this.getReg(reg_r);
          this.ar = this.xtr & 255;
          this.hr = this.xtr >> 8 & 255;
        }
        break;
      // 04 VV: PAG $VV (page = 0xVV)
      case 4:
        this.pr = imm_vv;
        break;
      // 05 ?r: STA/LDA/MDC r ([page:r] = a // a/b = [page[r]])
      case 5:
        if (imm_nibl == 0) {
          this.adr = this.pr << 8 | this.getReg(reg_r);
          this.wex(this.adr, this.ar);
        } else if (imm_nibl == 1) {
          this.adr = this.pr << 8 | this.getReg(reg_r);
          this.ar = this.rex(this.adr);
        } else if (imm_nibl == 2) {
          this.adr = this.pr << 8 | this.getReg(reg_r);
          this.br = this.rex(this.adr);
        }
        break;
      // 06 1r: CHA v (a = v)
      case 6:
        this.ar = imm_vv;
        break;
      // 07 VV: LDC $VV
      case 7:
        this.fr[0] = this.fr[imm_vv];
        break;
      // 08 0r: BRC r
      case 8:
        if (this.fr[0]) {
          this.adr = this.pr << 8 | this.getReg(reg_r);
          this.jf(this.adr);
        }
        break;
      // 09 1r: CHB v (b = v)
      case 9:
        this.br = imm_vv;
        break;
      // 0a 0r: CTA $$V ([page:$VV] = a)
      case 10:
        this.adr = this.pr << 8 | imm_vv;
        this.wex(this.adr, this.ar);
        break;
      // 0b VV: BCC $VV
      case 11:
        if (this.fr[0]) {
          this.adr = this.pr << 8 | imm_vv;
          this.jf(this.adr);
        }
        break;
      // 0c VV: CDA $VV (a = [page:$VV])
      case 12:
        this.adr = this.pr << 8 | imm_vv;
        this.ar = this.rex(this.adr);
        break;
      // 0D 1r: CHC v (c = v)
      case 13:
        this.cr = imm_vv;
        break;
      // 0E VV: CHZ v (z = v)
      case 14:
        this.zr = imm_vv;
        break;
      case 15:
        if (this.model >= 1e3) {
          if (imm_nibl == 0) {
            this.adr = this.altpr << 8 | this.getReg(reg_r);
            this.wex(this.adr, this.ar);
            if (this.fr[6]) {
              if (this.getReg(reg_r) == 255) {
                this.altpr = this.altpr + 1;
              }
              this.setReg(reg_r, this.normalize(this.getReg(reg_r) + 1));
            } else {
              if (this.getReg(reg_r) == 0) {
                this.altpr = this.altpr - 1;
              }
              this.setReg(reg_r, this.normalize(this.getReg(reg_r) - 1));
            }
          } else if (imm_nibl == 1) {
            this.adr = this.alt2r << 8 | this.getReg(reg_r);
            this.ar = this.rex(this.adr);
            if (this.fr[6]) {
              if (this.getReg(reg_r) == 255) {
                this.alt2r = this.alt2r + 1;
              }
              this.setReg(reg_r, this.normalize(this.getReg(reg_r) + 1));
            } else {
              if (this.getReg(reg_r) == 0) {
                this.alt2r = this.alt2r - 1;
              }
              this.setReg(reg_r, this.normalize(this.getReg(reg_r) - 1));
            }
          }
        }
        break;
      // 10 VV: PG2 $VV = (alter = $vv)
      case 16:
        if (this.model >= 1e3) this.altpr = imm_vv;
        break;
      // 11 VV: PG3 $VV = (alte2 = $vv)
      case 17:
        if (this.model >= 1e3) this.alt2r = imm_vv;
        break;
      // 12 VV: TWI $VV = a test $vv
      case 18:
        if (this.model >= 1028) {
          this.tr = this.ar - imm_vv;
          this.fr[1] = 0;
          if (this.tr == 0) {
            this.fr[1] = 1;
            this.fr[4] = 0;
          } else {
            this.fr[1] = 0;
            this.fr[4] = 1;
          }
          if (this.tr < 0) {
            fr[2] = 1;
            fr[3] = 0;
          } else {
            this.fr[2] = 0;
            this.fr[3] = 0;
          }
        }
        break;
      // 13 VV: CHH $VV = h = $VV
      case 19:
        if (this.model >= 1028) this.hr = imm_vv;
        break;
      default:
        this.hlp(ins, opcode, imm_vv, imm_nibl, reg_r);
        break;
    }
    return [opcode, imm_vv];
  }
};

// Toolchain/slib.js
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
        if (a !== value.length - 1) {
          tokens.push({ type: "symbol", value: "," });
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
      while (i < code.length && (isNumber(code[i]) || "ABCDEFabcdef".includes(code[i]))) {
        value += code[i++];
      }
      if (i < code.length && code[i].toLowerCase() === "h") {
        i++;
        value = parseInt(value, 16);
      } else if (value === "0" && code[i] === "x") {
        i++;
        let value2 = "";
        while (i < code.length && (isNumber(code[i]) || ["A", "B", "C", "D", "E", "F"].includes(code[i].toUpperCase()))) {
          value2 += code[i++];
        }
        value = parseInt(value2, 16);
      } else {
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
var Context = class {
  constructor() {
    this.symbs = /* @__PURE__ */ new Map();
    this.equals = /* @__PURE__ */ new Map();
    this.codeLen = 0;
    this.currentIp = 0;
    this.currentLabel = "start";
    this.result = [];
    this.list = {};
    this.instr_assumes = /* @__PURE__ */ new Map();
    this.org = 0;
  }
};
function LineAsm(line, context) {
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
    return { A: 0, B: 1, C: 2, P: 3, X: 4, Y: 5, Z: 6, W: 7, M: 8, H: 9, K: 15 }[name.toUpperCase()];
  }
  function getFlagOf(name) {
    return { C: 0, D: 6 }[name.toUpperCase()];
  }
  function getOpcodeOf(name) {
    let nam = name.toUpperCase();
    if (nam.startsWith("CP") && nam.length == 3) {
      return [1, [0 | getRegOf(nam[2])]];
    }
    if (nam == "TSA") {
      return [0, [0, "r"]];
    }
    if (nam == "MVA") {
      return [0, [1, "r"]];
    }
    if (nam == "ADC") {
      return [3, [0, "r"]];
    }
    if (nam == "MUL") {
      return [3, [6, "r"]];
    }
    if (nam == "ML8") {
      return [3, [7, "r"]];
    }
    if (nam == "SHR") {
      return [3, [2, "r"]];
    }
    if (nam == "SHL") {
      return [3, [3, "r"]];
    }
    if (nam == "AND") {
      return [3, [4, "r"]];
    }
    if (nam == "ORB") {
      return [3, [5, "r"]];
    }
    if (nam == "SSA") {
      return [15, [0, "r"]];
    }
    if (nam == "SLA") {
      return [15, [1, "r"]];
    }
    if (nam == "SBB") {
      return [3, [1, "r"]];
    }
    if (nam == "PAG") {
      return [4, "n"];
    }
    if (nam == "PG2") {
      return [16, "n"];
    }
    if (nam == "PG3") {
      return [17, "n"];
    }
    if (nam == "STA") {
      return [5, [0, "r"]];
    }
    if (nam == "CTA") {
      return [10, "n"];
    }
    if (nam.startsWith("ZR") && nam.length == 3) {
      return [2, 0 | getFlagOf(nam[2])];
    }
    if (nam.startsWith("ST") && nam.length == 3 && getFlagOf(nam[2]) !== void 0) {
      return [2, 16 | getFlagOf(nam[2])];
    }
    if (nam == "CHA") {
      return [6, "n"];
    }
    if (nam == "CHB") {
      return [9, "n"];
    }
    if (nam == "TWI") {
      return [18, "n"];
    }
    if (nam == "CHZ") {
      return [14, "n"];
    }
    if (nam == "CHC") {
      return [13, "n"];
    }
    if (nam == "CHH") {
      return [19, "n"];
    }
    if (nam == "LDA") {
      return [5, [1, "r"]];
    }
    if (nam == "LDB") {
      return [5, [2, "r"]];
    }
    if (nam == "CDA") {
      return [12, "n"];
    }
    if (nam == "LDC") {
      return [7, "n"];
    }
    if (nam == "BCC") {
      return [11, "n"];
    }
    if (nam == "BRC") {
      return [8, [0, "r"]];
    }
    return null;
  }
  function toBigEndianBytes(n, x) {
    if (n == 0) {
      return new Array(x).fill(0);
    }
    let bytes = [];
    while (n > 0) {
      bytes.push(n & 255);
      n = n >>> 8;
    }
    bytes.reverse();
    while (bytes.length < x) {
      bytes.unshift(0);
    }
    return bytes;
  }
  function parseStructured(str, bd = 8) {
    return str.map((v) => {
      if (Array.isArray(v)) {
        let bs = parseStructured(v, bd / 2);
        let ata = 0;
        bs.forEach((c) => {
          ata = ata << bd / 2 | Number(c);
        });
        return ata;
      } else if (v == "n") {
        expect("$", "expected number");
        if (peek().type != "number") {
          let inf = {};
          let na = parseSyntx(inf);
          if (inf.label) na += context.org;
          if (peek() && peek().value == ".") {
            consume();
            let pat = consume().value.toUpperCase();
            if (pat == "H") {
              return na >> 8 & 255;
            } else if (pat == "L") {
              return na & 255;
            }
          }
          return na;
        }
        return Number(consume().value);
      } else if (v == "r") {
        expect("%", "expected register");
        return Number(getRegOf(consume().value));
      }
      return Number(v);
    });
  }
  function parseSize(name) {
    switch (name) {
      case "db":
        return 1;
      case "dw":
        return 2;
      case "dd":
        return 4;
      case "dq":
        return 8;
      case "byte":
        return 1;
      case "word":
        return 2;
    }
  }
  function parseSyntx(info = {}) {
    info.label = false;
    if (peek().value == "(") {
      consume();
      let infa = {};
      let result2 = parseSyntx(infa);
      if (infa.label) result2 += context.org;
      let steps = [result2];
      while (peek() && peek().value != ")") {
        if (peek().value !== ")") {
          let xc = consume().value;
          steps.push(xc);
          if (xc == "+") {
            let fomi = {};
            let ra = parseSyntx(fomi);
            steps.push(ra);
            result2 = result2 + ra;
          } else if (xc == "-") {
            let fomi = {};
            let ra = parseSyntx(fomi);
            steps.push(ra);
            result2 = result2 - ra;
          } else if (xc == "*") {
            let fomi = {};
            let ra = parseSyntx(fomi);
            steps.push(ra);
            result2 = result2 * ra;
          } else if (xc == "/") {
            let fomi = {};
            let ra = parseSyntx(fomi);
            steps.push(ra);
            result2 = result2 / ra;
          }
        }
      }
      consume();
      return result2;
    }
    if (peek().type == "number") return consume().value;
    if (peek().value == ".") {
      consume();
      info.label = true;
      return context.symbs.get(context.currentLabel + "." + consume().value);
    }
    if (context.equals.has(peek().value)) {
      return context.equals.get(consume().value);
    }
    if (peek().value == "$") {
      consume();
      info.label = true;
      return context.currentIp;
    }
    if (peek().value == "offs8") {
      consume();
      let syn = parseSyntx();
      syn = syn - context.currentIp;
      if (syn < 0) {
        syn = 128 | -syn;
      }
      return syn & 255;
    }
    if (context.symbs.has(peek().value)) {
      info.label = true;
      return context.symbs.get(consume().value);
    }
    if (peek().type !== "number") {
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
    } else if (peek().value.toUpperCase() === "JIC") {
      consume();
      expect("$", "expected number");
      let inf = {};
      let pk = parseSyntx(inf);
      if (inf.label) pk += context.org;
      result.push(...LineAsm(`PAG $${pk >> 8 & 255} BCC $${pk & 255}`, context));
    } else if (peek().value.toUpperCase() === "STR") {
      consume();
      expect("$", "expected number");
      let inf = {};
      let pk = parseSyntx(inf);
      if (peek() && peek().value === ",") {
        consume();
        result.push(...parseStructured([6, "n"]));
      }
      if (inf.label) pk += context.org;
      result.push(...LineAsm(`PAG $${pk >> 8 & 255} CTA $${pk & 255}`, context));
    } else if (peek().value.toUpperCase() === "LDS") {
      consume();
      expect("$", "expected number");
      let inf = {};
      let pk = parseSyntx(inf);
      if (inf.label) pk += context.org;
      result.push(...LineAsm(`PAG $${pk >> 8 & 255} CDA $${pk & 255}`, context));
    } else if (peek().value == ";") return result;
    else if (parseSize(peek().value.toLowerCase()) !== void 0) {
      let sizeof = parseSize(consume().value.toLowerCase());
      let primarys = toBigEndianBytes(parseSyntx(), sizeof);
      while (peek() && peek().value === ",") {
        consume();
        primarys.push(...toBigEndianBytes(
          parseSyntx(),
          sizeof
        ));
      }
      result.push(...primarys);
    } else if (peek().value.toUpperCase() === "DEF") {
      let arrayParse = function() {
        let arr = [];
        while (peek() && peek().value !== ")") {
          if (peek().value == "(") {
            consume();
            arr.push(arrayParse());
          } else if (peek().type === "number") {
            arr.push(consume().value);
          } else {
            arr.push(consume().value.toLowerCase());
          }
        }
        return arr;
      };
      consume();
      let nam = consume().value.toUpperCase();
      expect("(", "expected exp");
      context.instr_assumes.set(nam, arrayParse());
    } else if (context.instr_assumes.has(peek().value.toUpperCase())) {
      let al = consume().value.toUpperCase();
      let opr = context.instr_assumes.get(al);
      let pr = parseStructured(opr);
      result.push(...pr);
    } else if (peek().value.toUpperCase() === "LOCAL") {
      consume();
      context.org = parseSyntx();
    } else if (peek().value.toUpperCase() == "RESERVE" || peek().value.toUpperCase() == "RSV") {
      consume();
      let sx = parseSyntx();
      result.push(...new Array(sx).fill(0));
    } else if (peek().value == ".") {
      consume();
      let ident = consume().value;
      expect(":");
      context.symbs.set(context.currentLabel + "." + ident, context.currentIp);
    } else if (peek().type == "identifier") {
      let ident = consume().value;
      if (peek().value.toUpperCase() == "EQU") {
        consume();
        context.equals.set(ident, parseSyntx());
      } else if (parseSize(peek().value.toLowerCase()) !== void 0) {
        context.symbs.set(ident, context.currentIp);
      } else {
        expect(":");
        context.currentLabel = ident;
        context.symbs.set(ident, context.currentIp);
      }
    } else {
      consume();
    }
  }
  return result;
}
function LineDisasm(bytes, context = null) {
  if (bytes.length < 2) return `DB ${bytes[0]}`;
  const [op, arg] = bytes;
  const hi = arg >> 4 & 15;
  const lo = arg & 15;
  const regName = (n) => ["A", "B", "C", "P", "X", "Y", "Z", "W", "M", "H", "?", "?", "?", "?", "?", "K"][n] || `R${n}`;
  const flagName = (n) => n === 0 ? "C" : n === 6 ? "D" : `F${n}`;
  const reg = `%${regName(lo)}`;
  switch (op) {
    case 0:
      if (hi === 0) return `TSA ${reg}`;
      if (hi === 1) return `MVA ${reg}`;
      break;
    case 1:
      if (hi == 0) return `CP${regName(lo)}`;
      break;
    case 2:
      if ((hi & 12) === 0) return `ZR${flagName(lo)}`;
      if ((hi & 12) === 1) return `ST${flagName(lo)}`;
      break;
    case 3:
      if (hi === 0) return `ADC ${reg}`;
      if (hi === 1) return `SBB ${reg}`;
      if (hi === 2) return `SHR ${reg}`;
      if (hi === 3) return `SHL ${reg}`;
      if (hi === 4) return `AND ${reg}`;
      if (hi === 5) return `ORB ${reg}`;
      if (hi === 6) return `MUL ${reg}`;
      if (hi === 7) return `ML8 ${reg}`;
      break;
    case 5:
      if (hi === 0) return `STA ${reg}`;
      if (hi === 1) return `LDA ${reg}`;
      if (hi === 2) return `LDB ${reg}`;
      break;
    case 15:
      if (hi === 0) return `SSA ${reg}`;
      if (hi === 1) return `SLA ${reg}`;
      break;
    case 8:
      return `BRC ${reg}`;
    case 4:
      return `PAG $${arg.toString(16).toUpperCase()}`;
    case 16:
      return `PG2 $${arg.toString(16).toUpperCase()}`;
    case 17:
      return `PG3 $${arg.toString(16).toUpperCase()}`;
    case 6:
      return `CHA $${arg}`;
    case 9:
      return `CHB $${arg}`;
    case 10:
      return `CTA $${arg}`;
    case 11:
      return `BCC $${arg}`;
    case 7:
      return `LDC $${arg}`;
    case 12:
      return `CDA $${arg}`;
    case 13:
      return `CHC $${arg}`;
    case 14:
      return `CHZ $${arg}`;
    case 19:
      return `CHH $${arg}`;
    case 18:
      return `TWI $${arg}`;
  }
  return `db $${op.toString(16)}, $${arg.toString(16)} ;??`;
}
function parseAsm(code) {
  let ctx = new Context();
  let lines = code.split("\n");
  lines.forEach((line) => {
    let instr = LineAsm(line, ctx);
    ctx.currentIp += instr.length;
  });
  ctx.currentIp = 0;
  lines.forEach((line) => {
    let instr = LineAsm(line, ctx);
    ctx.result.push(...instr);
    if (!ctx.list[ctx.currentIp]) ctx.list[ctx.currentIp] = [];
    ctx.list[ctx.currentIp].push({ instr, line });
    ctx.currentIp += instr.length;
  });
  return ctx;
}
var compiler = {
  make: parseAsm,
  info: Context,
  inspect: LineDisasm
};
export {
  Context,
  LineAsm,
  LineDisasm,
  compiler,
  cpuGen1,
  parseAsm
};
