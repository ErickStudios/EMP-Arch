
// Generation 1 of EMP
export class cpuGen1 {
    constructor(model=1028) {
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
            case 0: this.ar = val; break;
            case 1: this.br = val; break;
            case 2: this.cr = val; break;
            case 3: this.pr = val; break;
            case 4: this.xr = val; break;
            case 5: this.yr = val; break;
            case 6: this.zr = val; break;
            case 7: this.altpr = val; break;
            case 8: this.alt2r = val; break;
            case 9: this.hr = val; break;
            default:
                break;
        }
    }
    getReg(id) {
        switch (id) {
            case 0: return this.ar;
            case 1: return this.br;
            case 2: return this.cr;
            case 3: return this.pr;
            case 4: return this.xr;
            case 5: return this.yr;
            case 6: return this.zr;
            case 7: return this.altpr;
            case 8: return this.alt2r;
            case 9: return this.hr;
            default: return 0;
        }
    }
    normalize(x){
        return ((x % 256) + 256) % 256
    }
    exi(ins) {
        let opcode = (ins >> 8) & 0xFF;
        let imm_vv = ins & 0xFF;
        let reg_r = imm_vv & 0xF;
        let imm_nibl = imm_vv >> 4;

        switch (opcode) {
            case 0:
                // 00 0r: TSA r (a test r)
                if (imm_nibl == 0) {
                    this.tr = this.ar - this.getReg(reg_r);
                    this.fr[1] = 0
                    if (this.tr == 0) {
                        this.fr[1] = 1;
                        this.fr[4] = 0;
                    }
                    else {
                        this.fr[1] = 0;
                        this.fr[4] = 1;
                    }

                    if (this.tr < 0) {
                        this.fr[2] = 1;
                        this.fr[3] = 0;
                    }
                    else {
                        this.fr[2] = 0;
                        this.fr[3] = 1;
                    }
                }
                // 00 1r: MVA r (a = r)
                else if (imm_nibl == 1) {
                    this.ar = this.getReg(reg_r);
                }
                break;
            // 01 0r: CPr (r = a)
            case 1:
                this.setReg(reg_r, this.ar);
                break
            // 02 00: ZRf/STf (fF = 0/1)
            case 2:
                if (imm_nibl == 0) this.fr[reg_r] = 0;
                else if (imm_nibl == 1) this.fr[reg_r] = 1
                break;
            // 03 0r: ADC/SBB r (a = a +/- r +/- CF)
            case 3:
                // 03 0r: ADC r (a = a + r + CF)
                if (imm_nibl == 0) {
                    this.ar = this.ar + this.getReg(reg_r) + this.fr[0];
                    this.fr[5] = this.ar >> 8;
                    this.ar = this.ar & 0xFF;
                }
                // 03 1r: SBB r (a = a - r + CF)
                else if (imm_nibl == 1) {
                    this.ar = this.normalize((this.ar - this.getReg(reg_r)) + this.fr[0]);
                }
                // 03 2r: SHR r (a = a >> r)
                else if (imm_nibl == 2) {
                    this.ar = (this.ar >> this.getReg(reg_r)) & 0xFF;
                }
                // 03 3r: SHL r (a = a << r)
                else if (imm_nibl == 3) {
                    this.ar = (this.ar << this.getReg(reg_r)) & 0xFF;
                }
                // 03 4r: AND r (a = a & r)
                else if (imm_nibl == 4) {
                    this.ar = this.ar & this.getReg(reg_r);
                }
                // 03 5r: ORB r (a = a | r)
                else if (imm_nibl == 5) {
                    this.ar = this.ar | this.getReg(reg_r);
                }
                // 03 6r: MUL r (h:a = h:a * r)
                else if (imm_nibl == 6 && this.model >= 1028) {
                    this.xtr = ((this.hr << 8) | this.ar) * this.getReg(reg_r);
                    this.ar = this.xtr & 0xFF;
                    this.hr = (this.xtr >> 8) & 0xFF;
                }
                // 03 7r: ML8 r (h:a = a * r)
                else if (imm_nibl == 7 && this.model >= 1028) {
                    this.xtr = this.ar * this.getReg(reg_r);
                    this.ar = this.xtr & 0xFF;
                    this.hr = (this.xtr >> 8) & 0xFF;
                }
                break;
            // 04 VV: PAG $VV (page = 0xVV)
            case 4:
                this.pr = imm_vv;
                break;
            // 05 ?r: STA/LDA/MDC r ([page:r] = a // a/b = [page[r]])
            case 5:
                if (imm_nibl == 0) {
                    this.adr = (this.pr << 8) | this.getReg(reg_r);
                    this.wex(this.adr, this.ar);
                }
                else if (imm_nibl == 1) {
                    this.adr = (this.pr << 8) | this.getReg(reg_r);
                    this.ar = this.rex(this.adr);
                }
                else if (imm_nibl == 2) {
                    this.adr = (this.pr << 8) | this.getReg(reg_r);
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
                break
            // 08 0r: BRC r
            case 8:
                if (this.fr[0]) {
                    this.adr = (this.pr << 8) | this.getReg(reg_r);
                    this.jf(this.adr);
                }
                break;
            // 09 1r: CHB v (b = v)
            case 9:
                this.br = imm_vv;
                break;
            // 0a 0r: CTA $$V ([page:$VV] = a)
            case 10:
                this.adr = (this.pr << 8) | imm_vv;
                this.wex(this.adr, this.ar);
                break;
            // 0b VV: BCC $VV
            case 11:
                if (this.fr[0]) {
                    this.adr = (this.pr << 8) | imm_vv;
                    this.jf(this.adr);
                }
                break;
            // 0c VV: CDA $VV (a = [page:$VV])
            case 12:
                this.adr = (this.pr << 8) | imm_vv;
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
                if (this.model >= 1000) {
                    // 0F 0r: SSA r ([alter:r] = a; r++/--)
                    if (imm_nibl == 0) {
                        this.adr = (this.altpr << 8) | this.getReg(reg_r);
                        this.wex(this.adr, this.ar);
                        if (this.fr[6]) {
                            if (this.getReg(reg_r) == 0xFF) {
                                this.altpr = this.altpr + 1;
                            }
                            this.setReg(reg_r, this.normalize(this.getReg(reg_r) + 1));
                        }
                        else {
                            if (this.getReg(reg_r) == 0) {
                                this.altpr = this.altpr - 1;
                            }
                            this.setReg(reg_r, this.normalize(this.getReg(reg_r) - 1));
                        }
                    }
                    // 0F 1r: SLA r (a = [alte2:r]; r++/--)
                    else if (imm_nibl == 1) {
                        this.adr = (this.alt2r << 8) | this.getReg(reg_r);
                        this.ar = this.rex(this.adr);
                        if (this.fr[6]) {
                            if (this.getReg(reg_r) == 0xFF) {
                                this.alt2r = this.alt2r + 1;
                            }
                            this.setReg(reg_r, this.normalize(this.getReg(reg_r) + 1));
                        }
                        else {
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
                if (this.model >= 1000) this.altpr = imm_vv;
                break;
            // 11 VV: PG3 $VV = (alte2 = $vv)
            case 17:
                if (this.model >= 1000) this.alt2r = imm_vv;
                break;
            // 12 VV: TWI $VV = a test $vv
            case 18:
                if (this.model >= 1028) {
                    this.tr = this.ar - imm_vv;
                    this.fr[1] = 0
                    if (this.tr == 0) {
                        this.fr[1] = 1;
                        this.fr[4] = 0;
                    }
                    else {
                        this.fr[1] = 0;
                        this.fr[4] = 1;
                    }

                    if (this.tr < 0) {
                        this.fr[2] = 1;
                        this.fr[3] = 0;
                    }
                    else {
                        this.fr[2] = 0;
                        this.fr[3] = 1;
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
}

// Generation 2 of EMP
export class cpuGen2 {
    constructor() {
        this.crt();
    }
    crt() {
        this.ar = 0;
        this.xr = 0;
        this.yr = 0;
        this.tmp = 0;
        this.zr = 0;
        this.flags = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    }
    rst() {
        this.crt()
    }
    nwi(ins) {
        this.lenx = (ins >> 23) & 0b1;
        this.actx = (ins >> 20) & 0b111;
        this.subg = (ins >> 16) & 0xF;
        this.rdst = (this.subg >> 2) & 0b11;
        this.ridx = this.subg & 0b11;
        this.sbac = this.rdst;
        this.rop = this.ridx;
        this.i16 = ins & 0xFFFF;
        this.i8 = (this.i16 >> 8) & 0xFF;
        this.ropr1 = (ins >> 12) & 0b11;
        this.ropr2 = (ins >> 8) & 0b11;
        this.rus = this.ropr2;
        this.oper = this.subg & 0xF;
    }
    operate2(opid, opr1, opr2) {
        switch (opid) {
            case 0: return opr1 + opr2;
            case 1: return opr1 - opr2;
            case 2: return opr1 * opr2;
            case 3: return Math.floor(opr1 / opr2);
            case 4: return opr1 ^ opr2;
            case 5: return opr1 | opr2;
            case 6: return opr1 & opr2;
            case 7: return opr1 >> opr2;
            case 8: return opr1 << opr2;   
            default: return 0;
        }
    }
    operate(opid, opr1, opr2) {
        return this.operate2(opid, opr1, opr2) & 0xFFFF;
    }
    setRegister(rid, val) {
        switch (rid) {
            case 0: this.ar = val; break;
            case 1: this.xr = val; break;
            case 2: this.yr = val; break;
            default: break;
        }
    }
    getRegister(rid) {
        switch (rid) {
            case 0: return this.ar;
            case 1: return this.xr;
            case 2: return this.yr;
            case 3: return 0;
            default: return 0;
        }
    }
    exi(ins) {
        this.nwi(ins);

        if (this.lenx) {
            // {O} %A, $S
            if (this.actx == 0b000) {
                this.ar = this.operate(this.oper, this.ar, this.i16);
            }
            // LDR $XXYYh, %I
            else if (this.actx == 0b001) {
                let adr = this.i16 + this.getRegister(this.ridx);
                this.setRegister(this.rdst, (this.rex(adr) << 8) | this.rex(adr+1));
            }
            // STR $XXYYh, %I
            else if (this.actx == 0b010) {
                let adr = this.i16 + this.getRegister(this.ridx);
                let val = this.getRegister(this.rdst)
                this.wex(adr, (val >> 8) & 0xFF);
                this.wex(adr+1, val & 0xFF);
            }
            // LBR $XXYYh, %I
            else if (this.actx == 0b100) {
                this.setRegister(this.rdst, (this.rex(this.i16 + this.getRegister(this.ridx))) & 0xFF);
            }
            // SBR $XXYYh, %I
            else if (this.actx == 0b101) {
                this.wex(this.i16 + this.getRegister(this.ridx), this.getRegister(this.rdst) & 0xFF);
            }
            // JMP/BCF $XXYYh
            else if (this.actx == 0b011) {
                // JMP $XXYYh
                if (this.subg == 0) {
                    this.jf(this.i16);
                }
                // BCF $XXYYh
                else if (this.subg == 1) {
                    if (this.flags[0] == 1) {
                        this.jf(this.i16);
                    }
                }
            }
            // CHR $XXYYh
            else if (this.actx == 0b110) {
                this.setRegister(this.ridx, this.i16);
            }
            // TIR $XXYYh
            else if (this.actx == 0b111) {
                this.tmp = this.getRegister(this.ridx) - this.i16
                this.flags[1] = Number(this.tmp == 0);
                this.flags[2] = Number((this.tmp & 0x8000) != 0);
                this.flags[3] = Number(this.tmp != 0 && (this.tmp & 0x8000) == 0);
            }
        }
        else {
            // {O} %R, %S
            if (this.actx == 0b000) {
                this.setRegister(this.ropr1, this.operate(this.oper, this.getRegister(this.ropr1), this.getRegister(this.ropr2)))
            }
            // JMP/BCF %R
            else if (this.actx == 0b001) {
                // JMP %R
                if (this.subg == 0) {
                    this.jf(this.i16);
                }
                // BCF %R
                else if (this.subg == 1) {
                    if (this.flags[0] == 1) {
                        this.jf(this.i16);
                    }
                }
            }
            // TSR %R
            else if (this.actx == 0b10) {
                // TSR %R
                if (this.sbac == 0) {
                    this.tmp = this.getRegister(this.ridx) - this.getRegister(this.rus);
                    this.flags[1] = Number(this.tmp == 0);
                    this.flags[2] = Number((this.tmp & 0x8000) != 0);
                    this.flags[3] = Number(this.tmp != 0 && (this.tmp & 0x8000) == 0);
                }
                // LCF $ID/..
                else if (this.sbac == 1) {
                    // LCF $ID
                    if (this.rop == 0) {
                        this.flags[0] = this.flags[this.i8];
                    }
                }
            }
        }

        return this.lenx == 1 ? 3 : 2;
    }
}