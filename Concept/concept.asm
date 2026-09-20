    TSA r   ; a test r              00 0r
    MVA r   ; a = r                 00 1r
    CPr     ; r = a                 01 0r
    ZRf     ; fF = 0                02 0f
    STf     ; fF = 1                02 1f
    ADC r   ; a = a + r + CF        03 0r
    SBB r   ; a = a - r + CF        03 1r
    SHR r   ; a = a >> r            03 2r
    SHL r   ; a = a << r            03 3r
    AND r   ; a = a & r             03 4r
    ORB r   ; a = a | r             03 5r
    MUL r   ; a = a * r             03 6r (EMP-1028+)
    PAG $VV ; page = 0xVV           04 VV
    STA r   ; [page:r] = a          05 0r
    LDA r   ; a = [page:r]          05 1r
    LDB r   ; b = [page:r]          05 2r
    CHA $VV ; a = $VV               06 VV
    LDC $VV ; CF = FLGS[VV]         07 VV
    BRC r   ; ip = CF ? page:r : ip 08 0r
    CHB $VV ; b = $VV               09 VV
    CTA $VV ; [page:$VV] = a        0a 0r
    BCC $VV ; ip=CF?page:$VV : ip   0B VV
    CDA $VV ; a = [page:$VV]        0C VV
    CHC $VV ; c = $VV               0D VV
    CHZ $VV ; z = $VV               0E VV
    SSA r   ; [alter:r] = a; r++/-- 0F 0r (EMP-1000+)
    SLA r   ; a = [alte2:r]; r++/-- 0F 1r (EMP-1000+)
    PG2 $VV ; alter = 0xVV          10 VV
    PG3 $VV ; alte2 = 0xVV          11 VV
    TWI $VV ; a test 0xVV           12 VV (EMP-1028+)

    LDS $VV ; (MACRO) PAG $VV.H CDA $VV.L
    STR $VV ; (MACRO) PAG $VV.H CTA $VV.L
    JIC $VV ; (MACRO) PAG $VV.H BCC $VV.L