
    local 0e000h

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

    ret

.lf:
    ret
.cr:
    ret


start:
    ; reset terminal tty propertys
    str $term_row, $0
    str $term_col, $0

    str $0D000H, $'H'
    str $0D001H, $01FH
    str $0D002H, $'I'
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