
// this uses 3 colors palettle that are controlled by
// any pen that is used by school work tools
//
// drv
//      0 = red
//      1 = blue
//      2 = black
//
// in vvp uses, the map color but there uses the function
// of $write puting a escape code of
//      [31m = red
//      [34m = blue
//      [30m = black
module tty_pen(
    input [1:0] clr_gestione,
    input [7:0] ascii_char,
    input       enable,
    output reg  ack
);
    // Simulated For Tests
    localparam SIM_RED_CODE = 8'd31;
    localparam SIM_BLUE_CODE = 8'd34;
    localparam SIM_BLACK_CODE = 8'd30;
    localparam SIM_GREEN_CODE = 8'd32;

    // Colors Tables For Simulator
    wire [7:0] SIM_CLR_CODE;
    reg [31:0] SIM_CLR_TABLE = {
        SIM_GREEN_CODE,
        SIM_BLACK_CODE,
        SIM_BLUE_CODE,
        SIM_RED_CODE
    };
    assign SIM_CLR_CODE = SIM_CLR_TABLE[clr_gestione * 8 +: 8];

    always @(*) begin
        ack = 1'b0;
        
        if (enable) begin
            $write("%c[%0dm%c%c[0m", 27, SIM_CLR_CODE, ascii_char, 27);
            $fflush(32'h8000_0001);
            ack = 1'b1;
        end
    end

endmodule