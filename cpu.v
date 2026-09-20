module cpu #(
    parameter MODEL_TYPE = 100
)(
    output reg         rex,
    output reg         wex,
    output reg  [15:0] adr,
    output reg  [7:0]  wvx,
    input       [7:0]  rvx,
    input       [15:0] ins,
    input              exi,
    input              clk,
    input              rst,
    output reg         ix,
    output reg         jf,
    output reg         ir,
    input              rg,
    output reg  [7:0]  rgt,
    input       [3:0]  rid,
    input              rs,
    input       [7:0]  rsv
);

// registers
reg [7:0]   ar; // acumulador
reg [7:0]   br; // helper acum
reg [7:0]   cr; // unnamed
reg [7:0]   pr; // page
reg [7:0]   xr;
reg [7:0]   yr;
reg [7:0]   zr;
reg [7:0]   fr; // flags
reg [7:0]   tr; // tmp
reg         b_rec;
reg [8:0]   ofr;
reg [7:0]   altpr;
reg [7:0]   alt2r;
reg [15:0]  xtr; // extendor register
reg [7:0]   hr; // high

// flags
wire        rcf; // carry flag
assign      rcf = fr[0];

wire [7:0]  opcode = ins[15:8];
wire [3:0]  reg_r  = ins[3:0];
wire [7:0]  imm_vv = ins[7:0];

function [7:0] getReg(input [3:0] id);
begin
    case (id)
    4'h0: getReg = ar;
    4'h1: getReg = br;
    4'h2: getReg = cr;
    4'h3: getReg = pr;
    4'h4: getReg = xr;
    4'h5: getReg = yr;
    4'h6: getReg = zr;
    4'h7: begin 
        if (MODEL_TYPE >= 1000) begin 
            getReg = altpr;
        end
    end
    4'h8: begin 
        if (MODEL_TYPE >= 1000) begin 
            getReg = alt2r;
        end
    end
    4'h9: begin
        if (MODEL_TYPE >= 1028) begin 
            getReg = hr;
        end
    end
    default: getReg = 8'h00;
    endcase
end
endfunction

task setRegister(input [3:0] id, input [7:0] val);
begin
    case (id)
    4'h0: ar = val;
    4'h1: br = val;
    4'h2: cr = val;
    4'h3: pr = val;
    4'h4: xr = val;
    4'h5: yr = val;
    4'h6: zr = val;
    4'h7: begin
        if (MODEL_TYPE >= 1000) begin 
            altpr = val;
        end
    end
    4'h8: begin
        if (MODEL_TYPE >= 1000) begin 
            alt2r = val;
        end
    end
    4'h9: begin
        if (MODEL_TYPE >= 1028) begin 
            hr = val;
        end
    end
    default: ;
    endcase
end
endtask

always @(posedge clk or posedge rst) begin
    if (rg) begin
        rgt = getReg(rid);
    end
    if (rs) begin
        setRegister(rid, rsv);
    end

    if (rst) begin
        ar  = 8'h00;
        br  = 8'h00;
        cr  = 8'h00;
        pr  = 8'h00;
        fr  = 8'h00;
        rex <= 1'b0;
        wex <= 1'b0;
        adr <= 16'h0000;
        wvx <= 8'h00;
        ir <= 0;
    end else if (exi) begin
        if (rex == 1) rex <= 1'b0;
        if (wex == 1) wex <= 1'b0;
        ix <= 1'b0;

        if (jf == 1) begin
            jf <= 1'b0;
        end
    
        if (ir == 1) begin
            ir <= 0;
            if (b_rec) br = rvx;
            else ar  = rvx;
            ix <= 1'b0;
        end
        else begin
            casez (opcode)
                // 00 0r: TSA r (a test r)
                8'h00: begin
                    ix <= 1'b1;
                    if (ins[7:4] == 4'h0) begin
                        tr = ar - getReg(reg_r);
                        fr[1] = 0;
                        if (tr == 0) begin 
                            fr[1] = 1;
                            fr[4] = 0;
                        end
                        else begin
                            fr[1] = 0;
                            fr[4] = 1;
                        end
                        if (tr[7] == 1) begin 
                            fr[2] = 1;
                            fr[3] = 0;
                        end
                        else begin
                            fr[2] = 0;
                            fr[3] = 1;
                        end
                    end
                    else if (ins[7:4] == 4'h1) begin
                        ar = getReg(reg_r);
                    end
                end

                // 01 0r: CPr (r = a)
                8'h01: begin
                    setRegister(reg_r, ar);
                    ix <= 1'b1;
                end

                // 02 00: ZRf/STf (fF = 0/1)
                8'h02: begin
                    if (ins[7:4] == 8'h0) 
                        fr[reg_r] = 1'b0; // ZRf
                    else if (ins[7:4] == 8'h1) 
                        fr[reg_r] = 1'b1; // STf
                    ix <= 1'b1;
                end

                // 03 0r: ADC/SBB r (a = a +/- r +/- CF)
                8'h03: begin
                    // 03 0r: ADC r (a = a + r + CF)
                    if (ins[7:4] == 4'h0) begin
                        ofr = ar + getReg(reg_r) + {7'b0, rcf};
                        ar = ofr[7:0];
                        fr[5] = ofr[8];
                        ix <= 1'b1;
                    end
                    // 03 1r: SBB r (a = a - r + CF)
                    else if (ins[7:4] == 4'h1) begin
                        ar = ar - getReg(reg_r) + {7'b0, rcf};
                        ix <= 1'b1;
                    end
                    // 03 2r: SHR r (a = a >> r)
                    else if (ins[7:4] == 4'h2) begin
                        ar = ar >> getReg(reg_r);
                        ix <= 1'b1;
                    end
                    // 03 3r: SHL r (a = a << r)
                    else if (ins[7:4] == 4'h3) begin
                        ar = ar << getReg(reg_r);
                        ix <= 1'b1;
                    end
                    // 03 4r: AND r (a = a & r)
                    else if (ins[7:4] == 4'h4) begin
                        ar = ar & getReg(reg_r);
                        ix <= 1'b1;
                    end
                    // 03 5r: ORB r (a = a | r)
                    else if (ins[7:4] == 4'h5) begin
                        ar = ar | getReg(reg_r);
                        ix <= 1'b1;
                    end
                    // 03 6r: MUL r (h:a = h:a * r)
                    else if (ins[7:4] == 4'h6 && MODEL_TYPE >= 1028) begin
                        xtr = {hr, ar} * getReg(reg_r);
                        ar = xtr[7:0];
                        hr = xtr[15:8];
                        ix <= 1'b1;
                    end
                    // 03 7r: ML8 r (h:a = a * r)
                    else if (ins[7:4] == 4'h7 && MODEL_TYPE >= 1028) begin
                        xtr = ar * getReg(reg_r);
                        ar = xtr[7:0];
                        hr = xtr[15:8];
                        ix <= 1'b1;
                    end
                end

                // 04 VV: PAG $VV (page = 0xVV)
                8'h04: begin
                    pr = imm_vv;
                    ix <= 1'b1;
                end

                // 05 ?r: STA/LDA/MDC r ([page:r] = a // a/b = [page[r]])
                8'h05: begin
                    if (ins[7:4] == 4'h0) begin
                        adr <= {pr, getReg(reg_r)};
                        wvx <= ar;
                        wex <= 1'b1;
                        ix <= 1'b1;
                    end
                    else if (ins[7:4] == 4'h1) begin
                        b_rec = 0;
                        adr <= {pr, getReg(reg_r)};
                        rex <= 1'b1;
                        ir  <= 1;
                    end
                    else if (ins[7:4] == 4'h2) begin
                        b_rec = 1;
                        adr <= {pr, getReg(reg_r)};
                        rex <= 1'b1;
                        ir  <= 1;
                    end
                end

                // 06 1r: CHA v (a = v)
                8'h06: begin
                    ix <= 1'b1;
                    ar = imm_vv;
                end

                // 07 VV: LDC $VV
                8'h07: begin
                    ix <= 1'b1;
                    fr[0] = fr[imm_vv];
                end

                // 08 0r: BRC r
                8'h08: begin
                    if (rcf) begin
                        jf <= 1'b1;
                        adr <= {pr, getReg(reg_r)};
                    end
                    ix <= 1'b1;
                end

                // 09 1r: CHB v (b = v)
                8'h09: begin
                    ix <= 1'b1;
                    br = imm_vv;
                end

                // 0a 0r: CTA $$V ([page:$VV] = a)
                8'h0a: begin
                    adr <= {pr, imm_vv};
                    wvx <= ar;
                    wex <= 1'b1;
                    ix <= 1'b1;
                end

                // 0b VV: BCC $VV
                8'h0b: begin
                    if (rcf) begin
                        jf <= 1'b1;
                        adr <= {pr, imm_vv};
                    end
                    ix <= 1'b1;
                end

                // 0c VV: CDA $VV (a = [page:$VV])
                8'h0c: begin
                    adr <= {pr, imm_vv};
                    rex <= 1'b1;
                    ir  <= 1;
                end

                // 0D 1r: CHC v (c = v)
                8'h0d: begin
                    ix <= 1'b1;
                    cr = imm_vv;
                end

                // 0E VV: CHZ v (z = v)
                8'h0e: begin
                    ix <= 1'b1;
                    zr = imm_vv;
                end

                8'h0F: begin
                    if (MODEL_TYPE >= 1000) begin
                        // 0F 0r: SSA r ([alter:r] = a; r++/--)
                        if (ins[7:4] == 4'h0) begin
                            adr <= {altpr, getReg(reg_r)};
                            wvx <= ar;
                            if (fr[6]) begin
                                if (getReg(reg_r) == 8'hFF) begin
                                    altpr = altpr + 1;
                                end
                                setRegister(reg_r, getReg(reg_r) + 1);
                            end
                            else begin
                                if (getReg(reg_r) == 8'h00) begin
                                    altpr = altpr - 1;
                                end
                                setRegister(reg_r, getReg(reg_r) - 1);
                            end
                            wex <= 1'b1;
                            ix <= 1'b1;
                        end
                        // 0F 1r: SLA r (a = [alte2:r]; r++/--)
                        else if (ins[7:4] == 4'h1) begin
                            b_rec = 0;
                            adr <= {alt2r, getReg(reg_r)};
                            if (fr[6]) begin
                                if (getReg(reg_r) == 8'hFF) begin
                                    alt2r = alt2r + 1;
                                end
                                setRegister(reg_r, getReg(reg_r) + 1);
                            end
                            else begin
                                if (getReg(reg_r) == 8'h00) begin
                                    alt2r = alt2r - 1;
                                end
                                setRegister(reg_r, getReg(reg_r) - 1);
                            end
                            rex <= 1'b1;
                            ir  <= 1;
                        end
                    end
                end

                // 10 VV: PG2 $VV = (alter = $vv)
                8'h10: begin
                    if (MODEL_TYPE >= 1000) begin
                        ix <= 1'b1;
                        altpr = imm_vv;
                    end
                end

                // 11 VV: PG3 $VV = (alte2 = $vv)
                8'h11: begin
                    if (MODEL_TYPE >= 1000) begin
                        ix <= 1'b1;
                        alt2r = imm_vv;
                    end
                end

                // 12 VV: TWI $VV = a test $vv
                8'h12: begin
                    if (MODEL_TYPE >= 1028) begin
                        tr = ar - imm_vv;
                        fr[1] = 0;
                        if (tr == 0) begin 
                            fr[1] = 1;
                            fr[4] = 0;
                        end
                        else begin
                            fr[1] = 0;
                            fr[4] = 1;
                        end
                        if (tr[7] == 1) begin 
                            fr[2] = 1;
                            fr[3] = 0;
                        end
                        else begin
                            fr[2] = 0;
                            fr[3] = 1;
                        end
                    end
                end

                // 13 VV: CHH $VV = h = $VV
                8'h13: begin
                    if (MODEL_TYPE >= 1028) begin
                        hr = imm_vv;
                    end
                end

                default: begin
                    ix <= 1'b1;
                    // Operación no definida o NOP
                end
            endcase
        end
    end
end

endmodule