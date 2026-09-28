node ../../Toolchain/sbin.js test.asm test.hex -g2
iverilog -o cpu_sim tb.v ../../cpu2.v
#cd Machines/Mch1/
vvp cpu_sim
#cd ../../