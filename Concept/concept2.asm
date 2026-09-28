
;    A, X, Y, ZERO
;    0b0000:0xO 0xRS      = {O} %R %S
;    0b1000:0xO 0xSSSS    = {O} $S
;    0b1001:0bRRII 0xXXYY = LDR %I $XXYYh
;    0b1010:0bRRII 0xXXYY = STR %I $XXYYh
;    0b1100:0bRRII 0xXXYY = LBR %I $XXYYh
;    0b1101:0bRRII 0xXXYY = SBR %I $XXYYh
;    0b1011:0x0 0xXXYY    = JMP $XXYYh
;    0b1011:0x1 0xXXYY    = BCF $XXYYh
;    0b0001:0x0 0x?R      = JMP %R
;    0b0001:0x1 0x?R      = BCF %R
;    0b1110:0b00RR 0xXXYY = CHR $XXYYh