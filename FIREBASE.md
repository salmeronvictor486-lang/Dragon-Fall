# Activar las cuentas online (Firebase)

> ✅ **Activado** en el proyecto `dragon-fall-5aaa6` (Authentication con correo/contraseña y Firestore con las reglas de `firestore.rules`). Esta guía queda como referencia.

Si no configuras Firebase, el juego guarda la partida en el navegador y con el **código de guardado**. La pestaña «Con correo» explica que las cuentas aún no están activas. Al configurarlo, los jugadores pueden **crear una cuenta** y su progreso se guarda en la nube: zenis, mejoras, personajes, sagas, récords, Dragonpedia y opciones. Así lo recuperan en cualquier móvil u ordenador.

Firebase es gratis con el plan **Spark**, que no pide tarjeta. Permite 50.000 lecturas y 20.000 escrituras al día, mucho más de lo que necesita el juego: solo guarda unos segundos después de cada cambio.

## 1. Crear el proyecto (5 min)

1. Entra en <https://console.firebase.google.com> con tu cuenta de Google.
2. Pulsa **Crear un proyecto**, llámalo `dragon-fall` y desactiva Google Analytics (no hace falta).

## 2. Activar el inicio de sesión

1. Menú **Compilación → Authentication → Comenzar**.
2. En **Método de inicio de sesión**, activa **Correo electrónico/contraseña**.
3. (Opcional) Activa también **Google** para el botón "Entrar con Google".
4. En **Configuración → Dominios autorizados**, añade `victorsalmeron.dev` (el dominio donde está publicado el juego).

## 3. Crear la base de datos

1. Menú **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: **`eur3 (europe-west)`**, para que los datos se queden en la UE.
3. Elige **modo de producción**.
4. En la pestaña **Reglas**, borra lo que haya, pega el contenido de [`firestore.rules`](firestore.rules) y pulsa **Publicar**. Así cada jugador solo puede leer y modificar su propia partida.

## 4. Conectar el juego

1. En la rueda ⚙️ → **Configuración del proyecto → Tus apps**, pulsa el icono **`</>`** (Web) y registra la app. No marques Hosting.
2. Copia el objeto `firebaseConfig` que aparece.
3. Abre `index.html` (aquí y en `dragon-fall/index.html` del repo de tu web), busca `const FIREBASE_CONFIG = null;` (está cerca del final) y sustitúyelo:

```js
const FIREBASE_CONFIG = {
  apiKey: 'AIza...',
  authDomain: 'dragon-fall-xxxx.firebaseapp.com',
  projectId: 'dragon-fall-xxxx',
  appId: '1:123456789:web:abc123',
};
```

4. Sube el cambio a GitHub. En el menú del juego verás el botón **CUENTA** y el aviso "Invitado · crea una cuenta…".

> La `apiKey` de Firebase **no es secreta**: está pensada para ir en el código de la web. Lo que protege los datos son las reglas de Firestore y los dominios autorizados.

## Cómo funciona el guardado

- **Invitado:** la partida se guarda en el navegador y se puede copiar como **código** (`DF2.…`).
- **Al crear una cuenta**, el jugador elige con qué progreso empieza:
  - el de este navegador;
  - **su código**, si jugó en versiones anteriores u otro dispositivo (se comprueba antes de crear la cuenta);
  - o de cero.
- **Con sesión iniciada:** cada cambio se sube a la nube a los 2–3 segundos, y también al cerrar o minimizar la pestaña. Si no hay internet, se guarda en local y se sube al volver la conexión.
- **Al entrar desde otro dispositivo:** se carga la versión más reciente.
- **Borrar cuenta:** elimina la cuenta y la partida de la nube. Lo exige el RGPD.

## Aspectos legales (España / UE)

- Guardas un email, que es un **dato personal**. El juego muestra un aviso de privacidad y pide aceptarlo al registrarse. Si el juego se hace público de verdad, conviene ampliar ese texto con tu nombre como responsable y un email de contacto.
- En España, los **menores de 14 años** necesitan permiso de su madre, padre o tutor para dar sus datos (LOPDGDD, art. 7). Por eso el registro lo pide.
- Al elegir `eur3`, los datos se quedan en servidores de la UE.
