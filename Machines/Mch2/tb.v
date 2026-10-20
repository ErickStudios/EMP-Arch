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
    reg [1:0]       penclr_g;
    reg [7:0]       pen_chr;
    reg             pen_en;
    wire            pen_ack;
    reg             brd_dbg = 0;

    tty_pen ttyiter(
        .clr_gestione   (penclr_g),
        .ascii_char     (pen_chr),
        .enable         (pen_en),
        .ack            (pen_ack)
    );

    cpu uut(
        .clk(clk),
        .rst(rst),
        .adr(adr),
        .wvx(wvx),
        .rvx(rvx),
        .rb (rb),
        .wex(wex),
        .rex(rex),
        .exi(exi),
        .jf (jf),
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
            else if (addr >= 16'h400 && addr < 16'h500) begin
                if (addr == 16'h401)
                    BoardRead = pen_chr;
                else if (addr == 16'h400)
                    BoardRead = { 6'h0,  penclr_g};
                else
                    BoardRead = 8'h00;
            end
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
            else if (addr >= 16'h400 && addr < 16'h500) begin
                if (addr == 16'h401) begin
                    pen_chr = value;
                    pen_en = 1;
                end
                else if (addr == 16'h400)
                    penclr_g = value[1:0];
            end
        end
    endtask

    always #5 clk = ~clk;

    always @(posedge clk) begin
        if (pen_ack && pen_en) begin
            pen_en = 0;
        end
    end

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
    
                if (brd_dbg) $display("#%h L%c %h, %h", pc, mm_ind, adr, rvx);

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

                if (brd_dbg) $display("#%h S%c %h, %h", pc, mm_ind, adr, wvx);
            end
        end

        if (!rst) begin
            if (!exi) begin
                ins = {BoardRead(pc), BoardRead(pc+1), BoardRead(pc+2)};
                exi = 1;
            end
            else if (jf) begin
                if (brd_dbg) $display("#%h BR %h", pc, adr);

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