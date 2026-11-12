const fs = require('fs');
const path = require('path');

try {
  // 1. Patch vite/bin/vite.js
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

  // 2. Patch dep-*.js in vite
  const distDir = path.resolve(__dirname, '../node_modules/vite/dist/node/chunks');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    for (const f of files) {
      if (f.endsWith('.js')) {
        const filePath = path.join(distDir, f);
        let code = fs.readFileSync(filePath, 'utf8');
        if (code.includes("constants as constants$3 } from 'node:fs/promises'")) {
          code = code.replace(
            "import fsp, { constants as constants$3 } from 'node:fs/promises';",
            "import fsp from 'node:fs/promises';\nimport { constants as constants$3 } from 'node:fs';"
          );
          fs.writeFileSync(filePath, code, 'utf8');
        }
      }
    }
  }
} catch (e) {
  // Silent fail if node_modules not yet present
}
