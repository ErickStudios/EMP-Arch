cd Machines/Mch2/
source build.sh
cd ../../

npx esbuild Toolchain/emukit.js --bundle --platform=node --format=esm "--outfile=Toolchain/libemp.js"

pushd Machines/CB200; source make.sh; popd

# compilar binarios
node Toolchain/sbin.js ScratchUnit/testPr.asm ScratchUnit/testPr.dec -d
node Toolchain/sbin.js ScratchUnit/pt.asm ScratchUnit/pt.dec -d