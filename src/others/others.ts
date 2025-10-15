// eslint-disable-next-line @typescript-eslint/no-var-requires
import fs from 'fs';
import path from 'path';

export function listTree(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const lastIndex = entries.length - 1;

  entries.forEach((entry, index) => {
    const isLast = index === lastIndex;
    const connector = isLast ? '└── ' : '├── ';
    const fullPath = path.join(dir, entry.name);

    console.log(`${prefix}${connector}${entry.name}`);

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      listTree(fullPath, newPrefix);
    }
  });
}

