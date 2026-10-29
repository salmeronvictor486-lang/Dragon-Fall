# Dragon Fall

Survivor en *pixel art* ambientado en Dragon Ball, al estilo de PokéSurvivor / Vampire Survivors. Se juega en el navegador, en ordenador y en móvil, sin instalar nada.

Todo el juego está en **`index.html`** (HTML + CSS + JavaScript con `<canvas>`). Los sprites se dibujan desde código: no hay imágenes externas.

## Cómo se juega

- **Moverse:** WASD o flechas. En móvil, arrastra el dedo por la pantalla.
- Los ataques se lanzan solos. Recoge los **orbes de ki** que sueltan los enemigos para subir de nivel.
- En cada nivel eliges una mejora: un ataque nuevo, subir uno que ya tienes o una pasiva (máximo 6 de cada).
- **Evoluciones:** un ataque al nivel 7 más su pasiva se convierte en su técnica definitiva (por ejemplo, Kamehameha + Kaio-ken → Kamehameha x10).
- **Transformaciones:** algunos guerreros se transforman al llegar a ciertos niveles (Goku: SSJ → SSJ3 → SSJ Blue → Ultra Instinto).
- Las **7 Bolas de Dragón** caen de élites y jefes. Al reunirlas aparece **Shenron** y te concede un deseo.
- Cada saga dura 10 minutos: hay 3 jefes intermedios y un jefe final.
- **Pausa:** Esc, P o el botón `II`.

## Contenido

- **15 guerreros:** Goku, Krilin, Yamcha, Vegeta, Gohan, Piccolo, Ten Shin Han, Trunks, Goten, Androide 18, Freezer, Cell, Majin Buu, Broly y Mr. Satán. Cada uno tiene su propio ataque inicial y una condición para desbloquearlo.
- **5 sagas:** Saiyan, Namek, Juegos de Cell, Majin Buu y Torneo del Poder. Cada una tiene sus enemigos, sus élites y sus jefes.
- **18 técnicas, 18 evoluciones y 11 pasivas.**
- **Templo de Kami:** mejoras permanentes que se compran con zenis.
- **Dragonpedia:** todos los personajes con nombre, saga y descripción. Los que aún no has visto salen como silueta.
- **Cuentas y guardado en la nube:** creas una cuenta con email o con Google y recuperas tu progreso en cualquier dispositivo. Sin cuenta, se guarda en el navegador y puedes exportar o importar un código de copia de seguridad. Para activar las cuentas, sigue [FIREBASE.md](FIREBASE.md).

## Publicarlo en GitHub Pages

1. Fusiona esta rama en `main`.
2. En el repositorio, ve a **Settings → Pages**.
3. En *Source*, elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
4. A los pocos minutos, el juego estará en `https://salmeronvictor486-lang.github.io/Dragon-Fall/`.

También puedes abrir `index.html` directamente con doble clic.

## Aviso

Fan game sin ánimo de lucro. Dragon Ball © Bird Studio / Shueisha / Toei Animation. Este proyecto no está afiliado con ellos.
