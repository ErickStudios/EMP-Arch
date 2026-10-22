// SPDX-License-Identifier: MIT
// Copyright (c) 2026 ErickCraftStudios-Markarian (Markarian)
// EMP Architecture - open hardware fsm

/**
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
module cpu(
    // instructions and state clear pins
    input       [23:0] ins, // ins to execute
    input              exi, // execute ins flag
    input              clr, // clear state
    output reg         jf, // jump flag

    // memory signals
    output reg         wex, // write enable
    output reg         rex, // read enable
    output reg  [31:0] adr, // address
    output reg  [31:0] wvx, // writed value
    input       [31:0] rvx, // read value
    output reg  [1:0]  mft  // mem fetch type, b = 0b00, h = 0b01, w = 0b10
);

reg [31:0]  a,
            x,
            y,
            w,
            n,
            lnk;

wire [31:0] z;

reg [2:0]   rmi;
wire [15:0] i16;
wire [7:0]  i8;
wire [3:0]  igr;
wire [2:0]  grfn;
wire        lowm;
wire [2:0]  rd;
wire [2:0]  ra;
wire [2:0]  rb;
reg  [15:0] flags;
reg  [31:0] tmp;

assign      rd = ins[15:13];
assign      ra = ins[12:10];
assign      rb = ins[9:7];
assign      igr = ins[23:20];
assign      grfn = ins[19:17];
assign      lowm = ins[16];

assign      i16 = ins[15:0];
assign      i8 = i16[7:0];
assign      z = 32'h0;

// Register Poke Function
task poke(
    input [2:0] r,
    input [31:0] val
);
    case (r)
        3'b001: a = val;
        3'b010: x = val;
        3'b011: y = val;
        3'b100: w = val;
        3'b101: n = val;
        3'b110: lnk = val;
        default: ;
    endcase
endtask

// Register Peek Function
function [31:0] peek(
    input [2:0] r
);
    case (r)
        3'b000: peek = z;
        3'b001: peek = a;
        3'b010: peek = x;
        3'b011: peek = y;
        3'b100: peek = w;
        3'b101: peek = n;
        3'b110: peek = lnk;
        default: peek = 32'h0;
    endcase
endfunction

// Clear Status Check
always @(clr) begin
    if (clr) begin
        a = 32'h0;
        x = 32'h0;
        y = 32'h0;
        w = 32'h0;
        n = 32'h0;
        lnk = 32'h0;
    end
end

// Instruction Status Check
always @(posedge exi) begin
    if (exi) begin
        if (wex) begin 
            wex = 1'b0;
        end
        if (jf) begin
            jf = 0;
        end
        if (rex) begin 
            poke(rmi, rvx & (mft == 2'b00 ? 32'hFF :
                    mft == 2'b01 ? 32'hFFFF :
                    32'hFFFFFFFF
            ));
            rex = 1'b0;
        end

        case (igr)
            // Aritmethic
            4'b0010: begin
                case ({grfn, lowm})
                    // Addition
                    4'b000: poke(rd, peek(ra) + peek(rb));
                    // Add with imm
                    4'b001: poke(rd, peek(ra) + {24'h0, i8});
                    // Substraction
                    4'b010: poke(rd, peek(ra) - peek(rb));
                    // Substraction with imm
                    4'b011: poke(rd, peek(ra) - {24'h0, i8});
                    default: ;
                endcase
            end
            
            // Immediates Load High/Low
            4'b0001: begin
                if (lowm) begin
                    poke(grfn, (peek(grfn) & 32'hFFFF0000) | i16);
                end
                else begin
                    poke(grfn, (peek(grfn) & 32'h0000FFFF) | i16 << 16);
                end
            end

            // Load Immediate Zero
            4'b0011: begin
                poke(grfn, {16'h0000, i16});
            end

            // Memory Stores
            4'b0000: begin
                adr = peek(ra) + peek(rb);
                mft = grfn[1:0];
                // Load
                if (grfn[2]) begin
                    rex = 1;
                    rmi = rd;
                end
                // Store
                else begin
                    wex = 1;
                    wvx = peek(rd) & (
                        mft == 2'b00 ? 32'hFF :
                        mft == 2'b01 ? 32'hFFFF :
                        32'hFFFFFFFF
                    );
                end
            end

            // More
            4'b0100: begin
                case (grfn)
                // Jump Flag
                3'b000: begin
                    tmp = peek(ra);
                    flags[0] = 1;
                    flags[1] = (tmp == 0);
                    flags[2] = (tmp[31]); 
                    flags[3] = (tmp!= 0 &&!tmp[31]);

                    // flags
                    if (flags[i16[9:6]]) begin
                        adr = peek(rd);
                        jf = 1;
                    end
                end
                endcase
            end

            default: ;
        endcase
    end
end

endmodule