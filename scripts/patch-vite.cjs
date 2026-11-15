const fs = require('fs');
const path = require('path');

function patchDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      patchDirectory(fullPath);
    } else if (f.endsWith('.js') || f.endsWith('.mjs')) {
      let code = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // 1. node:module isBuiltin
      if (code.includes("from 'node:module'") && code.includes('isBuiltin')) {
        // Replace named isBuiltin import
        code = code.replace(/import\s*\{([^}]*)\bisBuiltin\b([^}]*)\}\s*from\s*'node:module';/g, (match, before, after) => {
          const rest = (before + after).split(',').map(s => s.trim()).filter(Boolean).join(', ');
          const restImport = rest ? `import { ${rest} } from 'node:module';\n` : '';
          return `${restImport}import _mod_poly from 'node:module';\nconst isBuiltin = _mod_poly.isBuiltin || ((id) => _mod_poly.builtinModules.includes(id));`;
        });

        code = code.replace(/import\s+([a-zA-Z0-9_$]+),\s*\{([^}]*)\bisBuiltin\b([^}]*)\}\s*from\s*'node:module';/g, (match, defId, before, after) => {
          const rest = (before + after).split(',').map(s => s.trim()).filter(Boolean).join(', ');
          const restImport = rest ? `import { ${rest} } from 'node:module';\n` : '';
          return `import ${defId} from 'node:module';\n${restImport}const isBuiltin = ${defId}.isBuiltin || ((id) => ${defId}.builtinModules.includes(id));`;
        });
        changed = true;
      }

      // 2. node:os availableParallelism
      if (code.includes("from 'node:os'") && code.includes('availableParallelism')) {
        code = code.replace(/import\s*([a-zA-Z0-9_$]+)?,\s*\{([^}]*)\bavailableParallelism\b([^}]*)\}\s*from\s*'node:os';/g, (match, defId, before, after) => {
          const def = defId || '_os_poly';
          const rest = (before + after).split(',').map(s => s.trim()).filter(Boolean).join(', ');
          const restImport = rest ? `import { ${rest} } from 'node:os';\n` : '';
          return `import ${def} from 'node:os';\n${restImport}const availableParallelism = ${def}.availableParallelism || (() => (${def}.cpus ? ${def}.cpus().length : 4));`;
        });
        code = code.replace(/import\s*\{([^}]*)\bavailableParallelism\b([^}]*)\}\s*from\s*'node:os';/g, (match, before, after) => {
          const rest = (before + after).split(',').map(s => s.trim()).filter(Boolean).join(', ');
          const restImport = rest ? `import { ${rest} } from 'node:os';\n` : '';
          return `import _os_poly from 'node:os';\n${restImport}const availableParallelism = _os_poly.availableParallelism || (() => (_os_poly.cpus ? _os_poly.cpus().length : 4));`;
        });
        changed = true;
      }

      // 3. node:fs/promises constants
      if (code.includes("constants as constants$3 } from 'node:fs/promises'")) {
        code = code.replace(
          "import fsp, { constants as constants$3 } from 'node:fs/promises';",
          "import fsp from 'node:fs/promises';\nimport { constants as constants$3 } from 'node:fs';"
        );
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, code, 'utf8');
      }
    }
  }
}

try {
  patchDirectory(path.resolve(__dirname, '../node_modules/vitest'));
  patchDirectory(path.resolve(__dirname, '../node_modules/@vitest'));
  patchDirectory(path.resolve(__dirname, '../node_modules/vite'));

  // Patch vite.js
  const viteBinPath = path.resolve(__dirname, '../node_modules/vite/bin/vite.js');
  if (fs.existsSync(viteBinPath)) {
    let content = fs.readFileSync(viteBinPath, 'utf8');
    if (!content.includes('crypto.getRandomValues')) {
      const target = "import module from 'node:module'";
      const patch = `import module from 'node:module'
import crypto from 'node:crypto'
import fs from 'node:fs'
import fsp from 'node:fs/promises'

if (!fsp.constants && fs.constants) {
  fsp.constants = fs.constants;
}
if (!crypto.getRandomValues && crypto.webcrypto?.getRandomValues) {
  crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
}
if (!globalThis.crypto) {
  globalThis.crypto = crypto.webcrypto;
}`;
      content = content.replace(target, patch);
      fs.writeFileSync(viteBinPath, content, 'utf8');
    }
  }

  // Patch vitest.mjs
  const vitestMjs = path.resolve(__dirname, '../node_modules/vitest/vitest.mjs');
  if (fs.existsSync(vitestMjs)) {
    let content = fs.readFileSync(vitestMjs, 'utf8');
    if (!content.includes('crypto.getRandomValues')) {
      const polyfills = `import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
if (!os.availableParallelism) os.availableParallelism = () => (os.cpus ? os.cpus().length : 4);
if (!fsp.constants && fs.constants) fsp.constants = fs.constants;
if (!crypto.getRandomValues && crypto.webcrypto?.getRandomValues) crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
if (!globalThis.crypto) globalThis.crypto = crypto.webcrypto;\n`;
      content = "#!/usr/bin/env node\n" + polyfills + "import './dist/cli.js'\n";
      fs.writeFileSync(vitestMjs, content, 'utf8');
    }
  }
} catch (e) {
  console.error(e);
}
