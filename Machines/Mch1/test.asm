
    local 0C000h ; en ROM
    
    BANK_CFG equ 0A000h
    SP_OFF   equ 0A100h
    SP_PAG   equ 0A101h
    BL_REG   equ 0A102h
    RT_REG   equ 0A103h

reset:
    CHA $0FFh
    PAG $SP_PAG.h
    CTA $SP_PAG.l
    CHA $01Fh
    CTA $SP_OFF.l

    PAG $SP_PAG.h
    CTA $BL_REG.l
    
    CHA $10
    CHB $10
    PAG $mul.h
    BCC $mul.l

    STA %p

    ;PAG $SP_PAG.h
    ;CTA $BL_REG.l

    ;PAG $proce.h
    ;BCC $proce.l

    CHB $00
    CHZ $16
    PG3 $04h
    PG2 $07h
    STD
aloop:
    SLA %b
    SSA %z

    STC
    PAG $aloop.h
    BCC $aloop.l

; a = a * b
mul:
    CPC
    CPY
    CPX
.loop:
    ZRC
    MVA %x
    ADC %y
    CPX
    MVA %b
    CHZ $1
    SBB %z
    CPB
    CHZ $1
    TSA %z 
    LDC $4  ; cargar flag de not equal
    
    PAG $.loop.h
    BCC $.loop.l

    MVA %x
    PAG $RT_REG.h
    CTA $RT_REG.l

proce:
    PAG $RT_REG.h
    CTA $RT_REG.l

    reserve (3FF0h-$)
    STC
    PAG $reset.h
    BCC $reset.l
    reserve (4000h-$)
