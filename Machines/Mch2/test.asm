.wt:
    lba %z $0d000h
    tia $0ffh
    lcf $1
    bcf $.wt
    
    rsv (1000h-$)