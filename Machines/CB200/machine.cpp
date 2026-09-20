#include "obj_dir/Vcpu.h"
#include "verilated.h"
#include <fstream>
#include <iostream>
#include <vector>
#include <cstdint>
#include <cstdio>
#include <iostream>
#include <string>

// Standart Ram
struct StdRam {
    // Primary User Ram
    uint8_t ram0[16384];
    uint8_t std_rom[8192];
    uint8_t std_disp[(20*10) * 2];
    bool disp_pau = false;

    // Write Function For Standart Ram
    void Write(uint32_t adr, uint8_t val) {
        printf("Write 0x%08x = 0x%02x\n", adr, val);

        // Address of RAM0
        if (adr < 16384) ram0[adr] = val;

        // VRAM
        if (adr >= 0xD000 && adr < 0xD190) { 
            std_disp[adr - 0xD000] = val;
            disp_pau = true;
         }

        // Well Well, i give you a micro space in the ROM for dont
        // make Jokes to the programs that uses the low memory
        if (adr >= 0xE000 && adr < 0xE400) std_rom[adr - 0xE000] = val;
    }
    // Read Function For Standart Ram
    uint8_t Read(uint32_t adr) {
        // Address of RAM0
        if (adr < 16383) return ram0[adr];

        // Startup Firmware
        if (adr >= 0xE000 && adr < 0x10000) return std_rom[adr - 0xE000];

        // VRAM
        if (adr >= 0xD000 && adr < 0xD190) return std_disp[adr - 0xD000];
        return 0;
    }
};

// Cpu Instruction Executer
void exec(Vcpu* cpu, uint16_t ins) {
    cpu->exi = 1;
    cpu->ins = ins;
    cpu->clk = 1;
    cpu->eval();
    cpu->exi = 0;
    cpu->clk = 0;
    cpu->eval();
}

uint8_t getReg(Vcpu* cpu, uint8_t rid) {
    cpu->rg = 1;
    cpu->rid = rid;
    cpu->clk = 1;
    cpu->eval();
    cpu->rg = 0;
    cpu->clk = 0;
    cpu->eval();
    return cpu->rgt;
}

uint8_t setReg(Vcpu* cpu, uint8_t rid, uint8_t val) {
    cpu->rs = 1;
    cpu->rid = rid;
    cpu->rsv = val;
    cpu->clk = 1;
    cpu->eval();
    cpu->rs = 0;
    cpu->clk = 0;
    cpu->eval();
    return cpu->rgt;
}

void drw_screen(StdRam* ram) {
    printf("\033[H\033[2J\033[3J");

    const int ansi_fg[16] = {
        30, 34, 32, 36, 31, 35, 33, 37,
        90, 94, 92, 96, 91, 95, 93, 97
    };
    const int ansi_bg[16] = {
        40, 44, 42, 46, 41, 45, 43, 47,
        100, 104, 102, 106, 101, 105, 103, 107
    };

    for (int row = 0; row < 10; row++) {
        for (int col = 0; col < 20; col++) {
            int idx = (row * 20 + col) * 2;
            
            uint8_t ch   = ram->std_disp[idx];     
            uint8_t attr = ram->std_disp[idx + 1]; 

            uint8_t bg = (attr >> 4) & 0x0F;
            uint8_t fg = attr & 0x0F;

            int fg_code = ansi_fg[fg];
            int bg_code = ansi_bg[bg];

            if (ch < 32) ch = '?';
            if (ch > 'Z') ch = '?';

            printf("\033[%d;%dm%c", bg_code, fg_code, ch);
        }
        printf("\n");
    }

    printf("\033[0m");
    fflush(stdout);
}

int main(int argc, char** argv) {
    Vcpu cpu;
    StdRam ram;

    std::ifstream file("std.fd", std::ios::binary);

    if (!file) return 1;
    
    std::vector<uint8_t> program(
        (std::istreambuf_iterator<char>(file)),
        std::istreambuf_iterator<char>()
    );
    file.close();

    size_t load_size = std::min(program.size(), sizeof(ram.std_rom));
    std::memcpy(ram.std_rom, program.data(), load_size);
    std::cout << "Firmware cargado: " << load_size << " bytes." << std::endl;

    cpu.rst = 1;
    cpu.eval();
    cpu.rst = 0;

    int cycl = 100;
    uint32_t pc = 0xFFF0;
    uint16_t high_adr = 0x0000;
    bool use_virt_adr = false;

    int itrd = 0;

    std::string sta = "";
    
    while (sta != "startvm") {
        std::cout << "v# ";
        if (std::getline(std::cin, sta)) {
            if (sta.rfind("x ", 0) == 0) {
                std::string str_val = sta.substr(2);
                uint16_t val = static_cast<uint16_t>(std::stoi(str_val, nullptr, 16));
                exec(&cpu, val);
            }
            else if (sta.rfind("r ", 0) == 0) {
                std::string str_val = sta.substr(2);
                uint8_t val = static_cast<uint8_t>(std::stoi(str_val, nullptr, 16));
                uint8_t tat = getReg(&cpu, val);
                std::cout << "0x" << std::hex << static_cast<int>(tat) << std::endl;
            }
            else {
                std::cout << sta << "?" << std::endl;
            }
        }
    }
        
    printf("Guest has not wake up the display (yet.)\n");
    printf("(TIP: you can wake up the display with a simple write in VRAM)\n");

    bool lnk = false;

    while (cycl) {
        // Fetch and run
        uint16_t ins = (ram.Read(pc) << 8) | ram.Read(pc + 1);

        // Virtual Addressing Set
        if ((ins & 0xFF00) == 0x6000) {
            uint8_t low = getReg(&cpu, ins & 0xF);
            uint8_t high = getReg(&cpu, (ins >> 4) & 0xF);
            high_adr = (high << 8) | low;
        }
        // Virtual Addresing Config
        else if ((ins & 0xFF00) == 0x6100) {
            switch (ins & 0xFF) {
                case 0:
                    use_virt_adr = true;
                    break;
                case 1:
                    use_virt_adr = false;
                    break;
            }
        }
        // Virtual Address Get
        else if ((ins & 0xFF00) == 0x6200) {
            setReg(&cpu, (ins >> 4) & 0xF, high_adr >> 8);
            setReg(&cpu, ins & 0xF, high_adr & 0xFF);
        }
        // Link at Next Jump
        else if (ins == 0x5000) {
            lnk = true;
        }
        // Return from stack
        else if (ins == 0x5001) {

            uint32_t stk = (
                (ram.std_rom[0] << 24) | 
                (ram.std_rom[1] << 16) | 
                (ram.std_rom[2] << 8) | 
                ram.std_rom[3]
            );

            pc = ((
                (ram.Read(stk) << 24)) |
                (ram.Read(stk + 1) << 16) |
                (ram.Read(stk + 2) << 8) |
                ram.Read(stk + 3)
            ) - 2;

            stk += 4;

            ram.std_rom[0] = (stk >> 24) & 0xFF;
            ram.std_rom[1] = (stk >> 16) & 0xFF;
            ram.std_rom[2] = (stk >> 8) & 0xFF;
            ram.std_rom[3] = stk & 0xFF;
        }
        
        exec(&cpu, ins);

        //printf("pc=0x%08x ins=0x%04x\n", pc, ins);

        // When the CPU Writes
        if (cpu.wex) ram.Write(((use_virt_adr ? high_adr : 0) << 16) | cpu.adr, cpu.wvx);

        // When the CPU Reads
        if (cpu.rex) cpu.rvx = ram.Read(((use_virt_adr ? high_adr : 0) << 16) | cpu.adr);

        // Jump Flag
        if (cpu.jf && !cpu.exi) { 
            if (lnk) {
                lnk = false;
                uint32_t stk = (
                    (ram.std_rom[0] << 24) | 
                    (ram.std_rom[1] << 16) | 
                    (ram.std_rom[2] << 8) | 
                    ram.std_rom[3]
                );

                stk -= 4;
                ram.Write(stk, (pc >> 24) & 0xFF);
                ram.Write(stk+1, (pc >> 16) & 0xFF);
                ram.Write(stk+2, (pc >> 8) & 0xFF);
                ram.Write(stk+3, pc & 0xFF);

                ram.std_rom[0] = (stk >> 24) & 0xFF;
                ram.std_rom[1] = (stk >> 16) & 0xFF;
                ram.std_rom[2] = (stk >> 8) & 0xFF;
                ram.std_rom[3] = stk & 0xFF;
                //printf("call\n");

            }

            pc = ((use_virt_adr ? high_adr : 0) << 16) | cpu.adr;
        }
        // Else Increments PC
        else pc = pc + 2;

        if (itrd > 0x423) {
            if (ram.disp_pau) { 
                //drw_screen(&ram);
                ram.disp_pau = false;
            }
            itrd = 0;
        }

        itrd++;
        cycl--;
    }

    return 0;
}