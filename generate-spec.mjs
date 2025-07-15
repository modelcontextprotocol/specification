/**
 * @fileoverview Generates a single-file, self-contained specification from the project's MDX source files.
 * @author Moire.AI
 *
 * This script reads the `docs/docs.json` manifest to concatenate the documentation into a single-file format.
 * It deduplicates the files, processes links to be hierarchical and self-contained, optionally copies assets,
 * ultimately regenerating `dist/` with artifacts for each version of the specification. It creates:
 *  1. A minimally processed intermediary raw `.mdx` file with processed paths
 *  2. A minimally processed intermediary `.md` file with JSX stripped
 *  3. An optionally styled, self-contained `.html` file (the true specification artifact)
 *
 * @usage
 *
 * # Install dependencies (if not added to package.json; use --save-dev if adding)
 * npm install gray-matter marked serve
 *
 * # Generate latest version (default)
 * node generate-spec.mjs
 * # or using a modified package.json ("generate:spec": "node generate-spec.mjs")
 * npm run generate:spec
 *
 * # Generate a specific version
 * npm run generate:spec 2025-03-26
 *
 * # Generate all versions (for comparisons, as generate:spec destroys prior output)
 * npm run generate:spec -- --all
 *
 * # Supported arguments and options:
 *  <version>: Specify a version to generate, defaults to the latest version in `docs/docs.json`
 *  --no-assets: Skip copying supporting assets (images, etc.) for the version
 *  --no-styles: Skip embedding CSS styles in the HTML output
 *  --no-notice: Skip adding the auto-generated notice at the top of the specification
 *  --no-schema: Skip including schema pages in the final specification for brevity
 *  --all: Generate all versions instead of just the latest or specified version
 *  --json-stdout: Emit a machine-readable JSON summary to stdout, suppress normal output
 *
 * # Generate minimal draft version suitable for pasting into a chat
 * npm run generate:spec Draft --no-assets --no-styles --no-notice --no-schema
 *
 * # Serve the generated files locally
 * serve dist
 * # or with a modified package.json ("serve:dist": "serve dist")
 * npm run serve:dist
 * 
 * # Other Notes:
 * - The script will regenerate the `dist/` directory, deleting any existing files.
 */

// Configuration
const DOCS_DIR_NAME = 'docs';
const OUTPUT_DIR_NAME = 'dist';
const OUTPUT_FILE_PREFIX = 'mcp-specification-';
const PROTOCOL_GROUP_NAME = 'Protocol';
const LATEST_SPEC_REDIRECT = '/specification/latest';

// HTML Style Configuration - added to HEAD; can be css or a link to an external stylesheet
const HTML_STYLE_INLINE = `
  <style type="text/css">
    body:not(#nonexistent) { font-family: system-ui, -apple-system, sans-serif !important; line-height: 1.6 !important; color: #333 !important; background-color: #fff !important; margin: 0; padding: 0; }
    main:not(#nonexistent) { max-width: 800px !important; margin: 2rem auto !important; padding: 2rem !important; display: block !important; }
    #schema-reference { display: block !important; }
    a svg { width: 12px !important; height: 12px !important; }
    h1:not(#nonexistent), h2:not(#nonexistent) { border-bottom: 1px solid #ddd; padding-bottom: 0.3em; display: block !important; }
    h3:not(#nonexistent), h4:not(#nonexistent), h5:not(#nonexistent), h6:not(#nonexistent) { display: block !important; }
    code:not(#nonexistent) { font-family: var(--font-mono, monospace); background-color: #f5f5f5; padding: 0.2em 0.4em; margin: 0; font-size: 85%; border-radius: 3px; display: inline !important; }
    pre:not(#nonexistent) { padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #f8f8f8; border-radius: 3px; display: block !important; }
    pre:not(#nonexistent) code { background-color: transparent; padding: 0; margin: 0; font-size: 100%; }
    a:not(#nonexistent) { color: #0066cc; text-decoration: none; display: inline !important; }
    a:not(#nonexistent):hover { text-decoration: underline; }
    hr:not(#nonexistent) { height: 0.25em; padding: 0; margin: 24px 0; background-color: #ddd; border: 0; display: block !important; }
    h2:not(#nonexistent) > a { color: inherit; }
    p:not(#nonexistent) { margin: 1em 0; display: block !important; }
    ul:not(#nonexistent), ol:not(#nonexistent) { margin: 1em 0; padding-left: 2em; display: block !important; }
    li:not(#nonexistent) { display: list-item !important; }
    div:not(#nonexistent) { display: block !important; }
    table:not(#nonexistent) { border-collapse: collapse; width: 100%; margin: 1em 0; display: table !important; }
    th:not(#nonexistent), td:not(#nonexistent) { border: 1px solid #ddd; padding: 0.5em; text-align: left; display: table-cell !important; }
    th:not(#nonexistent) { background-color: #f5f5f5; font-weight: bold; }
  </style>`;
const HTML_STYLE_CSS = `<link rel="stylesheet" href="/style.css">`;

// Dependencies and Constants
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;
const docsDir = path.join(rootDir, DOCS_DIR_NAME);
const outputDir = path.join(rootDir, OUTPUT_DIR_NAME);
const docsConfigPath = path.join(docsDir, 'docs.json');

// Global Options and State
let OPTIONS = {};
let WARNINGS = [];
let ERRORS = [];

// Parse command line arguments and return options object
function parseArguments() {
  const args = process.argv.slice(2);
  return {
    copyAssets: !args.includes('--no-assets'),
    includeStyle: !args.includes('--no-styles'),
    includeNotice: !args.includes('--no-notice'),
    includeSchema: !args.includes('--no-schema'),
    buildAll: args.includes('--all'),
    jsonOutput: args.includes('--json-stdout'),
    version: args.filter(arg => !arg.startsWith('--'))[0] || null
  };
}

// Generate a slug from text (lowercase, hyphenated)
function generateSlug(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// Create hierarchical, URL-friendly slug from a file reference and an optional anchor.
function createHierarchicalSlug(fileSlug, anchor = '') {
  const anchorSlug = generateSlug(anchor);
  return anchorSlug ? `${fileSlug}-${anchorSlug}` : fileSlug;
}

// Recursively collect all file paths from the navigation structure
function collectFilePaths(pages) {
  let files = [];
  for (const page of pages) {
    if (typeof page === 'string') {
      files.push(page);
    } else if (page.group && page.pages) {
      files = files.concat(collectFilePaths(page.pages));
    }
  }
  return files;
}

// Copy all supporting assets for a given version
function copyVersionAssets(version) {
  if (!OPTIONS.copyAssets) return;
  const normalizedVersion = version.toLowerCase() === 'draft' ? 'draft' : version;
  const versionSpecPath = path.join(docsDir, 'specification', normalizedVersion);
  if (!fs.existsSync(versionSpecPath)) {
    const msg = `[WARN] Asset path not found, skipping asset copy: ${versionSpecPath}`;
    if (!OPTIONS.jsonOutput) console.warn(msg);
    WARNINGS.push({ type: 'warning', file: versionSpecPath, message: msg });
    return;
  }
  fs.cpSync(versionSpecPath, path.join(outputDir, 'specification', normalizedVersion), {
    recursive: true,
    filter: (src) => !path.extname(src).match(/\.(mdx?|html)$/i)
  });
  if (!OPTIONS.jsonOutput) console.log(`✅ Copied assets for version ${version}.`);
}


/**
 * Rewrite all links in a markdown string.
 * - Convert cross-file links to hierarchical anchors.
 * - Convert same-file (local) anchors to hierarchical anchors.
 * - Rewrite asset links to be root-relative for the `dist` server.
 */
function rewriteAllLinks(content, currentFileRef, fileSlugs) {
    return content.replace(/(\[.*?\]\()([^)]+)(\))/g, (match, prefix, linkPath, suffix) => {
        if (linkPath.startsWith('http') || linkPath.startsWith('mailto:')) {
            return match;
        }

        const [relativePath, anchorPart] = linkPath.split('#');
        
        // Handle local anchors that point to a sub-heading
        if (relativePath === '') {
            const currentFileSlug = fileSlugs.get(currentFileRef.replace(/\.mdx$/, ''));
            const finalAnchor = createHierarchicalSlug(currentFileSlug, anchorPart);
            return `${prefix}#${finalAnchor}${suffix}`;
        }

        let lookupKey;
        if (relativePath.startsWith('/')) {
            lookupKey = path.normalize(relativePath.substring(1)).replace(/\\/g, '/').replace(/\.mdx$/, '');
        } else {
            const currentDir = path.dirname(currentFileRef);
            lookupKey = path.normalize(path.join(currentDir, relativePath)).replace(/\\/g, '/').replace(/\.mdx$/, '');
        }
        
        // Handle cross-file links
        if (fileSlugs.has(lookupKey)) {
            const finalAnchor = createHierarchicalSlug(fileSlugs.get(lookupKey), anchorPart);
            return `${prefix}#${finalAnchor}${suffix}`;
        }
        
        // Handle asset links
        if (path.extname(relativePath)) {
            let assetPath;
            if (relativePath.startsWith('/')) {
                assetPath = relativePath;
            } else {
                const absoluteAssetPath = path.resolve(path.dirname(path.join(docsDir, currentFileRef)), relativePath);
                assetPath = `/${path.relative(docsDir, absoluteAssetPath).replace(/\\/g, '/')}`;
            }
            return `${prefix}${assetPath}${anchorPart ? '#' + anchorPart : ''}${suffix}`;
        }

        return match;
    });
}

// Generate .md and .html files with proper hierarchical anchors.
function generateFinalArtifacts(baseOutputPath, fullContent) {

    // fullContent has HTML heading anchors injected; strip the final frontmatter before converting
    const markdownWithHtmlHeadings = matter(fullContent).content;

    const htmlBody = marked(markdownWithHtmlHeadings, { gfm: true });
    // If we are including styles, always use the inline style. If also doing copy assets append the CSS link to the inline style.
    let styleSection = '';
    if (OPTIONS.includeStyle) {
        styleSection = OPTIONS.copyAssets ? HTML_STYLE_INLINE + HTML_STYLE_CSS : HTML_STYLE_INLINE;
    }

    const htmlTemplate = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>MCP Specification</title>${styleSection}</head><body><main>${htmlBody}</main></body></html>`;

    // The .md artifact will contain the injected HTML anchors, as it's the direct source for the HTML file.
    fs.writeFileSync(`${baseOutputPath}.md`, markdownWithHtmlHeadings, 'utf8');
    fs.writeFileSync(`${baseOutputPath}.html`, htmlTemplate, 'utf8');

    if (!OPTIONS.jsonOutput) {
        console.log(`✅ Generated MD and HTML artifacts.`);
    }
}

// Generate a single specification file for a given version.
async function generateSpecForVersion(version, docsConfig, isLatest = false) {
  if (!OPTIONS.jsonOutput) console.log(`\n⚙️  Generating specification for version: ${version}`);
  const summary = { processed: 0, skipped: 0, duplicates: 0 };
  const versionConfig = docsConfig.navigation.versions.find(v => (v.version.match(/(\d{4}-\d{2}-\d{2}|[Dd]raft)/) || [])[0] === version);
  if (!versionConfig) throw new Error(`Version '${version}' configuration not found.`);

  const protocolGroup = versionConfig.groups.find(g => g.group === PROTOCOL_GROUP_NAME);
    if (!protocolGroup) throw new Error(`'${PROTOCOL_GROUP_NAME}' group not found for version ${version}.`);

    let pagesToProcess = protocolGroup.pages;
    // Skip schema pages if the option is set to avoid including them in the final spec.
    if (!OPTIONS.includeSchema) {
      pagesToProcess = pagesToProcess.filter(page => {
        return !(typeof page === 'string' && page.endsWith('/schema'));
      });
    }

  const fileRefs = collectFilePaths(pagesToProcess);

  const processedFiles = new Set();
  const versionPrefix = `specification/${version}/`;

  const fileSlugs = new Map(fileRefs.map(ref => {
    const slugPart = ref.replace(versionPrefix, '').replace(/\/index$/, '');
    return [ref.replace(/\.mdx$/, ''), slugPart];
  }));

  const noticeSection = OPTIONS.includeNotice ? `\n> This is an auto-generated file that combines all protocol specification documents into a single, self-contained view for convenience.` : '';
  let fullContent = `---
title: MCP Full Specification (${version})
---
# MCP Full Specification (${version})${noticeSection}
`;

  for (const fileRef of fileRefs) {
    const filePath = path.join(docsDir, `${fileRef}.mdx`);
    if (!fs.existsSync(filePath)) {
        const msg = `[SKIP] File not found: ${filePath}`;
        if (!OPTIONS.jsonOutput) console.warn(msg);
        WARNINGS.push({ type: 'warning', file: fileRef, message: msg });
        summary.skipped++;
        continue;
    }

    if (processedFiles.has(fileRef)) {
        const msg = `[SKIP] Duplicate reference to ${fileRef}.`;
        if (!OPTIONS.jsonOutput) console.warn(msg);
        WARNINGS.push({ type: 'warning', file: fileRef, message: msg });
        summary.duplicates++;
        continue;
    }
    processedFiles.add(fileRef);

    let processedContent = fs.readFileSync(filePath, 'utf8');
    processedContent = matter(processedContent).content;
    processedContent = processedContent.replace(/^((import|export)\s+.*?;?)\s*$/gm, '');
    processedContent = processedContent.replace(/<([A-Z][\w]*)\b[^>]*\/>/g, '');
    processedContent = processedContent.replace(/<\/?[A-Z][\w]*(\s[^>]*)?>/g, '');
    processedContent = rewriteAllLinks(processedContent, fileRef, fileSlugs);
    
    const cleanFileRef = fileRef.replace(/\.mdx$/, '');
    const fileSlug = fileSlugs.get(cleanFileRef) || '';
    
    // Inject the hierarchical anchors for all sub-headings (###, ####, etc.).
    processedContent = processedContent.replace(/^(##+)\s+(.+)$/gm, (match, hashes, headingText) => {
        const finalAnchor = createHierarchicalSlug(fileSlug, headingText);
        const headingLevel = hashes.length;
        return `<h${headingLevel} id="${finalAnchor}">${headingText}</h${headingLevel}>`;
    });

    const title = path.basename(cleanFileRef).replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const titleSlug = createHierarchicalSlug(fileSlug);
    
    fullContent += `\n---\n\n<h2 id="${titleSlug}">${title}</h2>\n\n${processedContent.trim()}\n`;
    summary.processed++;
  }

  const baseOutputPath = path.join(outputDir, `${OUTPUT_FILE_PREFIX}${version}`);
  
  fs.writeFileSync(`${baseOutputPath}.mdx`, fullContent, 'utf8');
  if (!OPTIONS.jsonOutput) console.log(`✅ Generated MDX artifact: ${path.basename(baseOutputPath)}.mdx`);
  
  generateFinalArtifacts(baseOutputPath, fullContent);
  copyVersionAssets(version);

  if (isLatest) {
    const latestBaseOutputPath = path.join(outputDir, `${OUTPUT_FILE_PREFIX}latest`);
    fs.copyFileSync(`${baseOutputPath}.mdx`, `${latestBaseOutputPath}.mdx`);
    fs.copyFileSync(`${baseOutputPath}.md`, `${latestBaseOutputPath}.md`);
    fs.copyFileSync(`${baseOutputPath}.html`, `${latestBaseOutputPath}.html`);
    if (!OPTIONS.jsonOutput) console.log(`✅ Copied artifacts to 'latest' versions.`);
  }
  
  return summary;
}

async function main() {
    OPTIONS = parseArguments();

    if (process.argv.includes('--help')) {
        const usageBlock = fs.readFileSync(__filename, 'utf8').match(/\/\*\*([\s\S]*?)\*\//)[1].split('\n').map(line => line.replace(/^\s*\*\s?/, '')).join('\n').trim();
        console.log(usageBlock);
        process.exit(0);
    }
    
    const docsConfig = JSON.parse(fs.readFileSync(docsConfigPath, 'utf8'));
    const latestRedirect = docsConfig.redirects.find(r => r.source === LATEST_SPEC_REDIRECT);
    if (!latestRedirect) throw new Error(`Fatal: Could not find redirect for '${LATEST_SPEC_REDIRECT}' in docs.json.`);
    const latestVersionString = latestRedirect.destination.split('/')[2];

    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }

    fs.mkdirSync(outputDir, { recursive: true });

    const styleSourcePath = path.join(docsDir, 'style.css');
    const styleDestPath = path.join(outputDir, 'style.css');
    if (fs.existsSync(styleSourcePath)) {
        fs.copyFileSync(styleSourcePath, styleDestPath);
        if (!OPTIONS.jsonOutput) console.log(`✅ Copied global stylesheet.`);
    }
    
    const totalSummary = { processed: 0, skipped: 0, duplicates: 0 };
    
    try {
        if (OPTIONS.buildAll) {
            if (!OPTIONS.jsonOutput) console.log('Building all specification versions...');
            const allVersions = docsConfig.navigation.versions.map(v => (v.version.match(/(\d{4}-\d{2}-\d{2}|[Dd]raft)/) || [])[0]).filter(Boolean);
            for (const version of allVersions) {
                const summary = await generateSpecForVersion(version, docsConfig, version === latestVersionString);
                totalSummary.processed += summary.processed;
                totalSummary.skipped += summary.skipped;
                totalSummary.duplicates += summary.duplicates;
            }
        } else {
            const versionToBuild = OPTIONS.version || latestVersionString;
            if (!OPTIONS.jsonOutput) console.log(OPTIONS.version ? `Building specific version: ${versionToBuild}` : 'Building latest specification version by default...');
            const summary = await generateSpecForVersion(versionToBuild, docsConfig, versionToBuild === latestVersionString);
            Object.assign(totalSummary, summary);
        }
    } catch (err) {
        ERRORS.push({ message: err.message });
    }

    const output = { ...totalSummary, warnings: WARNINGS, errors: ERRORS };

    if (OPTIONS.jsonOutput) {
        console.log(JSON.stringify(output, null, 2));
    } else {
        if (ERRORS.length > 0) {
            console.error(`\n❌ Finished with ${ERRORS.length} error(s).`);
            process.exit(1);
        }
        console.log(`\n✨ Done. Processed: ${totalSummary.processed}, Duplicates: ${totalSummary.duplicates}, Skipped: ${totalSummary.skipped}.`);
    }
}

main().catch(error => {
    const output = { processed: 0, skipped: 0, duplicates: 0, errors: [{ message: error.message }], warnings: WARNINGS };
    if (OPTIONS && OPTIONS.jsonOutput) {
        console.log(JSON.stringify(output, null, 2));
    } else {
        console.error('❌ An unexpected error occurred:', error);
    }
    process.exit(1);
});