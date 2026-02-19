/**
 * Text Chunker
 * Supports both structure-aware (KB format) and fallback fixed-size chunking.
 *
 * Structure-Aware mode parses blocks like:
 *   ### Title
 *   **Problem:** ...
 *   **Solution:** ...
 *
 * Each Problem+Solution block becomes one self-contained chunk,
 * which gives the vector DB the full context needed to answer a query.
 */
export class TextChunker {
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 500;
        this.chunkOverlap = options.chunkOverlap || 100;
        this.separators = options.separators || ['\n\n', '\n', '. ', ' ', ''];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STRUCTURE-AWARE CHUNKING  (used by chunkFile)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Parse KB file into structured chunks, one per Problem/Solution block.
     * Falls back to fixed-size chunking for sections that don't match the pattern.
     *
     * @param {string} content - Raw file content
     * @param {string} source  - File name (for metadata)
     * @returns {Array<Object>} chunks
     */
    chunkFile(content, source) {
        const cleaned = content
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        const chunks = [];
        let chunkIndex = 0;

        // Split on H2 sections (## Excel Issues, ## Word Issues, etc.)
        const sections = cleaned.split(/\n(?=## )/);

        for (const section of sections) {
            const sectionTitle = (section.match(/^## (.+)/) || [])[1] || '';

            // Split section on H3 sub-headings (### Excel Formulas Not Calculating)
            const blocks = section.split(/\n(?=### )/);

            for (const block of blocks) {
                if (!block.trim()) continue;

                // Check if this block has a Problem/Solution structure
                const hasStructure = block.includes('**Problem:**') || block.includes('**Solution:**');

                if (hasStructure) {
                    // Parse the structured block
                    const parsed = this.parseStructuredBlock(block, sectionTitle);
                    if (parsed) {
                        chunks.push({
                            content: parsed.text,
                            index: chunkIndex++,
                            source,
                            type: 'qa_pair',
                            title: parsed.title,
                            section: sectionTitle,
                            problem: parsed.problem,
                        });
                        continue;
                    }
                }

                // Fallback: if block is just a header or small text, include as-is
                const blockText = block.trim();
                if (blockText.length < 50) continue; // skip bare headers

                if (blockText.length <= this.chunkSize * 2) {
                    chunks.push({
                        content: blockText,
                        index: chunkIndex++,
                        source,
                        type: 'text',
                        section: sectionTitle,
                    });
                } else {
                    // Large unstructured block → fixed-size chunking
                    const subChunks = this.chunk(blockText, { source, section: sectionTitle, type: 'text' });
                    for (const sc of subChunks) {
                        sc.index = chunkIndex++;
                        chunks.push(sc);
                    }
                }
            }
        }

        console.log(`[Chunker] Created ${chunks.length} structured chunks from ${source}`);
        chunks.forEach((c, i) => {
            const preview = c.content.substring(0, 80).replace(/\n/g, ' ');
            console.log(`  [${i}] type=${c.type} title="${c.title || ''}" → "${preview}..."`);
        });

        return chunks;
    }

    /**
     * Parse a single ### block into { title, problem, solution, text }
     */
    parseStructuredBlock(block, sectionTitle) {
        // Extract ### title
        const titleMatch = block.match(/^### (.+)/m);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // Extract **Problem:**
        const problemMatch = block.match(/\*\*Problem:\*\*\s*([\s\S]*?)(?=\*\*Solution:\*\*|$)/i);
        const problem = problemMatch ? problemMatch[1].trim() : '';

        // Extract **Solution:**
        const solutionMatch = block.match(/\*\*Solution:\*\*\s*([\s\S]*?)$/i);
        const solution = solutionMatch ? solutionMatch[1].trim() : '';

        if (!problem && !solution) return null;

        // Build a rich text representation for embedding
        // The format is designed so semantic search can find it via:
        // - natural language question ("how to fix Excel not calculating")
        // - symptom ("Excel shows formula text")
        // - solution keywords ("Ctrl+Alt+F9", "force recalculation")
        const text = [
            sectionTitle ? `[${sectionTitle}]` : '',
            title ? `Issue: ${title}` : '',
            problem ? `Problem: ${problem}` : '',
            solution ? `Solution:\n${solution}` : '',
        ].filter(Boolean).join('\n\n');

        return { title, problem, solution, text };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIXED-SIZE CHUNKING  (fallback)
    // ─────────────────────────────────────────────────────────────────────────

    chunk(text, metadata = {}) {
        if (!text || text.length === 0) return [];

        if (text.length <= this.chunkSize) {
            return [{ content: text.trim(), index: 0, start: 0, end: text.length, ...metadata }];
        }

        const chunks = [];
        let currentPos = 0;
        let chunkIndex = 0;

        while (currentPos < text.length) {
            let endPos = Math.min(currentPos + this.chunkSize, text.length);

            if (endPos < text.length) {
                endPos = this.findBreakPoint(text, currentPos, endPos);
            }

            const chunkText = text.slice(currentPos, endPos).trim();
            if (chunkText.length > 0) {
                chunks.push({ content: chunkText, index: chunkIndex++, start: currentPos, end: endPos, ...metadata });
            }

            currentPos = endPos - this.chunkOverlap;
            if (currentPos <= (chunks[chunks.length - 1]?.start ?? -1)) {
                currentPos = endPos;
            }
        }

        return chunks;
    }

    findBreakPoint(text, start, targetEnd) {
        const searchStart = Math.max(start, targetEnd - 100);
        const searchText = text.slice(searchStart, targetEnd);

        for (const separator of this.separators) {
            if (separator === '') continue;
            const lastIndex = searchText.lastIndexOf(separator);
            if (lastIndex !== -1) {
                return searchStart + lastIndex + separator.length;
            }
        }
        return targetEnd;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    generateChunkId(source, index) {
        const cleanSource = source
            .replace(/\.[^/.]+$/, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .substring(0, 30);
        return `${cleanSource}-chunk-${index}`;
    }
}

export default TextChunker;
