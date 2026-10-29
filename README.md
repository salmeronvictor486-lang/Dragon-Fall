# Dragon Fall

Survivor en *pixel art* ambientado en Dragon Ball, al estilo de PokéSurvivor / Vampire Survivors. Se juega en el navegador, en ordenador y en móvil, sin instalar nada.

**▶ Jugar:** https://victorsalmeron.dev/dragon-fall/

El juego publicado es un solo archivo, **`index.html`**, con el código **protegido** (minificado y ofuscado). El código legible está en **`src/`** (HTML + CSS + JavaScript con `<canvas>`). Los sprites se dibujan desde código: no hay imágenes externas.

## Cómo se juega

- **Moverse:** WASD o flechas. En móvil, arrastra el dedo por la pantalla.
- **Técnica especial:** cada guerrero tiene la suya (Final Flash, Taiyoken, Hakai, Parar el tiempo…). Se lanza con **Espacio** (también E o Q) o con el botón redondo de abajo a la derecha, y luego tiene que recargarse.
- Los ataques se lanzan solos y apuntan al enemigo más cercano. Recoge los **orbes de ki** que sueltan los enemigos para subir de nivel.
- En cada nivel eliges una mejora: un ataque nuevo, subir uno que ya tienes o una pasiva (máximo 6 de cada).
- **Evoluciones:** un ataque al nivel 7 más su pasiva se convierte en su técnica definitiva (por ejemplo, Kamehameha + Kaio-ken → Kamehameha x10).
- **Transformaciones:** algunos guerreros se transforman al llegar a ciertos niveles (Goku: SSJ → SSJ3 → SSJ Blue → Ultra Instinto).
- Las **7 Bolas de Dragón** caen de élites y jefes. Al reunirlas aparece **Shenron** y te concede un deseo.
- Cada saga dura 10 minutos: hay 3 jefes intermedios y un jefe final.
- **Pausa:** Esc, P o el botón `II`. Las presentaciones de jefe y las transformaciones se saltan con Espacio, Enter o tocando la pantalla.
- Las flechas en el borde de la pantalla señalan Bolas de Dragón, cápsulas y jefes que están fuera de vista.

## Contenido

- **54 guerreros de Dragon Ball Z y Super**, con rarezas Común, Raro, Épico y Legendario: de Krilin y Chaoz a Vegito, Gogeta, Beerus, Whis o Jiren. Cada uno tiene su ataque inicial, su **técnica especial propia** y muchos se transforman.
- **Tienda** (todo con zenis del juego, nunca con dinero real):
  - **Hoy:** regalo diario con racha de 7 días, ofertas **solo para ti** (distintas para cada jugador y cada día, según los guerreros y cajas que te faltan) y una **tienda diaria** de personajes y cajas con descuento. Se renueva a medianoche.
  - **Cajas:** 9 cajas temáticas (Normal, Dorada, Guerreros Z, Imperio, Patrulla Roja, Majin, Saiyan, Fusión y Divina) con su lista de guerreros y probabilidades. Haciendo clic en una caja (o en **Ver contenido**) se ve todo lo que puede tocar, con el porcentaje de cada guerrero y cuáles tienes ya. Se abren con una ruleta estilo Counter-Strike. Los repetidos ganan estrellas (+6% de daño y +5% de vida, hasta 5★).
- **5 sagas:** Saiyan, Namek, Juegos de Cell, Majin Buu y Torneo del Poder. Cada una tiene sus enemigos, sus élites y sus jefes.
- **21 técnicas, cada una con su evolución, y 11 pasivas.** Entre ellas el Hakai de Beerus, la Espada de Ki y el Impacto de Poder de Jiren.
- **Templo de Kami:** mejoras permanentes que se compran con zenis.
- **Dragonpedia:** todos los guerreros, enemigos y jefes con nombre, dibujo y descripción, aunque no los tengas. Indica cuáles has conseguido y cómo conseguir los que te faltan.
- **Guardar la partida, de dos formas:**
  - **Con código** (siempre disponible): un código corto (`DF2.…`) con todo tu progreso. Se copia y se pega en otro navegador. Los códigos antiguos `DF1.…` siguen funcionando.
  - **Con correo y contraseña** (o Google): el progreso se guarda solo en la nube. Al crear la cuenta eliges con qué empezar: el progreso de este navegador, **tu código** (si jugaste en versiones anteriores u otro dispositivo) o de cero. Para activarlo, sigue [FIREBASE.md](FIREBASE.md).

## Dónde está publicado

El juego se publica en la web personal (repo `salmeronvictor486-lang.github.io`, carpeta `dragon-fall/`): https://victorsalmeron.dev/dragon-fall/. Al cambiar el juego aquí, hay que copiar `index.html` a esa carpeta.

También puedes abrir `index.html` directamente con doble clic.

## Cómo se construye

Se edita el código de `src/` y se genera el archivo final:

```bash
npm install
npm run build   # index.html protegido (el que se publica)
npm run dev     # dev.html legible, para probar cambios
```

La protección junta todo el JavaScript en un bloque cerrado (desde la consola del navegador no se puede tocar la partida ni los zenis) y lo ofusca para que no se pueda copiar fácilmente. Para que nadie vea el código legible de `src/`, **este repositorio debe ser privado**.

## Aviso

Fan game sin ánimo de lucro. Dragon Ball © Bird Studio / Shueisha / Toei Animation. Este proyecto no está afiliado con ellos.
