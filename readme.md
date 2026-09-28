<div style="display: flex; justify-content: center;">
  <img src="EMP100L.svg" alt="Logo" width="300">
</div>

# EMP-Arch
##### Embedded. Markarian. Processors. Architecture

Los EMP son procesadores de markarian que se dividen en generaciones, son
unicamente procesamiento por lo que no puede dirijirse a si mismo asi que se debe
incrustar instrucciones por pines y no tiene idea de la memoria y solo sabe que escribe
y lee en memoria por lo que se puede extender facilmente

# Generacion 1

La generacion 1 de los emps (EMP-1...) estan diseñados para ser de 8 bits y simples y con instrucciones de tamaño fijo, estos procesadores pueden manejar memoria usando paginas de 256 bytes para acceder a los 64 K que permite estos modelos

En las revisiones listadas a continuacion son los modelos
de set de instrucciones

* **EMP-100**: el modelo base del set de instrucciones, incluye operaciones de memoria basicas, operaciones de bit a bit, operaciones simples como suma y resta, entre otros
* **EMP-1000**: se basa en los modelos anteriores contando que este mismo incluye instrucciones para tareas pesadas y hacerlas mas rapido, como la capacidad de indexear memoria y cargarla o escribirla con en o desde el acumulador usando un registro y luego incrementar o decrementarlo en la misma instruccion dependiendo de el bit 6 de las banderas (DF)
* **EMP-1028**: el ultimo modelo sacado a la fecha y el que concluye la generacion 1, este modelo esta especializado en instrucciones de multiplicaciones y otras cosas mas como haber una parte alta del acumulador llamada 'H'

# Generacion 2

La generacion 2 de los emps (EMP-2...) esta destinada para ser potente, aqui las instrucciones son mas apretadas pero descriptivas y modulares, algunas pueden ser de 2 o 3 bytes, sacrificando complejidad del decoder externo a costa de tener mas espacio para mas datos y no requerir de multiples instrucciones, sin embargo, no tiene opcodes libres por lo que el mapeo del MMIO osea dispositivos mapeados en memoria es la unica forma de extender el CPU, con la ventaja de que puede ahora escribir y leer datos de 16 bits directamente incluso trabajar con ellos

solo cuenta con 3 registros de 16 bits, A, X e Y, junto con un registro de banderas, saltos condicionales y mas cosas, estos a diferencia de la primera generacion estan diseñados para tareas mas pesadas, mas rigidas, con mas libertad en cuanto a carga y escritura y muchas cosas mas, como instrucciones de salto incondicionales y division de las cuales la primera generacion carecia rotundamente

En las revisiones listadas a continuacion son las que salen hasta la fecha
* **EMP-200** el modelo base del set de la segunda generacion de CPUS embebidos de markarian (EMP), incluye operaciones completas incluso multiplicacion y division, necesidad menor de usar los registros para guardar direcciones o paginas de memoria y muchas mas cosas