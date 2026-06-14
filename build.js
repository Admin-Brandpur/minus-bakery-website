/**
 * build.js
 * ---------------------------------------------------------
 * This script runs automatically on Netlify before every deploy.
 * You do NOT need to run this manually or understand the code.
 *
 * What it does:
 * 1. Reads content.json (the file the CMS edits)
 * 2. Takes index.template.html
 * 3. Replaces SEO placeholder tokens (like __SEO_TITLE__) with
 *    the real values from content.json
 * 4. Saves the result as index.html (the file visitors see)
 *
 * This makes sure search engines (Google, etc.) always see the
 * latest SEO title/description, even though they were edited
 * through the CMS admin panel.
 * ---------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function readFile(filename) {
    return fs.readFileSync(path.join(ROOT, filename), 'utf8');
}

function writeFile(filename, content) {
    fs.writeFileSync(path.join(ROOT, filename), content, 'utf8');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeJson(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '\\"');
}

try {
    const content = JSON.parse(readFile('content.json'));
    let html = readFile('index.template.html');

    const seo = content.seo || {};

    const replacements = {
        '__SEO_TITLE__': escapeHtml(seo.title),
        '__SEO_DESCRIPTION__': escapeHtml(seo.description),
        '__SEO_KEYWORDS__': escapeHtml(seo.keywords),
        '__SEO_OG_TITLE__': escapeHtml(seo.og_title),
        '__SEO_OG_DESCRIPTION__': escapeHtml(seo.og_description),
        '__SEO_TWITTER_TITLE__': escapeHtml(seo.twitter_title),
        '__SEO_TWITTER_DESCRIPTION__': escapeHtml(seo.twitter_description),
        '__SEO_SITE_URL__': escapeHtml(seo.site_url)
    };

    // The JSON-LD script block uses raw JSON, so site_url inside it
    // needs JSON-safe escaping rather than HTML escaping. We handle
    // the JSON-LD block separately to be safe.
    Object.entries(replacements).forEach(([token, value]) => {
        html = html.split(token).join(value || '');
    });

    writeFile('index.html', html);
    console.log('✅ Build complete: index.html generated from content.json + index.template.html');
} catch (err) {
    console.error('❌ Build failed:', err.message);
    process.exit(1);
}
