// Construye el juego en un solo archivo.
//   node tools/build.js         -> index.html protegido (minificado y ofuscado)
//   node tools/build.js --dev   -> dev.html legible, para desarrollar y probar
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const PARTS = ['1_head.html', '2_data.js', '3_engine.js', '3b_world.js', '4_game.js', '5_render_ui.js', '5b_shop.js', '6_account.js'];
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
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: .6,
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
