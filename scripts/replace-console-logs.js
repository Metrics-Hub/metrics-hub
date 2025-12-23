// Script to replace console.log with logger in hooks
// This will be run manually to update all remaining console.log statements

const fs = require('fs');
const path = require('path');

const hooksToUpdate = [
    'src/hooks/useLeadsData.ts',
    'src/hooks/useMetaAdsData.ts',
    'src/hooks/useGoogleAdsData.ts'
];

hooksToUpdate.forEach(hookPath => {
    const fullPath = path.join(process.cwd(), hookPath);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Add logger import if not present
    if (!content.includes("import { logger } from '@/lib/logger';")) {
        // Find the last import statement
        const importRegex = /^import .* from .*;$/gm;
        const imports = content.match(importRegex);
        if (imports && imports.length > 0) {
            const lastImport = imports[imports.length - 1];
            content = content.replace(lastImport, lastImport + "\nimport { logger } from '@/lib/logger';");
        }
    }

    // Replace console.log with logger.debug (for informational logs)
    content = content.replace(/console\.log\(/g, 'logger.debug(');

    // Replace console.error with logger.error
    content = content.replace(/console\.error\(/g, 'logger.error(');

    // Replace console.warn with logger.warn
    content = content.replace(/console\.warn\(/g, 'logger.warn(');

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${hookPath}`);
});

console.log('All hooks updated successfully!');
