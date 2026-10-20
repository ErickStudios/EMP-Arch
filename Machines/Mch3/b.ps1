node "$PSScriptRoot/../../Toolchain/sbin.js" "$PSScriptRoot/test.riscv" "$PSScriptRoot/test.hex" -g3

iverilog -o "$PSScriptRoot/cpu_sim" "$PSScriptRoot/tb.v" "$PSScriptRoot/../../cpu3.v"

Push-Location $PSScriptRoot
vvp cpu_sim
Pop-Location