#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common fixes
const fixes = [
  // Fix unescaped entities
  {
    pattern: /Don't/g,
    replacement: "Don&apos;t"
  },
  {
    pattern: /Didn't/g,
    replacement: "Didn&apos;t"
  },
  {
    pattern: /Can't/g,
    replacement: "Can&apos;t"
  },
  {
    pattern: /Won't/g,
    replacement: "Won&apos;t"
  },
  {
    pattern: /It's/g,
    replacement: "It&apos;s"
  },
  {
    pattern: /You're/g,
    replacement: "You&apos;re"
  },
  {
    pattern: /We're/g,
    replacement: "We&apos;re"
  },
  {
    pattern: /They're/g,
    replacement: "They&apos;re"
  },
  // Fix unused catch variables
  {
    pattern: /} catch \(error\) {/g,
    replacement: "} catch {"
  },
  {
    pattern: /} catch \(err\) {/g,
    replacement: "} catch {"
  },
  {
    pattern: /} catch \(e\) {/g,
    replacement: "} catch {"
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fixFile(filePath);
    }
  });
}

// Start from src directory
walkDir('./src');
console.log('ESLint fixes applied!');