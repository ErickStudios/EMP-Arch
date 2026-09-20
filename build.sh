#node Toolchain/sbin.js Machines/Mch1/test.asm Machines/Mch1/test.hex
#iverilog -o Machines/Mch1/cpu_sim Machines/Mch1/tb.v cpu.v
#cd Machines/Mch1/
#vvp cpu_sim
#cd ../../

npx esbuild Toolchain/emukit.js --bundle --platform=node --format=esm "--outfile=Toolchain/libemp.js"

pushd Machines/CB200; source make.sh; popd

# compilar binarios
node Toolchain/sbin.js ScratchUnit/testPr.asm ScratchUnit/testPr.dec -d
node Toolchain/sbin.js ScratchUnit/pt.asm ScratchUnit/pt.dec -d