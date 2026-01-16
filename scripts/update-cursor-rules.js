#!/usr/bin/env node

/**
 * Update Cursor Rules Script
 * 
 * Reads CURSOR_RULES_SOURCE.md and generates .mdc files in .cursor/rules/
 * Also cleans up old rule files that no longer exist in the source.
 * 
 * Usage: node scripts/update-cursor-rules.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_FILE = path.join(__dirname, '..', 'CURSOR_RULES_SOURCE.md');
const RULES_DIR = path.join(__dirname, '..', '.cursor', 'rules');

// Ensure rules directory exists
function ensureDirectories() {
    const globalDir = path.join(RULES_DIR, 'global');
    const frontendDir = path.join(RULES_DIR, 'frontend');
    
    [RULES_DIR, globalDir, frontendDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`   Created directory: ${path.relative(process.cwd(), dir)}`);
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
        
        // Extract metadata lines (more efficient: single regex pass)
        const metadataPattern = /\*\*(File|Description|Always Apply|Globs):\*\*\s*(.+?)$/gm;
        const metadata = {};
        let match;
        
        while ((match = metadataPattern.exec(section)) !== null) {
            const key = match[1].toLowerCase().replace(/\s+/g, '');
            metadata[key] = match[2].trim();
        }
        
        // Validate required metadata
        if (!metadata.file || !metadata.description || !metadata.alwaysapply) {
            console.warn(`⚠️  Skipping section "${title}" - missing required metadata`);
            continue;
        }
        
        const file = metadata.file.replace(/^`|`$/g, '');
        const description = metadata.description;
        const alwaysApply = metadata.alwaysapply.toLowerCase() === 'true';
        
        // Parse globs if present
        let parsedGlobs = null;
        if (metadata.globs) {
            const globsStr = metadata.globs;
            try {
                parsedGlobs = JSON.parse(globsStr);
            } catch (e) {
                // If not JSON, try to parse as comma-separated string
                parsedGlobs = globsStr.split(',').map(g => g.trim().replace(/^["']|["']$/g, ''));
            }
        }
        
        // Extract content (everything after the last metadata line)
        // Find the last metadata match position
        const lastMetadataMatch = [...section.matchAll(metadataPattern)].pop();
        const contentStart = lastMetadataMatch 
            ? section.indexOf('\n\n', lastMetadataMatch.index + lastMetadataMatch[0].length)
            : -1;
        
        const ruleContent = contentStart !== -1 
            ? section.substring(contentStart + 2).trim() 
            : section.substring((lastMetadataMatch?.index || 0) + (lastMetadataMatch?.[0].length || 0)).trim();
        
        if (!ruleContent) {
            console.warn(`⚠️  Skipping section "${title}" - no content found`);
            continue;
        }
        
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
    // Build YAML frontmatter
    const frontmatter = {
        description: rule.description,
        alwaysApply: rule.alwaysApply
    };
    
    if (rule.globs && rule.globs.length > 0) {
        frontmatter.globs = rule.globs;
    }
    
    // Convert frontmatter to YAML
    let yaml = '---\n';
    yaml += `description: ${JSON.stringify(rule.description)}\n`;
    yaml += `alwaysApply: ${rule.alwaysApply}\n`;
    if (rule.globs && rule.globs.length > 0) {
        yaml += `globs:\n`;
        rule.globs.forEach(glob => {
            yaml += `  - ${JSON.stringify(glob)}\n`;
        });
    }
    yaml += '---\n\n';
    
    return yaml + rule.content;
}

// Get all existing .mdc files in rules directory
function getExistingRuleFiles() {
    const existingFiles = new Set();
    
    if (!fs.existsSync(RULES_DIR)) {
        return existingFiles;
    }
    
    const categories = ['global', 'frontend'];
    
    for (const category of categories) {
        const categoryDir = path.join(RULES_DIR, category);
        if (fs.existsSync(categoryDir)) {
            const files = fs.readdirSync(categoryDir);
            files
                .filter(file => file.endsWith('.mdc'))
                .forEach(file => {
                    existingFiles.add(path.join(category, file));
                });
        }
    }
    
    return existingFiles;
}

// Write .mdc files and return set of written files
function writeMdcFiles(rules) {
    const writtenFiles = new Set();
    
    rules.forEach(rule => {
        // Extract filename from file path
        const filename = path.basename(rule.file);
        const categoryDir = path.join(RULES_DIR, rule.category);
        const filePath = path.join(categoryDir, filename);
        const relativePath = path.relative(process.cwd(), filePath);
        
        // Ensure category directory exists
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }
        
        // Generate and write file
        const content = generateMdcFile(rule);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`   ✓ ${relativePath}`);
        writtenFiles.add(path.join(rule.category, filename));
    });
    
    return writtenFiles;
}

// Clean up old rule files that no longer exist in source
function cleanupOldFiles(existingFiles, writtenFiles) {
    const filesToDelete = [...existingFiles].filter(file => !writtenFiles.has(file));
    
    if (filesToDelete.length === 0) {
        return 0;
    }
    
    console.log(`\n🗑️  Cleaning up ${filesToDelete.length} old rule file(s)...`);
    
    let deletedCount = 0;
    filesToDelete.forEach(file => {
        const filePath = path.join(RULES_DIR, file);
        try {
            fs.unlinkSync(filePath);
            console.log(`   ✗ Deleted: ${path.relative(process.cwd(), filePath)}`);
            deletedCount++;
        } catch (error) {
            console.warn(`   ⚠️  Failed to delete ${filePath}: ${error.message}`);
        }
    });
    
    return deletedCount;
}

// Validate rule structure
function validateRules(rules) {
    const errors = [];
    const filePaths = new Set();
    
    rules.forEach((rule, index) => {
        const ruleNum = index + 1;
        
        if (!rule.category || !['global', 'frontend'].includes(rule.category)) {
            errors.push(`Rule ${ruleNum} ("${rule.title}"): Invalid category "${rule.category}"`);
        }
        if (!rule.file) {
            errors.push(`Rule ${ruleNum} ("${rule.title}"): Missing file path`);
        }
        if (!rule.description) {
            errors.push(`Rule ${ruleNum} ("${rule.title}"): Missing description`);
        }
        if (!rule.content || rule.content.trim().length === 0) {
            errors.push(`Rule ${ruleNum} ("${rule.title}"): Missing or empty content`);
        }
        
        // Check for duplicate file paths
        const filename = path.basename(rule.file);
        const fileKey = `${rule.category}/${filename}`;
        if (filePaths.has(fileKey)) {
            errors.push(`Rule ${ruleNum} ("${rule.title}"): Duplicate file path "${fileKey}"`);
        }
        filePaths.add(fileKey);
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
    
    // Get existing files before generating new ones
    const existingFiles = getExistingRuleFiles();
    
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
    const writtenFiles = writeMdcFiles(rules);
    
    // Clean up old files
    const deletedCount = cleanupOldFiles(existingFiles, writtenFiles);
    
    // Summary
    console.log(`\n✅ Successfully generated ${writtenFiles.size} rule file(s)`);
    if (deletedCount > 0) {
        console.log(`   Deleted ${deletedCount} old rule file(s)`);
    }
    console.log(`\n💡 Tip: Edit ${path.basename(SOURCE_FILE)} and run this script again to update rules.`);
}

// Run if executed directly
// In ES modules, we check if this file is the main module by comparing URLs
const currentFileUrl = new URL(import.meta.url);
const mainFileUrl = process.argv[1] ? new URL(process.argv[1], `file://`) : null;

if (!mainFileUrl || currentFileUrl.pathname === mainFileUrl.pathname) {
    main();
}

export { parseSourceFile, generateMdcFile, validateRules };
