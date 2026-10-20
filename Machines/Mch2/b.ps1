node "$PSScriptRoot/../../Toolchain/sbin.js" "$PSScriptRoot/test.asm" "$PSScriptRoot/test.hex" -g2

iverilog -o "$PSScriptRoot/cpu_sim" "$PSScriptRoot/teletypeE90.v" "$PSScriptRoot/tb.v" "$PSScriptRoot/../../cpu2.v"

Push-Location $PSScriptRoot
vvp cpu_sim
Pop-Location