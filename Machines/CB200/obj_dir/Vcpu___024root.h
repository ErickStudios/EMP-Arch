// Verilated -*- C++ -*-
// DESCRIPTION: Verilator output: Design internal header
// See Vcpu.h for the primary calling header

#ifndef VERILATED_VCPU___024ROOT_H_
#define VERILATED_VCPU___024ROOT_H_  // guard

#include "verilated.h"


class Vcpu__Syms;

class alignas(VL_CACHE_LINE_BYTES) Vcpu___024root final : public VerilatedModule {
  public:

    // DESIGN SPECIFIC STATE
    VL_IN8(clk,0,0);
    VL_IN8(rst,0,0);
    VL_OUT8(rex,0,0);
    VL_OUT8(wex,0,0);
    VL_OUT8(wvx,7,0);
    VL_IN8(rvx,7,0);
    VL_IN8(exi,0,0);
    VL_OUT8(ix,0,0);
    VL_OUT8(jf,0,0);
    VL_OUT8(ir,0,0);
    VL_IN8(rg,0,0);
    VL_OUT8(rgt,7,0);
    VL_IN8(rid,3,0);
    VL_IN8(rs,0,0);
    VL_IN8(rsv,7,0);
    CData/*7:0*/ cpu__DOT__ar;
    CData/*7:0*/ cpu__DOT__br;
    CData/*7:0*/ cpu__DOT__cr;
    CData/*7:0*/ cpu__DOT__pr;
    CData/*7:0*/ cpu__DOT__xr;
    CData/*7:0*/ cpu__DOT__yr;
    CData/*7:0*/ cpu__DOT__zr;
    CData/*7:0*/ cpu__DOT__fr;
    CData/*7:0*/ cpu__DOT__tr;
    CData/*0:0*/ cpu__DOT__b_rec;
    CData/*7:0*/ cpu__DOT__altpr;
    CData/*7:0*/ cpu__DOT__alt2r;
    CData/*7:0*/ cpu__DOT__hr;
    CData/*0:0*/ cpu__DOT__rcf;
    CData/*0:0*/ __VstlFirstIteration;
    CData/*0:0*/ __Vtrigprevexpr___TOP__clk__0;
    CData/*0:0*/ __Vtrigprevexpr___TOP__rst__0;
    CData/*0:0*/ __VactContinue;
    VL_OUT16(adr,15,0);
    VL_IN16(ins,15,0);
    SData/*8:0*/ cpu__DOT__ofr;
    SData/*15:0*/ cpu__DOT__xtr;
    IData/*31:0*/ __VactIterCount;
    VlTriggerVec<1> __VstlTriggered;
    VlTriggerVec<1> __VactTriggered;
    VlTriggerVec<1> __VnbaTriggered;

    // INTERNAL VARIABLES
    Vcpu__Syms* const vlSymsp;

    // CONSTRUCTORS
    Vcpu___024root(Vcpu__Syms* symsp, const char* v__name);
    ~Vcpu___024root();
    VL_UNCOPYABLE(Vcpu___024root);

    // INTERNAL METHODS
    void __Vconfigure(bool first);
};


#endif  // guard
