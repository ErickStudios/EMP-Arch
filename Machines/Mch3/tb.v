module tb();
    reg         clr = 1;
    reg [23:0]  ins;
    reg         exi;
    reg [31:0]  pc = 32'hffff0;
    wire        wex;
    wire        rex;
    wire        jf;
    wire [31:0] adr;
    reg  [7:0]  rom[0:32'hffff];
    reg         clk = 0;

    always #1   clk = ~clk;

    cpu uut(
        .clr(clr),
        .ins(ins),
        .exi(exi),
        .wex(wex),
        .rex(rex),
        .adr(adr),
        .jf(jf)
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

    // Clock Instruction Fetcher
    always @(negedge clk) begin
        if (!clr) begin
            if (jf) begin
                pc = adr;
            end
            else begin
                pc = pc + 3;
            end
            exi = 1;
        end

        ins = {rb(pc), rb(pc+1), rb(pc+2)};
        $display("#%h %h", pc, ins);
    end

    initial begin
        $readmemh("test.hex", rom);

        #10 clr = 0;

        #100;

        $finish();
    end
endmodule