// netlify/functions/save-content.js
// This function runs on Netlify's servers (not in the browser).
// It receives updated content from the admin panel and writes it
// to content.json in your GitHub repo via the GitHub API.
// Netlify then auto-detects the change and rebuilds the site.

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Check admin password
    let body;
    try {
        body = JSON.parse(event.body);
    } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const ADMIN_PASSWORD = 'Burdwan_123';
    if (body.password !== ADMIN_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = 'Admin-Brandpur';
    const GITHUB_REPO = 'minus-bakery-website';
    const FILE_PATH = 'content.json';

    if (!GITHUB_TOKEN) {
        return { statusCode: 500, body: JSON.stringify({ error: 'GitHub token not configured in Netlify environment variables' }) };
    }

    try {
        // Step 1: Get current file SHA (required by GitHub API to update a file)
        const getResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'MinusBakery-CMS'
                }
            }
        );

        if (!getResponse.ok) {
            const err = await getResponse.text();
            return { statusCode: 500, body: JSON.stringify({ error: `GitHub GET failed: ${err}` }) };
        }

        const fileData = await getResponse.json();
        const currentSha = fileData.sha;

        // Step 2: Encode new content as base64
        const newContent = JSON.stringify(body.content, null, 2);
        const encoded = Buffer.from(newContent, 'utf8').toString('base64');

        // Step 3: Push the updated file to GitHub
        const putResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'MinusBakery-CMS'
                },
                body: JSON.stringify({
                    message: 'CMS update: content edited via admin panel',
                    content: encoded,
                    sha: currentSha
                })
            }
        );

        if (!putResponse.ok) {
            const err = await putResponse.text();
            return { statusCode: 500, body: JSON.stringify({ error: `GitHub PUT failed: ${err}` }) };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, message: 'Content saved! Site will rebuild in ~60 seconds.' })
        };

    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
