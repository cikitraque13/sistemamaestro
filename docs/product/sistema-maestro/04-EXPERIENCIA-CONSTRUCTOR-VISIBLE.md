\# 04 — Experiencia Constructor Visible



\## 1. Función de esta pieza



Este documento define la experiencia visible que debe convertir Sistema Maestro en un producto que no solo analiza, sino que construye de forma perceptible y verificable.



No regula toda la implementación técnica final.



Regula la experiencia que el usuario debe vivir cuando pasa de diagnóstico, activación o prompt inicial a construcción real.



La experiencia del constructor visible es una de las piezas de mayor potencia del sistema.



Su función no es decorar.



Su función es demostrar que Sistema Maestro entiende, decide, construye, muestra y permite continuar.



\---



\## 2. Qué problema resuelve



Si el usuario recibe análisis, activación y blueprint, pero no ve construcción real, puede pensar:



\- esto piensa bien;

\- esto orienta bien;

\- esto parece potente;

\- pero todavía no siento que me lo esté montando.



El constructor visible existe para cerrar esa brecha de percepción y convertir el sistema en algo claramente superior.



\### Problema crítico detectado



Durante la reapertura del Builder se detectó una desviación estructural:



```text

el sistema parecía construir

pero preview, código y estructura no cambiaban de forma real y acumulativa

```



Ese patrón no puede repetirse.



El constructor visible debe evitar la simulación de construcción.



\---



\## 3. Definición



El constructor visible es la experiencia en la que el usuario ve cómo el sistema:



\- interpreta su caso;

\- clasifica intención, tipo de proyecto, sector y objetivo;

\- divide el trabajo;

\- activa agentes o módulos;

\- genera estructura;

\- construye pantallas, piezas o lógica;

\- muestra preview o resultado en evolución;

\- actualiza código;

\- actualiza estructura;

\- propone siguientes decisiones;

\- prepara continuidad, despliegue o salida.



No debe sentirse como una caja negra.



Debe sentirse como un sistema que trabaja delante del usuario.



\---



\## 4. Principio central



El usuario no debe limitarse a recibir una respuesta.



Debe sentir que el sistema entra en modo ejecución.



\### Regla



Sistema Maestro debe pasar de:



```text

te analizo

```



a:



```text

te construyo una base real delante de ti

```



\### Regla antisimulación



Una acción del Builder no se considera válida si solo produce:



\- texto del agente;

\- animación de progreso;

\- cambios de copy no persistentes;

\- código decorativo no conectado;

\- preview que no refleja mutación;

\- estructura que no cambia;

\- preguntas repetidas sin memoria.



Una acción del Builder se considera válida cuando produce al menos uno de estos efectos:



\- estado vivo actualizado;

\- preview modificada;

\- código modificado;

\- estructura modificada;

\- CTA modificado;

\- bloque nuevo;

\- archivo nuevo;

\- siguiente decisión contextual distinta.



\---



\## 5. Piedra angular de la experiencia



La experiencia visible debe apoyarse en una fuente viva de construcción:



```text

BuilderBuildState

```



La experiencia no debe depender solo de:



\- copy suelto;

\- mensajes del agente;

\- `hubSummary`;

\- `lastDelta`;

\- `lastOperation`;

\- fases de progreso;

\- plantillas visuales aisladas.



Debe apoyarse en este contrato:



```text

input usuario

→ interpretación IA

→ mutación normalizada

→ BuilderBuildState

→ preview

→ código

→ estructura

→ siguientes decisiones

```



\---



\## 6. Resultado psicológico buscado



La experiencia correcta debe provocar esta sensación:



\- esto es serio;

\- esto no es solo un chat;

\- esto está montando algo real;

\- puedo ver cómo toma forma;

\- puedo entender qué está haciendo;

\- puedo seguir dentro del sistema;

\- puedo mejorar lo construido;

\- esto justifica plan, créditos y continuidad.



El objetivo no es espectáculo vacío.



El objetivo es percepción de capacidad real.



\---



\## 7. Principio de diseño



La experiencia del constructor visible debe cumplir estas condiciones:



\- clara;

\- profesional;

\- sin caos visual;

\- con sensación de sistema en marcha;

\- con jerarquía;

\- con avance visible;

\- con preview real;

\- con código o estructura coherente;

\- sin fricción innecesaria;

\- sin inflar de paneles inútiles.



No debe parecer un juguete.



Debe parecer una herramienta seria de construcción asistida.



\---



\## 8. Estructura general de la pantalla



La arquitectura visual correcta debe tender a una pantalla dividida.



\## 8.1 Columna A — Proceso, código, agente y control



Debe mostrar:



\- código o estructura en evolución;

\- qué está haciendo el sistema;

\- qué módulo o agente está activo;

\- en qué fase está el proyecto;

\- qué tarea se está ejecutando;

\- señales de progreso inteligibles;

\- chat de control del usuario;

\- siguientes decisiones contextuales.



\### Regla



El panel izquierdo no debe convertirse en una acumulación de bloques.



Debe ordenar:



```text

código/proceso

→ agente como cápsula operativa

→ chat/control del usuario

→ siguientes decisiones

```



El agente puede descansar, esperar respuesta o mostrar actividad, pero no debe solaparse ni competir con el chat.



\## 8.2 Columna B — Resultado / preview



Debe mostrar:



\- vista del resultado;

\- pantalla, web, herramienta o bloque visible;

\- estructura visual del proyecto;

\- evolución del proyecto en tiempo razonable;

\- cambios reales derivados de las acciones aplicadas.



\### Regla



El usuario debe poder leer simultáneamente:



```text

proceso

\+

resultado

```



\---



\## 9. Componentes de la experiencia



\## 9.1 Cabecera de proyecto



Debe mostrar:



\- nombre del proyecto o caso;

\- tipo de entrada: idea, URL o prompt;

\- estado actual;

\- plan activo si aplica;

\- saldo de créditos si aplica;

\- acción principal disponible.



\### Regla



La cabecera no debe absorber la lógica del Builder.



Debe orientar sin invadir.



\---



\## 9.2 Panel de progreso



Debe mostrar:



\- fase actual;

\- pasos completados;

\- siguiente paso;

\- estado de construcción.



Ejemplos de fases:



\- interpretación;

\- planificación;

\- mutación;

\- construcción;

\- preview lista;

\- código listo;

\- estructura lista;

\- esperando decisión;

\- exportación futura;

\- despliegue futuro.



\### Regla



El progreso debe ser consecuencia del estado vivo, no una animación independiente.



\---



\## 9.3 Panel de agentes o módulos



No es obligatorio mostrar agentes con exceso de ficción.



Pero sí debe quedar claro que el sistema divide el trabajo.



Debe mostrar capacidades como:



\- estructura;

\- copy;

\- interfaz;

\- lógica;

\- validación;

\- despliegue futuro.



\### Regla



La visualización de agentes debe aumentar percepción de capacidad, no introducir ruido infantil.



El agente no debe sustituir a la construcción.



El agente debe explicar, acompañar y proponer decisiones útiles.



\---



\## 9.4 Consola o log inteligible



Debe existir una capa visual de actividad.



No tiene que ser terminal real compleja.



Pero sí debe transmitir:



\- acción;

\- progreso;

\- lectura técnica o semitécnica;

\- sensación de sistema operativo real.



\### Regla



El log debe ser entendible y visualmente sobrio.



No debe fingir actividad que no se refleje en preview, código o estructura.



\---



\## 9.5 Preview en vivo



Debe ser una de las piezas centrales.



El usuario debe poder ver:



\- una web;

\- una interfaz;

\- una herramienta;

\- un bloque;

\- una estructura viva;

\- o una representación visible de lo que se está montando.



\### Principio



El preview no es adorno.



Es prueba visible de ejecución.



\### Regla



Si el usuario pide una mejora visible, la preview debe cambiar.



Si el usuario pide un bloque, la preview debe mostrarlo.



Si el usuario pide una app, la preview debe representar la app.



Si el usuario pide una estructura técnica, el sistema debe poder enseñar estructura aunque la preview visual sea parcial.



\---



\## 9.6 Código



El código debe representar lo que el usuario está viendo o lo que el sistema está construyendo.



No debe ser código decorativo.



Debe poder explicar:



\- qué componente existe;

\- qué archivo representa;

\- qué bloque visual genera;

\- qué estructura necesita;

\- qué cambio acaba de aplicar.



\### Regla



No debe existir una preview que muestre algo que el código no pueda representar.



No debe existir código que sugiera cambios que la preview y la estructura no reciben.



\---



\## 9.7 Estructura



La estructura debe mostrar:



\- carpetas;

\- archivos;

\- componentes;

\- rutas;

\- posibles rutas API;

\- módulos relevantes;

\- relación con exportación futura.



\### Regla



La estructura debe evolucionar con el estado vivo.



No debe quedarse como blueprint estático si el Builder ya aplicó mutaciones.



\---



\## 9.8 Acciones de control



La experiencia debe incluir acciones claras y limitadas, por ejemplo:



\- continuar construcción;

\- iterar;

\- mejorar;

\- añadir bloque;

\- añadir autenticación;

\- generar estructura;

\- preparar exportación;

\- desplegar cuando proceda;

\- comprar más créditos si aplica.



\### Regla



No saturar de botones.



Cada acción debe responder a un siguiente paso claro.



Cada acción debe poder traducirse a una mutación o a una operación trazable.



\---



\## 10. Relación con la Activación



La activación prepara la ejecución.



El constructor visible la materializa.



\### Secuencia correcta



\- entrada;

\- diagnóstico;

\- activación;

\- constructor visible;

\- continuidad o salida.



\### Regla



El constructor visible no debe arrancar sin una dirección razonable.



Debe apoyarse en la activación para no construir de forma arbitraria.



\### Matiz importante



La activación no sustituye al Builder.



La activación orienta.



El Builder ejecuta y muestra.



\---



\## 11. Relación con los Créditos



El constructor visible es uno de los lugares donde más sentido tiene la economía de créditos.



\### Principio



Ver construir hace visible el valor del crédito.



\### Ejemplos de acciones que pueden consumir créditos



\- iniciar build;

\- iterar una nueva versión;

\- regenerar módulo;

\- rehacer pantalla;

\- ejecutar mejora intensiva;

\- generar estructura avanzada;

\- preparar exportación;

\- lanzar despliegue;

\- ejecutar operación avanzada.



\### Regla



El consumo debe ser visible y comprensible.



No se debe consumir crédito sobre una acción que no produzca salida real, visible o técnicamente verificable.



No se monetiza una simulación.



\---



\## 12. Relación con continuidad dentro del sistema



La experiencia debe empujar de forma natural a seguir dentro del sistema.



\### Motivo



Dentro del sistema el usuario obtiene:



\- continuidad;

\- agentes;

\- mejora constante;

\- evolución;

\- nuevas iteraciones;

\- más capacidad de construcción.



\### Regla



Trabajar dentro del sistema debe sentirse cómodo, potente y lógico.



El usuario no debe sentir que el sistema lo retiene artificialmente.



Debe sentir que seguir dentro tiene sentido operativo.



\---



\## 13. Relación con exportación



La experiencia también debe preparar psicológicamente la salida del proyecto.



\### Principio



Si el usuario quiere sacar el proyecto fuera, debe percibir que:



\- existe una vía clara;

\- no está bloqueado;

\- exportar es una acción distinta;

\- la salida tiene valoración y proceso;

\- el proyecto tiene estructura suficiente para salir.



\### Regla



La exportación debe aparecer como acción seria y profesional, no como escape confuso.



No se debe exportar sobre una preview simulada.



Exportación exige:



\- estado vivo;

\- código coherente;

\- estructura coherente;

\- valoración.



\---



\## 14. Relación con deploy



El deploy debe ser una fase posterior y más exigente que la preview.



\### Regla



No se despliega si no existe:



\- estructura coherente;

\- código coherente;

\- estado del proyecto;

\- criterio de entorno;

\- validación técnica.



Deployment sin estructura previa genera ruido, coste y riesgo.



\---



\## 15. Diferencia por perfil de usuario



\## 15.1 Usuario no técnico



Debe sentir:



\- claridad;

\- progreso;

\- facilidad;

\- que el sistema le construye algo sin exigirle saber programar.



La interfaz debe traducir complejidad sin ocultar que hay construcción real.



\## 15.2 Usuario técnico



Debe sentir:



\- aceleración;

\- estructura;

\- control;

\- capacidad de usar el sistema como multiplicador.



Debe poder ver código, estructura o arquitectura sin fricción.



\## 15.3 Operador / consultor / agencia



Debe sentir:



\- potencia para trabajar sobre activos ajenos;

\- capacidad de enseñar proceso o resultado;

\- facilidad para convertir análisis en propuesta o entrega.



Debe poder usar el Builder como herramienta de venta, diagnóstico, construcción y continuidad.



\---



\## 16. Principio visual



La experiencia debe ser visualmente fuerte, pero disciplinada.



\### Debe transmitir



\- autoridad;

\- ejecución;

\- sistema;

\- orden;

\- tecnología aplicada;

\- valor operativo.



\### Debe evitar



\- ruido innecesario;

\- exceso de colores;

\- efectos infantiles;

\- sensación de demo vacía;

\- sobrecarga de microcomponentes;

\- bloques que compiten con el chat;

\- agentes solapados;

\- botones muertos.



\---



\## 17. Principio narrativo



La experiencia debe contar una historia operativa clara:



\- el sistema ha entendido el caso;

\- ha activado una lógica de trabajo;

\- está construyendo;

\- el usuario ve tomar forma el resultado;

\- puede seguir, iterar, desplegar o sacar el proyecto.



Esa narrativa es parte central del valor del producto.



\### Regla



La narrativa no debe sustituir a la ejecución.



Debe acompañarla.



\---



\## 18. Estados del constructor visible



La arquitectura debe prever estados claros.



\### Estados mínimos



\- listo para construir;

\- interpretando;

\- planificando;

\- construyendo;

\- iterando;

\- pausado;

\- esperando decisión del usuario;

\- preview lista;

\- código listo;

\- estructura lista;

\- listo para desplegar;

\- listo para exportar;

\- bloqueado por créditos;

\- bloqueado por plan si aplica;

\- error controlado.



\### Regla



Cada estado debe tener:



\- mensaje claro;

\- acción siguiente;

\- continuidad legible.



\---



\## 19. Preguntas y siguientes mejoras



Después de una construcción o mutación, el sistema debe proponer siguientes decisiones contextuales.



\### Regla



Las preguntas no deben repetirse mecánicamente.



No deben volver siempre a:



\- más premium;

\- más claridad;

\- más conversión.



Deben depender de:



\- tipo de proyecto;

\- sector;

\- intención;

\- estado vivo;

\- acciones ya aplicadas;

\- bloques disponibles;

\- potencial de conversión;

\- coste o valor de la siguiente acción.



\### Ejemplo



Si el usuario ya añadió acceso con Google, el sistema no vuelve a preguntarlo.



Debe proponer algo como:



\- añadir bloque de confianza;

\- explicar Gema Maestra;

\- crear sección cómo funciona;

\- preparar suscripción;

\- generar estructura exportable.



\---



\## 20. Acciones rápidas y modos



Las opciones rápidas deben ayudar, no saturar.



Pueden existir accesos como:



\- servicio;

\- objetivo;

\- modo;

\- prompt;

\- agente;

\- modelo;

\- ajustes.



\### Regla



Estas opciones deben integrarse en la experiencia sin romper el foco.



Deben actuar como ayuda para construir mejor, no como decoración.



Si una opción no modifica input, contexto, mutación o estado, no debe mostrarse como acción principal.



\---



\## 21. Principio de control de fricción



La experiencia no debe exigir pasos innecesarios para impresionar.



Debe impresionar porque:



\- trabaja;

\- muestra;

\- ordena;

\- deja continuar.



No porque obligue al usuario a atravesar muchas pantallas.



\---



\## 22. Papel del efecto wow



El constructor visible sí debe generar efecto wow.



Pero ese wow debe apoyarse en:



\- ejecución visible;

\- percepción de sistema;

\- progreso real;

\- preview real;

\- código coherente;

\- estructura coherente;

\- continuidad real.



No en puro decorado.



\---



\## 23. Regla de producto



Cada vez que se añada una pieza al constructor visible, debe pasar esta prueba:



\### A



¿Hace más visible la ejecución real?



\### B



¿Mejora continuidad, claridad o capacidad de acción?



\### C



¿Evita ruido y mantiene la percepción de herramienta seria?



\### D



¿Puede conectarse con estado vivo, preview, código o estructura?



Si no pasa esta prueba, no debe entrar.



\---



\## 24. Criterio de cierre del Builder visible



El constructor visible estará correctamente alineado cuando una petición como:



```text

Añade acceso con Google

```



produzca simultáneamente:



\- estado vivo actualizado;

\- preview con bloque real;

\- código con componente real;

\- estructura con archivo real;

\- siguiente mejora distinta.



Y cuando una petición como:



```text

Crea una app con dashboard y backend

```



produzca simultáneamente:



\- estructura frontend/backend;

\- páginas, rutas y componentes;

\- preview coherente con la app;

\- código alineado con la estructura;

\- siguientes decisiones técnicas no repetidas.



\---



\## 25. Cierre doctrinal



El constructor visible no es un añadido cosmético.



Es una de las piezas que convierte Sistema Maestro en algo claramente superior.



Su función no es adornar el sistema.



Su función es hacer visible que el sistema:



\- entiende;

\- activa;

\- construye;

\- evoluciona;

\- y puede llevar el proyecto hacia continuidad o salida.



Sin esta pieza, el sistema puede parecer una IA que orienta.



Con esta pieza, el sistema empieza a parecer una plataforma que realmente monta proyectos.



La siguiente etapa del constructor visible debe apoyarse en:



```text

BuilderBuildKernel

\+

BuilderBuildState

\+

mutaciones

\+

preview/código/estructura sincronizados

```



No se aprueba volver a tratar el Builder como una pantalla aislada.

