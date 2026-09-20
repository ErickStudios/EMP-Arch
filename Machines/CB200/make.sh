verilator \
    --cc "../../cpu.v" \
    --top-module cpu \
    --exe "machine.cpp" \
    --build \
    --Wno-WIDTH \
    -GMODEL_TYPE=1028
    #\
    #--CFLAGS "$(sdl2-config --cflags)" \
    #--LDFLAGS "$(sdl2-config --libs)"

tool="../../Toolchain"
asm=$tool/sbin.js

node $asm std.asm std.fd -rbin

./obj_dir/Vcpu