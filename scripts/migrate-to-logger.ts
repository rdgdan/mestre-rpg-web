/**
 * Script para remover/substituir console.logs por logger em todos os arquivos
 * Execute com: tsx scripts/migrate-to-logger.ts
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const filesToProcess = [
  'app/**/*.tsx',
  'app/**/*.ts',
  'lib/**/*.ts',
  'components/**/*.tsx',
];

const patternsToReplace = [
  // console.log patterns
  {
    pattern: /console\.log\s*\(\s*`\[DEBUG\]\s*(.*?)`\s*,\s*(.*?)\s*\);?/g,
    replacement: 'logger.debug("$1", $2);',
    description: 'DEBUG logs',
  },
  {
    pattern: /console\.log\s*\(\s*`\[DEBUG\]\s*(.*?)`\s*\);?/g,
    replacement: 'logger.debug("$1");',
    description: 'DEBUG logs (sem data)',
  },
  {
    pattern: /console\.log\s*\(\s*"(.*?)"\s*,\s*(.*?)\s*\);?/g,
    replacement: 'logger.info("$1", $2);',
    description: 'info logs',
  },
  {
    pattern: /console\.log\s*\(\s*'(.*?)'\s*,\s*(.*?)\s*\);?/g,
    replacement: "logger.info('$1', $2);",
    description: 'info logs (single quotes)',
  },
  {
    pattern: /console\.log\s*\(\s*`(.*?)`\s*,\s*(.*?)\s*\);?/g,
    replacement: 'logger.info(`$1`, $2);',
    description: 'info logs (backticks)',
  },
  // console.warn patterns
  {
    pattern: /console\.warn\s*\(\s*`(.*?)`\s*,\s*(.*?)\s*\);?/g,
    replacement: 'logger.warn(`$1`, $2);',
    description: 'warn logs',
  },
  {
    pattern: /console\.warn\s*\(\s*"(.*?)"\s*,\s*(.*?)\s*\);?/g,
    replacement: 'logger.warn("$1", $2);',
    description: 'warn logs (double quotes)',
  },
];

async function migrateFiles() {
  console.log('🔄 Iniciando migração para logger...\n');

  let totalFiles = 0;
  let modifiedFiles = 0;
  let totalReplacements = 0;

  for (const globPattern of filesToProcess) {
    const files = await glob(globPattern, { cwd: process.cwd() });

    for (const file of files) {
      // Skip node_modules e files já processados
      if (file.includes('node_modules') || file.includes('logger.ts')) {
        continue;
      }

      totalFiles++;
      const filePath = path.join(process.cwd(), file);
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;

      // Verificar se já tem import do logger
      if (content.includes('logger') && !content.includes("import { logger }")) {
        // Skip files que já têm logger
        continue;
      }

      // Aplicar cada padrão
      let fileModified = false;
      for (const { pattern, replacement, description } of patternsToReplace) {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`  ✏️  ${file}: ${matches.length} ${description}`);
          content = content.replace(pattern, replacement);
          totalReplacements += matches.length;
          fileModified = true;
        }
      }

      if (fileModified) {
        // Adicionar import se necessário
        if (!content.includes("import { logger }")) {
          // Encontrar a primeira importação e adicionar depois dela
          const importMatch = content.match(/^import\s+{?\s*\w+/m);
          if (importMatch) {
            content = content.replace(
              /^(import[\s\S]*?from\s+['"][^'"]+['"];)/m,
              `$1\nimport { logger } from '@/lib/logger';`
            );
          }
        }

        modifiedFiles++;
        fs.writeFileSync(filePath, content, 'utf-8');
      }
    }
  }

  console.log(`\n✅ Migração concluída!`);
  console.log(`   Total de arquivos processados: ${totalFiles}`);
  console.log(`   Arquivos modificados: ${modifiedFiles}`);
  console.log(`   Total de substituições: ${totalReplacements}`);
  console.log('\n💡 Dica: Revise as mudanças com git diff antes de fazer commit');
}

migrateFiles().catch(console.error);
