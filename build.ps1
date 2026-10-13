
npx esbuild "$PSScriptRoot/Toolchain/emukit.js" --bundle --platform=node --format=esm "--outfile=Toolchain/libemp.js"

powershell "$PSScriptRoot/Machines/build.ps1"