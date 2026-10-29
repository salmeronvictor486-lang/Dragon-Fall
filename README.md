# Dragon Fall

Survivor en *pixel art* ambientado en Dragon Ball, al estilo de PokéSurvivor / Vampire Survivors. Se juega en el navegador, en ordenador y en móvil, sin instalar nada.

**▶ Jugar:** https://victorsalmeron.dev/dragon-fall/

Todo el juego está en **`index.html`** (HTML + CSS + JavaScript con `<canvas>`). Los sprites se dibujan desde código: no hay imágenes externas.

## Cómo se juega

- **Moverse:** WASD o flechas. En móvil, arrastra el dedo por la pantalla.
- Los ataques se lanzan solos y apuntan al enemigo más cercano. Recoge los **orbes de ki** que sueltan los enemigos para subir de nivel.
- En cada nivel eliges una mejora: un ataque nuevo, subir uno que ya tienes o una pasiva (máximo 6 de cada).
- **Evoluciones:** un ataque al nivel 7 más su pasiva se convierte en su técnica definitiva (por ejemplo, Kamehameha + Kaio-ken → Kamehameha x10).
- **Transformaciones:** algunos guerreros se transforman al llegar a ciertos niveles (Goku: SSJ → SSJ3 → SSJ Blue → Ultra Instinto).
- Las **7 Bolas de Dragón** caen de élites y jefes. Al reunirlas aparece **Shenron** y te concede un deseo.
- Cada saga dura 10 minutos: hay 3 jefes intermedios y un jefe final.
- **Pausa:** Esc, P o el botón `II`.

## Contenido

- **54 guerreros de Dragon Ball Z y Super**, con rarezas Común, Raro, Épico y Legendario: de Krilin y Chaoz a Vegito, Gogeta, Beerus, Whis o Jiren. Cada uno tiene su ataque inicial y muchos se transforman.
- **Cápsulas:** se abren con zenis o con las cápsulas gratis que regala ganar una saga. Te toca un guerrero al azar; si sale repetido, gana una estrella (+6% de daño y +5% de vida, hasta 5★). Solo se paga con zenis del juego, nunca con dinero real.
- **5 sagas:** Saiyan, Namek, Juegos de Cell, Majin Buu y Torneo del Poder. Cada una tiene sus enemigos, sus élites y sus jefes.
- **21 técnicas, cada una con su evolución, y 11 pasivas.** Entre ellas el Hakai de Beerus, la Espada de Ki y el Impacto de Poder de Jiren.
- **Templo de Kami:** mejoras permanentes que se compran con zenis.
- **Dragonpedia:** todos los personajes con nombre, saga y descripción. Los que aún no has visto salen como silueta.
- **Cuentas y guardado en la nube:** creas una cuenta con email o con Google y recuperas tu progreso en cualquier dispositivo. Sin cuenta, se guarda en el navegador y puedes exportar o importar un código de copia de seguridad. Para activar las cuentas, sigue [FIREBASE.md](FIREBASE.md).

## Dónde está publicado

El juego se publica en la web personal (repo `salmeronvictor486-lang.github.io`, carpeta `dragon-fall/`): https://victorsalmeron.dev/dragon-fall/. Al cambiar el juego aquí, hay que copiar `index.html` a esa carpeta.

También puedes abrir `index.html` directamente con doble clic.

## Aviso

Fan game sin ánimo de lucro. Dragon Ball © Bird Studio / Shueisha / Toei Animation. Este proyecto no está afiliado con ellos.
