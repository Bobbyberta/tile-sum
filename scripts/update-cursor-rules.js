#!/usr/bin/env node

/**
 * Update Cursor Rules Script
 * 
 * Reads CURSOR_RULES_SOURCE.md and generates .mdc files in .cursor/rules/
 * 
 * Usage: node scripts/update-cursor-rules.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '..', 'CURSOR_RULES_SOURCE.md');
const RULES_DIR = path.join(__dirname, '..', '.cursor', 'rules');

// Ensure rules directory exists
function ensureDirectories() {
    const globalDir = path.join(RULES_DIR, 'global');
    const frontendDir = path.join(RULES_DIR, 'frontend');
    
    [RULES_DIR, globalDir, frontendDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
}

// Parse the source file and extract rule sections
function parseSourceFile() {
    const content = fs.readFileSync(SOURCE_FILE, 'utf-8');
    const rules = [];
    
    // Split by section markers (---)
    const sections = content.split(/^---\s*$/m);
    
    for (let i = 1; i < sections.length; i++) {
        const section = sections[i].trim();
        if (!section) continue;
        
        // Extract header: ## [CATEGORY] Title
        const headerMatch = section.match(/^##\s+\[(GLOBAL|FRONTEND)\]\s+(.+?)$/m);
        if (!headerMatch) continue;
        
        const [, category, title] = headerMatch;
        
        // Extract metadata lines
        const fileMatch = section.match(/\*\*File:\*\*\s*(.+?)$/m);
        const descMatch = section.match(/\*\*Description:\*\*\s*(.+?)$/m);
        const alwaysMatch = section.match(/\*\*Always Apply:\*\*\s*(.+?)$/m);
        const globsMatch = section.match(/\*\*Globs:\*\*\s*(.+?)$/m);
        
        if (!fileMatch || !descMatch || !alwaysMatch) {
            console.warn(`⚠️  Skipping section "${title}" - missing required metadata`);
            continue;
        }
        
        const file = fileMatch[1].trim().replace(/^`|`$/g, '');
        const description = descMatch[1].trim();
        const alwaysApply = alwaysMatch[1].trim().toLowerCase() === 'true';
        
        // Parse globs if present
        let parsedGlobs = null;
        if (globsMatch) {
            const globsStr = globsMatch[1].trim();
            try {
                parsedGlobs = JSON.parse(globsStr);
            } catch (e) {
                // If not JSON, try to parse as comma-separated string
                parsedGlobs = globsStr.split(',').map(g => g.trim().replace(/^["']|["']$/g, ''));
            }
        }
        
        // Extract content (everything after the metadata lines)
        // Find the last metadata line (either Globs or Always Apply)
        const lastMetadataLine = globsMatch ? globsMatch[0] : alwaysMatch[0];
        const lastMetadataIndex = section.indexOf(lastMetadataLine);
        const contentStart = section.indexOf('\n\n', lastMetadataIndex);
        const ruleContent = contentStart !== -1 ? section.substring(contentStart + 2).trim() : section.substring(lastMetadataIndex + lastMetadataLine.length).trim();
        
        rules.push({
            category: category.toLowerCase(),
            title: title.trim(),
            file: file.trim(),
            description: description.trim(),
            alwaysApply: alwaysApply,
            globs: parsedGlobs,
            content: ruleContent
        });
    }
    
    return rules;
}

// Generate .mdc file content with frontmatter
function generateMdcFile(rule) {
    const frontmatter = {
        description: rule.description,
        alwaysApply: rule.alwaysApply
    };
    
    if (rule.globs) {
        frontmatter.globs = rule.globs;
    }
    
    // Convert frontmatter to YAML
    let yaml = '---\n';
    yaml += `description: ${JSON.stringify(rule.description)}\n`;
    yaml += `alwaysApply: ${rule.alwaysApply}\n`;
    if (rule.globs) {
        yaml += `globs:\n`;
        rule.globs.forEach(glob => {
            yaml += `  - ${JSON.stringify(glob)}\n`;
        });
    }
    yaml += '---\n\n';
    
    return yaml + rule.content;
}

// Write .mdc files
function writeMdcFiles(rules) {
    let writtenCount = 0;
    
    rules.forEach(rule => {
        // Extract filename from file path
        const filename = path.basename(rule.file);
        const categoryDir = path.join(RULES_DIR, rule.category);
        const filePath = path.join(categoryDir, filename);
        
        // Ensure category directory exists
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }
        
        // Generate and write file
        const content = generateMdcFile(rule);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✓ Generated: ${filePath}`);
        writtenCount++;
    });
    
    return writtenCount;
}

// Validate rule structure
function validateRules(rules) {
    const errors = [];
    
    rules.forEach((rule, index) => {
        if (!rule.category || !['global', 'frontend'].includes(rule.category)) {
            errors.push(`Rule ${index + 1}: Invalid category "${rule.category}"`);
        }
        if (!rule.file) {
            errors.push(`Rule ${index + 1}: Missing file path`);
        }
        if (!rule.description) {
            errors.push(`Rule ${index + 1}: Missing description`);
        }
        if (!rule.content) {
            errors.push(`Rule ${index + 1}: Missing content`);
        }
    });
    
    return errors;
}

// Main execution
function main() {
    console.log('🔄 Updating Cursor rules...\n');
    
    // Check if source file exists
    if (!fs.existsSync(SOURCE_FILE)) {
        console.error(`❌ Error: Source file not found: ${SOURCE_FILE}`);
        process.exit(1);
    }
    
    // Ensure directories exist
    ensureDirectories();
    
    // Parse source file
    console.log('📖 Reading source file...');
    const rules = parseSourceFile();
    
    if (rules.length === 0) {
        console.error('❌ Error: No rules found in source file');
        process.exit(1);
    }
    
    console.log(`   Found ${rules.length} rule(s)\n`);
    
    // Validate rules
    console.log('✔ Validating rules...');
    const errors = validateRules(rules);
    if (errors.length > 0) {
        console.error('❌ Validation errors:');
        errors.forEach(error => console.error(`   - ${error}`));
        process.exit(1);
    }
    console.log('   All rules valid\n');
    
    // Generate .mdc files
    console.log('📝 Generating .mdc files...');
    const writtenCount = writeMdcFiles(rules);
    
    console.log(`\n✅ Successfully generated ${writtenCount} rule file(s)`);
    console.log(`\n💡 Tip: Edit ${path.basename(SOURCE_FILE)} and run this script again to update rules.`);
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { parseSourceFile, generateMdcFile, validateRules };

