import tkinter as tk

def GenBin(TopCenter, TopLeft, TopRight, Center, BottomLeft, BotomRight, BottomCenter, CV):
    return (
        (CV << 7)              |
        (BottomCenter << 6)    | 
        (BotomRight << 5)      | 
        (BottomLeft << 4)      | 
        (Center << 3)          | 
        (TopRight << 2)        | 
        (TopLeft << 1)         | 
        TopCenter
    )

class BitmapEditorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Editor de Bitmaps - GenBin (Tkinter)")
        self.root.geometry("300x400")
        self.root.config(padx=20, pady=20)

        # Variables de control para los 7 bits (0 o 1)
        self.vars = {
            "TopLeft": tk.IntVar(value=0),
            "TopCenter": tk.IntVar(value=0),
            "TopRight": tk.IntVar(value=0),
            "Center": tk.IntVar(value=0),
            "BottomLeft": tk.IntVar(value=0),
            "BottomCenter": tk.IntVar(value=0),
            "BotomRight": tk.IntVar(value=0),
            "CenterVertical": tk.IntVar(value=0),
        }

        # Contenedor para los checkboxes en disposición espacial 3x3
        frame_grid = tk.Frame(root)
        frame_grid.pack(pady=10)

        # Definir la posición visual de cada botón en una cuadrícula 3x3
        # (nombre_bit, fila, columna)
        layout = [
            ("TopLeft", 0, 0), ("TopCenter", 0, 1), ("TopRight", 0, 2),
            (None, 1, 0),      ("Center", 1, 1),    ("CenterVertical", 1, 2),
            ("BottomLeft", 2, 0), ("BottomCenter", 2, 1), ("BotomRight", 2, 2)
        ]

        for name, r, c in layout:
            if name:
                chk = tk.Checkbutton(
                    frame_grid, 
                    text=name, 
                    variable=self.vars[name], 
                    command=self.update_ui,
                    indicatoron=False,  # Hace que parezca un botón normal que se presiona
                    width=10, 
                    height=2
                )
                chk.grid(row=r, column=c, padx=2, pady=2)

        # Canvas para la vista previa gráfica
        self.canvas_size = 50
        self.canvas = tk.Canvas(root, width=(25*3), height=(25*5), bg="white", highlightthickness=1, highlightbackground="#ccc")
        self.canvas.pack(pady=10)

        # Etiqueta para mostrar el valor resultante
        self.lbl_result = tk.Label(root, text="Valor: 0 (0x00)", font=("Consolas", 10))
        self.lbl_result.pack(pady=5)

        # Dibujar estado inicial
        self.redraw()

    def update_ui(self):
        self.redraw()
        
        # Obtener valores actuales de las variables
        tc = self.vars["TopCenter"].get()
        tl = self.vars["TopLeft"].get()
        tr = self.vars["TopRight"].get()
        c  = self.vars["Center"].get()
        bl = self.vars["BottomLeft"].get()
        br = self.vars["BotomRight"].get()
        bc = self.vars["BottomCenter"].get()
        cv = self.vars["CenterVertical"].get()

        val = GenBin(tc, tl, tr, c, bl, br, bc, cv)
        self.lbl_result.config(text=f"Valor: {val} (0x{val:02X}) | Bin: {bin(val)}")

    def redraw(self):
        self.canvas.delete("all")
        
        cell_size = self.canvas_size / 3.0
        
        # Mapeo de la matriz 3x3 a las variables
        matrix = [
            [0, self.vars["TopCenter"].get(), 0],
            [self.vars["TopLeft"].get(), 0,self.vars["TopRight"].get() ],
            [0,self.vars["Center"].get(),0],
            [self.vars["BottomLeft"].get(),0, self.vars["BotomRight"].get()],
            [0, self.vars["BottomCenter"].get(),0],
            [0, self.vars["CenterVertical"].get(),0]
        ]

        fill_color = "#1a73e8" if matrix[5][1] == 1 else "#f1f3f4"
        self.canvas.create_rectangle((1 * cell_size + 5),(1 + 1) * cell_size - 4,(1 * cell_size + 10),(2 + 1) * cell_size + 4, fill=fill_color, outline="#bdc1c6", width=2)

        for r in range(5):
            for col in range(3):
                x1 = col * cell_size + 3
                y1 = r * cell_size + 3
                x2 = (col + 1) * cell_size - 3
                y2 = (r + 1) * cell_size - 3

                fill_color = "#1a73e8" if matrix[r][col] == 1 else "#f1f3f4"
                self.canvas.create_rectangle(x1, y1, x2, y2, fill=fill_color, outline="#bdc1c6", width=2)

if __name__ == "__main__":
    root = tk.Tk()
    app = BitmapEditorApp(root)
    root.mainloop()