
    local 0e000h

    ; firmware header
    dd (tos+0) ; stack def header in firmware
    rsv 128 ; reserve stack
tos:

; define the extensions that the
; cpu interceptor of the CHESEBOX 200
def vrt (60h (r r))
def vre (61h 00h)
def vrd (61h 01h)
def gvr (62h (r r)) ; get virt

def lik (50h 00h) ; active link flag before jumping
def ret (50h 01h) ; return for stack

term_row db 0 ; row
term_col db 0 ; column

rsv (400H-$) ; 1K OF WRITEABLE ROM ENDS

; A = char
tty:
    cpz ; copy a to z
    twi $10 ; line feed
    ldc $1 ; equal flag
    jic $.lf ; line feed
    twi $13 ; carrige return
    ldc $1 ; equal flag
    jic $.cr ; line feed

    lds $term_col ; terminal col
    cpx ; copy to x
    lds $term_row ; row
    chc $20 ; cols
    ml8 %c ; multiply
    adc %x ; add
    chc $2 ; mul value
    ml8 %c ; multiply ignoring high (ml8)
    cpy ; copy to y
    mva %h ; reg
    cpx ; copy to x
    pag $0D0H ; page
    mva %p ; copy page
    adc %x ; extend page
    cpp ; copy to page
    mva %z ; move the old char
    sta %y ; standart page write with y
           ; the page is extended always
    
    zrc ; for avoid problems
    lds $term_col ; read
    chc $1 ; the value
    adc %c ; increments
    str $term_col ; write back
    ret

.lf:
    ret
.cr:
    ret

start:
    ; reset terminal tty propertys
    str $term_row, $0
    str $term_col, $0
    
    lik 
    stc
    cha $'X'
    jic $tty
    lik
    stc
    cha $'D'
    jic $tty

    ;str $0D000H, $'H'
    str $0D001H, $01FH
    ;str $0D002H, $'I'
    str $0D003H, $01FH

hang:
    stc
    jic $hang

    rsv (1ff0h-$)
    
    ; the next routine will be at end of
    ; first no virtual 64K of machine for
    ; the initial PC
    stc
    jic $start
    rsv (2000h-$)