// SPDX-License-Identifier: MIT
// Copyright (c) 2026 ErickCraftStudios-Markarian (Markarian)
// EMP Architecture - open hardware fsm

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

module cpu(
    input               clk,
    input               rst,
    output reg  [15:0]  adr,
    output reg  [15:0]  wvx,
    input       [15:0]  rvx,
    output reg          rb,
    output reg          wex,
    output reg          rex,
    input               exi,
    output reg          jf,
    output reg          ix,
    input       [23:0]  ins,
    output reg          lnx // 0 = 2B, 1 = 3B
);

// Processor registers
reg  [15:0] ar;
reg  [15:0] xr;
reg  [15:0] yr;
reg  [15:0] tmp;
wire [15:0] zr;
reg  [1:0]  nxr;
reg  [15:0] flags;

// instruction information
wire        lenx;
wire [2:0]  actx;
wire [3:0]  subg;
wire [3:0]  oper;
wire [1:0]  rdst;
wire [1:0]  ridx;
wire [1:0]  rop;
wire [15:0] i16;
wire [7:0]  i8;
wire [1:0]  rus;

wire [1:0]  ropr1;
wire [1:0]  ropr2;
wire [1:0]  sbac;

assign lenx = ins[23];
assign actx = ins[22:20];
assign subg = ins[19:16];

assign rdst = subg[3:2];
assign ridx = subg[1:0];
assign oper = subg[3:0];
assign sbac = rdst;
assign rop = ridx;

assign i16 = ins[15:0];
assign i8 = ins[15:8];

assign ropr1 = ins[13:12];
assign ropr2 = ins[9:8];

assign rus = ins[9:8];

function [15:0] operate(
    input [3:0] opid,
    input [15:0] opr1,
    input [15:0] opr2
); 
    case (opid)
        4'h0: operate = opr1 + opr2;
        4'h1: operate = opr1 - opr2;
        4'h2: operate = opr1 * opr2;
        4'h3: operate = opr1 / opr2;
        4'h4: operate = opr1 ^ opr2;
        4'h5: operate = opr1 | opr2;
        4'h6: operate = opr1 & opr2;
        4'h7: operate = opr1 >> opr2;
        4'h8: operate = opr1 << opr2;
    endcase
endfunction

task setRegister(input [1:0] rid, input [15:0] val);
    case (rid)
        2'b00: ar = val;
        2'b01: xr = val;
        2'b10: yr = val;
        default: ;
    endcase
endtask

function [15:0] getRegister(
    input [1:0] rid
);
    case (rid)
        2'b00: getRegister = ar;
        2'b01: getRegister = xr;
        2'b10: getRegister = yr;
        2'b11: getRegister = zr;
    endcase
endfunction

always @(posedge clk or posedge rst) begin
    if (rst) begin
        ar = 0;
        xr = 0;
        yr = 0;
        flags = 0;
    end else if (exi) begin

        lnx = lenx;

        if (rex) begin 
            rex = 0;
            setRegister(nxr, rvx & (rb ? 16'hFF : 16'hFFFF));
        end
        if (wex) wex = 0;

        if (jf) jf = 0;

        //$display("lenx=%b actx=%b subg=%b i16=%h flags=%b a,x,y=%h,%h,%h", lenx, actx, subg, i16, flags, ar, xr, yr);

        if (lenx) begin
            // {O} %A, $S
            if (actx == 3'b000) begin
                tmp = operate(oper, ar, i16);
                ar = tmp;
            end
            // LDR $XXYYh, %I
            else if (actx == 3'b001) begin
                nxr = rdst;
                adr = i16 + getRegister(ridx);
                rex = 1;
                rb = 0;
            end
            // STR $XXYYh, %I
            else if (actx == 3'b010) begin
                adr = i16 + getRegister(ridx);
                wvx = getRegister(rdst);
                wex = 1;
                rb = 0;
            end
            // LBR $XXYYh, %I
            else if (actx == 3'b100) begin
                nxr = rdst;
                adr = i16 + getRegister(ridx);
                rex = 1;
                rb = 1;
            end
            // SBR $XXYYh, %I
            else if (actx == 3'b101) begin
                adr = i16 + getRegister(ridx);
                wvx = getRegister(rdst) & 16'hFF;
                wex = 1;
                rb = 1;
            end
            // JMP/BCF $XXYYh
            else if (actx == 3'b011) begin
                // JMP $XXYYh
                if (subg == 0) begin
                    jf = 1;
                    adr = i16;
                end
                // BCF $XXYYh
                else if (subg == 1) begin
                    if (flags[0]) begin
                        jf = 1;
                        adr = i16;
                    end
                end
            end
            // CHR $XXYYh
            else if (actx == 3'b110) begin
                setRegister(ridx, i16);
            end
            // TIR $XXYYh
            else if (actx == 3'b111) begin
                tmp = getRegister(ridx) - i16;
                flags[1] = (tmp == 0);
                flags[2] = (tmp[15]); 
                flags[3] = (tmp!= 0 &&!tmp[15]);
            end
        end
        else begin
            // {O} %R, %S
            if (actx == 3'b000) begin
                tmp = operate(oper, getRegister(ropr1), getRegister(ropr2));
                setRegister(ropr1, tmp);
            end
            // JMP/BCF %R
            else if (actx == 3'b001) begin
                // JMP $XXYYh
                if (subg == 0) begin
                    jf = 1;
                    adr = getRegister(rus);
                end
                // BCF $XXYYh
                else if (subg == 1) begin
                    if (flags[0]) begin
                        jf = 1;
                        adr = getRegister(rus);
                    end
                end
            end
            // TSR %R
            else if (actx == 3'b010) begin
                // TSR %R
                if (sbac == 0) begin
                    tmp = getRegister(ridx) - getRegister(rus);
                    flags[1] = (tmp == 0);
                    flags[2] = (tmp[15]); 
                    flags[3] = (tmp!= 0 &&!tmp[15]);
                end
                // LCF $ID/...
                else if (sbac == 1) begin
                    // LCF $ID
                    if (rop == 0) begin
                        flags[0] = flags[i8];
                    end
                end
            end
        end
    end
end

endmodule