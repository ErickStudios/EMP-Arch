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
    reg  [7:0]      rom [0:255];
    reg  [7:0]      ram0 [0:2047];
    wire [7:0]      mm_ind;
    reg [7:0]       vram[0:255]; // 64x32 1bpp

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

    assign mm_ind = rb ? 66: 87;

    function [7:0] BoardRead;
        input [15:0] addr;
        begin
            if (addr >= 16'h0F00 && addr < 16'h1000)
                BoardRead = rom[addr - 16'h0F00];
            else if (addr >= 16'h700 && addr < 16'hF00)
                BoardRead = ram0[addr - 16'h700];
            else if (addr >= 16'h200 && addr < 16'h300)
                BoardRead = vram[addr - 16'h200];
            else
                BoardRead = 8'h00;
        end
    endfunction

    task BoardWrite;
        input [15:0] addr;
        input [7:0]  value;
        begin
            if (addr >= 16'h700 && addr < 16'hF00)
                ram0[addr - 16'h700] = value;
            else if (addr >= 16'h200 && addr < 16'h300)
                vram[addr - 16'h200] = value;
        end
    endtask

    always #5 clk = ~clk;

    always @(negedge clk) begin
        if (!exi) begin
            // When Read
            if (rex) begin 
                // Read Byte
                if (rb) begin
                    rvx = BoardRead(adr);
                end
                // Read Word
                else begin
                    rvx = {BoardRead(adr), BoardRead(adr+1)};
                end
    
                $display("#%h L%c %h, %h", pc, mm_ind, adr, rvx);

            end
            // When Write
            if (wex) begin
                // Write Byte
                if (rb) begin
                    BoardWrite(adr, wvx[7:0]);
                end
                // Write Word
                else begin
                    BoardWrite(adr, wvx[15:8]);
                    BoardWrite(adr+1, wvx[7:0]);
                end

                $display("#%h S%c %h, %h", pc, mm_ind, adr, wvx);
            end
        end

        if (!rst) begin
            if (!exi) begin
                ins = {BoardRead(pc), BoardRead(pc+1), BoardRead(pc+2)};
                exi = 1;
            end
            else if (jf) begin
                $display("#%h BR %h", pc, adr);

                pc = adr;
                if (exi) begin
                    exi = 0;
                end
            end
            else if (exi) begin
                if (lnx) pc = pc + 3;
                else pc = pc + 2;
                
                exi = 0;
            end
        end

    end

    initial begin
                $readmemh("test.hex", rom);
                clk = 0;
                pc = 16'h0FFC;
        #10     rst = 0;

        for (integer i = 0; i < 256; i = i + 1) begin
            vram[i] = 0;
        end

        #320     $finish;
    end
    
endmodule