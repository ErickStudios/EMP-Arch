
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