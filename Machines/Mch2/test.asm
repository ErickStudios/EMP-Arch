    local 0f00h

.wt:
    ; antes
    ;   chy $5
    ;   sub %a %a
    ;   add %a %y
    ;   chx $1
    ;   add %a %x
    ;   sba %z $700h

    chy $4032
    mov %a %y
    inc %a
    sta %z $700h
    
    lda %z $700h
    inc %a
    sta %z $700h

    rsv (0Fch-$)
    jmp $.wt
    rsv (100h-$)