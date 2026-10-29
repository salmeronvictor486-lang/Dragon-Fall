// Construye el juego en un solo archivo.
//   node tools/build.js         -> index.html protegido (minificado y ofuscado)
//   node tools/build.js --dev   -> dev.html legible, para desarrollar y probar
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PARTS = ['1_head.html', '2b_i18n.js', '2c_i18n_data.js', '2_data.js', '3_engine.js', '3b_world.js', '4_game.js', '4b_meta.js', '4c_map.js', '5_render_ui.js', '5b_shop.js', '5c_meta_ui.js', '6_account.js'];
const html = PARTS.map(f => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8')).join('');

if (process.argv.includes('--dev')) {
  fs.writeFileSync(path.join(ROOT, 'dev.html'), html);
  console.log('dev.html', html.length, 'bytes');
  process.exit(0);
}

// Junta todos los <script> internos en uno solo, encerrado en una función:
// así nada queda expuesto en la consola del navegador (ni save, ni G, ni P).
const blocks = [];
let out = html.replace(/<script>([\s\S]*?)<\/script>\s*/g, (m, code) => { blocks.push(code); return blocks.length === 1 ? '<!--JS-->' : ''; });
const code = '(function(){\n' + blocks.join('\n;\n') + '\n})();';

const JavaScriptObfuscator = require('javascript-obfuscator');
const obf = process.argv.includes('--plain') ? code : JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  simplify: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  stringArray: true,
  stringArrayEncoding: [],        // sin base64: con codificación el juego iba 2-4 veces más lento
  stringArrayThreshold: .5,
  reservedStrings: ['^#[0-9a-fA-F]{3,8}$', '^rgba?\\(', '^(source-over|lighter|middle|center|left|right|round|play|levelup|paused|boss|beam|ball|spark|text|ring|boom|poof|p|disc|orbital|hakai|candy|pillar|ray|slash|arc)$'],
  stringArrayCallsTransform: false,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  splitStrings: false,
  controlFlowFlattening: false,   // lo dejaría demasiado lento para un juego a 60 fps
  deadCodeInjection: false,
  selfDefending: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  target: 'browser',
}).getObfuscatedCode();

// CSS sin comentarios ni saltos innecesarios y HTML sin comentarios
out = out.replace(/<style>([\s\S]*?)<\/style>/, (m, css) => '<style>' + css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '') + '</style>')
  .replace(/<!--(?!JS-->)[\s\S]*?-->/g, '')
  .replace('<!--JS-->', () => '<script>' + obf + '</script>\n');
fs.writeFileSync(path.join(ROOT, 'index.html'), out);
console.log('index.html', out.length, 'bytes (protegido)');

// PWA: manifiesto y service worker (la versión cambia con cada build para que se actualice solo)
const version = require('crypto').createHash('sha1').update(out).digest('hex').slice(0, 10);
fs.writeFileSync(path.join(ROOT, 'manifest.webmanifest'), JSON.stringify({
  name: 'Dragon Fall', short_name: 'Dragon Fall', lang: 'es', start_url: './', scope: './', display: 'fullscreen', orientation: 'any',
  background_color: '#0b0f24', theme_color: '#0b0f24', description: 'Survivor pixel art del universo Dragon Ball. Fan game gratuito.',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));
fs.writeFileSync(path.join(ROOT, 'sw.js'), fs.readFileSync(path.join(__dirname, 'sw.template.js'), 'utf8').replace('__VERSION__', version));
console.log('manifest.webmanifest + sw.js', version);
