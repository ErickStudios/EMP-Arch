module tb();
    reg         clr = 1;
    reg [23:0]  ins;
    reg         exi;
    reg [31:0]  pc = 32'hffff0;
    wire        wex;
    wire        rex;
    wire [31:0] wvx;
    reg  [31:0] rvx;
    wire        jf;
    wire [31:0] adr;
    reg  [7:0]  rom[0:32'hffff];
    reg         clk = 0;
    wire [1:0]  mft;
    reg         nis = 0;

    always #1   clk = ~clk;

    cpu uut(
        .clr(clr),
        .ins(ins),
        .exi(exi),
        .wex(wex),
        .rex(rex),
        .adr(adr),
        .wvx(wvx),
        .rvx(rvx),
        .jf(jf),
        .mft(mft)
    );

    // Function For Read Byte
    function [7:0] rb(input [31:0] adr);
        if (adr >= 32'hF0000) begin
            rb = rom[adr - 32'hF0000];
        end
        else rb = 0;
    endfunction

    always @(posedge clk) begin
        if (exi) exi = 0;
    end

    // Reading Fetcher
    always @(posedge rex) begin
        $display("R%h %h", mft, adr);
    end

    // Writer Fetcher
    always @(posedge wex) begin
        $display("W%h %h %h", mft, adr, wvx);
    end

    // Clock Instruction Fetcher
    always @(negedge clk) begin
        if (!clr) begin
            if (jf) begin
                pc = adr;
                nis = 1;
            end
            else begin
                pc = pc + 3;
            end
        end

        if (nis) begin
            nis = 0;
            exi = 1;
            ins = 24'h200000;
        end
        else begin
            exi = 1;
            ins = {rb(pc), rb(pc+1), rb(pc+2)};
            $display("#%h %h", pc, ins);

            if (ins[23:16] == 8'h40) nis = 1;
        end
    end

    initial begin
        $readmemh("test.hex", rom);

        #10 clr = 0;

        #100;

        $finish();
    end
endmodule