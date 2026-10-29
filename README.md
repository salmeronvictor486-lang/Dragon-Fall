# Dragon Fall

Survivor en *pixel art* ambientado en Dragon Ball, al estilo de PokéSurvivor / Vampire Survivors. Se juega en el navegador, en ordenador y en móvil, sin instalar nada.

**▶ Jugar:** https://victorsalmeron.dev/dragon-fall/

El juego publicado es un solo archivo, **`index.html`**, con el código **protegido** (minificado y ofuscado). El código legible está en **`src/`** (HTML + CSS + JavaScript con `<canvas>`). Los sprites se dibujan desde código: no hay imágenes externas.

## Cómo se juega

- **Moverse:** WASD o flechas. En móvil, arrastra el dedo por la pantalla.
- **Técnica especial:** cada guerrero tiene la suya (Final Flash, Taiyoken, Hakai, Parar el tiempo…). Se lanza con la **tecla 1** (también Espacio, E o Q) o con el botón redondo de abajo a la derecha, y luego tiene que recargarse.
- Los ataques se lanzan solos y apuntan al enemigo más cercano. Recoge los **orbes de ki** que sueltan los enemigos para subir de nivel.
- En cada nivel eliges una mejora: un ataque nuevo, subir uno que ya tienes o una pasiva (máximo 6 de cada).
- **Evoluciones:** un ataque al nivel 7 más su pasiva se convierte en su técnica definitiva (por ejemplo, Kamehameha + Kaio-ken → Kamehameha x10).
- **Transformaciones:** algunos guerreros se transforman al llegar a ciertos niveles (Goku: SSJ → SSJ3 → SSJ Blue → Ultra Instinto).
- Las **7 Bolas de Dragón** caen de élites y jefes. Al reunirlas aparece **Shenron** y te concede un deseo.
- Cada saga dura 10 minutos: hay 3 jefes intermedios y un jefe final.
- **Compañero y fusiones:** antes de jugar puedes elegir un segundo guerrero que te sigue, dispara solo y usa su técnica especial. Goku + Vegeta, Goten + Trunks y Kale + Caulifla llenan un medidor y se **fusionan** durante 25 s (Gogeta, Gotenks, Kefla) con la **tecla 2** (o F) o el botón de fusión.
- **Mando:** stick o cruceta para moverse, A = técnica especial, X/Y = fusión, Start = pausa. En los menús, la cruceta mueve el foco, A pulsa y B vuelve atrás.
- **Pausa:** Esc, P o el botón `II`. Las presentaciones de jefe y las transformaciones se saltan con Espacio, Enter o tocando la pantalla.
- Las flechas en el borde de la pantalla señalan Bolas de Dragón, cápsulas y jefes que están fuera de vista.

## Contenido

- **54 guerreros de Dragon Ball Z y Super**, con rarezas Común, Raro, Épico y Legendario: de Krilin y Chaoz a Vegito, Gogeta, Beerus, Whis o Jiren. Cada uno tiene su ataque inicial, su **técnica especial propia** y muchos se transforman.
- **Tienda** (todo con zenis del juego, nunca con dinero real):
  - **Hoy:** regalo diario con racha de 7 días, ofertas **solo para ti** (distintas para cada jugador y cada día, según los guerreros y cajas que te faltan) y una **tienda diaria** de personajes y cajas con descuento. Se renueva a medianoche.
  - **Cajas:** 9 cajas temáticas (Normal, Dorada, Guerreros Z, Imperio, Patrulla Roja, Majin, Saiyan, Fusión y Divina) con su lista de guerreros y probabilidades. Haciendo clic en una caja (o en **Ver contenido**) se ve todo lo que puede tocar, con el porcentaje de cada guerrero y cuáles tienes ya. Se abren con una ruleta estilo Counter-Strike. Los repetidos ganan estrellas (+6% de daño y +5% de vida, hasta 5★).
- **5 sagas:** Saiyan, Namek, Juegos de Cell, Majin Buu y Torneo del Poder. Cada una tiene sus enemigos, sus élites, sus jefes y su propia música.
- **Dificultades:** Normal, Difícil (x1,6 zenis) y Pesadilla (x2,5 zenis). Se desbloquean saga a saga y la primera victoria da premio.
- **∞ Supervivencia:** sin final. Los enemigos no paran de crecer y los jefes vuelven una y otra vez. Cuenta puntos.
- **Objetos por el mapa (inspirados en Megabonk):**
  - **Cajas y jarrones** que se rompen al tocarlos o al atacarlos y sueltan comida, zenis o experiencia.
  - **Comida** que cura un 15% de vida. También la sueltan los enemigos (sobre todo las élites).
  - **Fuentes curativas**: quedarse dentro cura hasta que se secan. Si vas mal de vida, una flecha te señala la más cercana.
  - **Altares de ki**: quédate dentro unos segundos para cargarlos y elige una bendición para la partida, con rareza (común, raro, épico o legendario).
  - **Cofres** que se abren con los zenis de la partida; cada uno cuesta más que el anterior.
  - **Estatuas de Babidi**: al tocarlas activas una maldición. Hay más enemigos y más duros, pero ganas más experiencia y zenis.
  - Además, cada vez que subes de nivel recuperas un 6% de vida.
- **Eventos en partida:** horda sorpresa, cápsula de suministros que hay que defender, Torneo de Artes Marciales (3 luchadores sin salir del ring) y Luna llena con un Gran Mono (los Saiyan ganan poder).
- **Misiones diarias** (3 al día, distintas para cada jugador), **25 logros** con zenis, cajas y **títulos**, **nivel de cuenta** con premios y un **perfil** con estadísticas.
- **Ranking semanal** (Supervivencia y bajas), para jugadores con cuenta. Se reinicia cada lunes.
- **Idiomas:** castellano, català e English (se elige en Opciones; la primera vez usa el idioma del navegador).
- **Instalable (PWA):** se puede añadir a la pantalla de inicio y funciona sin conexión.
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

`npm run build` genera también `manifest.webmanifest` y `sw.js` (para instalar el juego y jugar sin conexión). Para publicar, copia a la carpeta `dragon-fall/` de la web: `index.html`, `manifest.webmanifest`, `sw.js` y la carpeta `icons/`.

Las traducciones están en `src/2c_i18n_data.js`: cada texto en castellano con su versión en català y en English.

La protección junta todo el JavaScript en un bloque cerrado (desde la consola del navegador no se puede tocar la partida ni los zenis) y lo ofusca para que no se pueda copiar fácilmente. Para que nadie vea el código legible de `src/`, **este repositorio debe ser privado**.

## Aviso

Fan game sin ánimo de lucro: no tiene anuncios, ni pagos, ni donaciones a cambio de ventajas, y así debe seguir para no tener problemas con los dueños de Dragon Ball. Dragon Ball © Bird Studio / Shueisha / Toei Animation. Este proyecto no está afiliado con ellos.
