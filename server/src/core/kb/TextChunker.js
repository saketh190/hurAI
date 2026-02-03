/**
 * Text Chunker
 * Splits text into overlapping chunks for better vector search
 * Similar to LangChain's RecursiveCharacterTextSplitter
 */
export class TextChunker {
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 500;      // Characters per chunk
        this.chunkOverlap = options.chunkOverlap || 100; // Overlap between chunks
        this.separators = options.separators || ['\n\n', '\n', '. ', ' ', ''];
    }

    /**
     * Split text into overlapping chunks
     * @param {string} text - Text to split
     * @param {Object} metadata - Metadata to attach to each chunk
     * @returns {Array<Object>} Array of chunk objects
     */
    chunk(text, metadata = {}) {
        if (!text || text.length === 0) {
            return [];
        }

        // If text is smaller than chunk size, return as single chunk
        if (text.length <= this.chunkSize) {
            return [{
                content: text.trim(),
                index: 0,
                start: 0,
                end: text.length,
                ...metadata,
            }];
        }

        const chunks = [];
        let currentPos = 0;
        let chunkIndex = 0;

        while (currentPos < text.length) {
            // Calculate end position for this chunk
            let endPos = Math.min(currentPos + this.chunkSize, text.length);

            // If not at the end, try to find a good break point
            if (endPos < text.length) {
                endPos = this.findBreakPoint(text, currentPos, endPos);
            }

            // Extract chunk
            const chunkText = text.slice(currentPos, endPos).trim();

            if (chunkText.length > 0) {
                chunks.push({
                    content: chunkText,
                    index: chunkIndex,
                    start: currentPos,
                    end: endPos,
                    ...metadata,
                });
                chunkIndex++;
            }

            // Move position forward (with overlap)
            currentPos = endPos - this.chunkOverlap;

            // Prevent infinite loop
            if (currentPos <= chunks[chunks.length - 1]?.start) {
                currentPos = endPos;
            }
        }

        return chunks;
    }

    /**
     * Find the best break point near the target position
     */
    findBreakPoint(text, start, targetEnd) {
        // Look backwards from target for a separator
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

    /**
     * Chunk a file with source tracking
     * @param {string} content - File content
     * @param {string} source - Source file name
     * @returns {Array<Object>} Chunks with source metadata
     */
    chunkFile(content, source) {
        // Clean the content
        const cleanedContent = content
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return this.chunk(cleanedContent, { source });
    }

    /**
     * Generate a unique ID for a chunk
     */
    generateChunkId(source, index) {
        const cleanSource = source
            .replace(/\.[^/.]+$/, '') // Remove extension
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .substring(0, 30);

        return `${cleanSource}-chunk-${index}`;
    }
}

export default TextChunker;
