"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseChecksums = parseChecksums;
function parseChecksums(content, assetName) {
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        const match = trimmed.match(/^([a-f0-9]{64})\s+(.+)$/i);
        if (match) {
            const [, hash, filename] = match;
            if (filename === assetName || filename.endsWith(`/${assetName}`)) {
                return hash.toLowerCase();
            }
        }
    }
    return null;
}
