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

module tb;
    reg             clk;
    reg             rst = 1;
    wire [15:0]     adr;
    wire [15:0]     wvx;
    reg  [15:0]     rvx;
    wire            rb;
    wire            wex;
    wire            rex;
    reg             exi = 0;
    wire            jf;
    wire            lnx;
    reg  [23:0]     ins;
    reg  [15:0]     pc;
    reg  [7:0]      rom [0:4095];

    cpu uut(
        .clk(clk),
        .rst(rst),
        .adr(adr),
        .wvx(wvx),
        .rvx(rvx),
        .rb(rb),
        .wex(wex),
        .rex(rex),
        .exi(exi),
        .jf(jf),
        .ins(ins),
        .lnx(lnx)
    );

    always #5 clk = ~clk;

    always @(negedge clk) begin
        if (rex) rvx = 16'hffff;

        if (!rst) begin
            if (!exi) begin
                ins = {rom[pc], rom[pc + 1], rom[pc + 2]};
                exi = 1;
            end
            else if (exi) begin
                if (lnx) pc = pc + 3;
                else pc = pc + 2;
                
                exi = 0;
            end

            if (jf) begin
                pc = adr;
            end
        end

    end

    always @(posedge clk) begin
        if (!rst) begin
            if (exi) $write("pc=%h ", pc);
        end
    end

    initial begin
                $readmemh("test.hex", rom);
                clk = 0;
                pc = 0;
        #10     rst = 0;

        #160     $finish;
    end
    
endmodule