# Prompt mejorado — Dragon Fall

> Crea **Dragon Fall**, un videojuego web de estilo *pixel art* del género *survivor* (tipo Vampire Survivors / PokéSurvivor) ambientado en el universo **Dragon Ball**. Debe jugarse directamente en cualquier navegador (ordenador y móvil), sin instalar nada, en **un único archivo `index.html`** (HTML + CSS + JavaScript con `<canvas>`), apto para publicarse en GitHub Pages.
>
> **Jugabilidad**
> - Vista cenital, mapa infinito. El jugador solo se mueve (WASD / flechas / joystick táctil); los ataques se lanzan solos.
> - Oleadas crecientes de enemigos. Al morir sueltan **orbes de ki** (experiencia); al subir de nivel se eligen 3–4 mejoras (ataque nuevo, subir ataque o pasiva).
> - Máximo 6 ataques y 6 pasivas. **Evoluciones**: ataque al nivel máximo + su pasiva = técnica definitiva (p. ej. Kamehameha + Kaio-ken → Kamehameha x10).
> - **Transformaciones** por nivel, equivalentes a las evoluciones de PokéSurvivor (Goku → SSJ → SSJ3 → SSJ Blue → Ultra Instinto).
> - Partidas de 10 minutos por saga con 3 jefes intermedios y un jefe final. Élites con nombre.
> - Las **7 Bolas de Dragón** caen de élites y jefes; al reunirlas aparece **Shenron** y concede un deseo.
> - Objetos: Semilla del Ermitaño (cura), zenis (moneda), radar (atrae todo), cápsulas de jefe (mejoras gratis).
>
> **Contenido**
> - 15 guerreros jugables con sprite pixel, nombre, ataque inicial propio y condición de desbloqueo.
> - 5 sagas (Saiyan, Namek, Cell, Buu, Torneo del Poder), cada una con fondo, enemigos y jefes propios.
> - Todos los personajes aparecen con su **nombre** en pantalla y en una **Dragonpedia** (guerreros, enemigos y jefes; los no vistos salen como silueta).
>
> **Progresión**
> - Zenis persistentes (localStorage) para comprar mejoras permanentes en el **Templo de Kami**.
> - Personajes y sagas desbloqueables. Récords por saga.
>
> **Presentación**
> - Sprites dibujados en código (sin imágenes externas), contorno oscuro, animación de paso, destello al recibir daño.
> - Interfaz propia con fuente pixel, barra de experiencia, vida, temporizador, jefes con barra de vida, números de daño.
> - Efectos de sonido sintetizados con Web Audio, temblor de pantalla y opciones para desactivarlos.
> - Responsive: joystick táctil en móvil, pausa automática al cambiar de pestaña.
>
> Es un *fan game* no comercial: mostrar aviso de que Dragon Ball pertenece a sus autores.
