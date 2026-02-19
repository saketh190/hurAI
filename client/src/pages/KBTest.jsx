import { useState } from 'react';
import styles from './KBTest.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function KBTest() {
    const [query, setQuery] = useState('');
    const [chunks, setChunks] = useState([]);
    const [searchResults, setSearchResults] = useState(null);
    const [selectedChunk, setSelectedChunk] = useState(null);
    const [comparisonResult, setComparisonResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('search');
    const [error, setError] = useState(null);

    async function loadChunks() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/kb-test/chunks`);
            const data = await response.json();
            if (data.success) {
                setChunks(data.chunks);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function testSearch() {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setComparisonResult(null);
        try {
            const response = await fetch(`${API_URL}/api/kb-test/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim() })
            });
            const data = await response.json();
            if (!data.success) setError(data.error || 'Search failed');
            setSearchResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function compareWithChunk(chunkId) {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/kb-test/compare-embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim(), chunkId })
            });
            const data = await response.json();
            setComparisonResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function scoreColor(score) {
        if (score >= 0.8) return '#4caf50';
        if (score >= 0.6) return '#ff9800';
        return '#f44336';
    }

    function scoreLabel(score) {
        if (score >= 0.8) return '🟢 High';
        if (score >= 0.6) return '🟡 Medium';
        return '🔴 Low';
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🔬 KB Search Diagnostics</h1>
                <p>Test and debug knowledge base search accuracy</p>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={activeTab === 'search' ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab('search')}
                >
                    🔍 Search Test
                </button>
                <button
                    className={activeTab === 'chunks' ? styles.activeTab : styles.tab}
                    onClick={() => { setActiveTab('chunks'); loadChunks(); }}
                >
                    📄 View Chunks {chunks.length > 0 ? `(${chunks.length})` : ''}
                </button>
            </div>

            {error && (
                <div className={styles.errorBanner}>
                    ⚠️ {error}
                </div>
            )}

            {/* ── Search Tab ── */}
            {activeTab === 'search' && (
                <div className={styles.searchTab}>
                    <div className={styles.searchBox}>
                        <h2>Test Query</h2>
                        <textarea
                            className={styles.queryInput}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), testSearch())}
                            placeholder="e.g. 'Excel formulas not calculating' or 'Word document recovery'"
                            rows="3"
                        />
                        <button
                            className={styles.searchButton}
                            onClick={testSearch}
                            disabled={loading || !query.trim()}
                        >
                            {loading ? '⏳ Searching...' : '🔍 Search'}
                        </button>
                    </div>

                    {searchResults?.success && (
                        <div className={styles.results}>
                            {/* Diagnostics */}
                            <div className={styles.diagnostics}>
                                <h3>📊 Diagnostics</h3>
                                <div className={styles.diagGrid}>
                                    <DiagItem label="Query" value={`"${searchResults.query}"`} />
                                    <DiagItem label="Embedding Generated" value={searchResults.diagnostics.queryEmbeddingGenerated ? '✅ Yes' : '❌ No'} />
                                    <DiagItem label="Dimensions" value={searchResults.diagnostics.embeddingDimensions} />
                                    <DiagItem label="Chunks in Cache" value={searchResults.diagnostics.totalChunksSearched} />
                                    <DiagItem label="Vector Results" value={searchResults.diagnostics.vectorResultsFound} />
                                    <DiagItem label="Keyword Results" value={searchResults.diagnostics.keywordResultsFound} />
                                </div>
                            </div>

                            {/* Vector Results */}
                            <div className={styles.resultSection}>
                                <h3>🎯 Vector Search Results (Pinecone)</h3>
                                {searchResults.results.vector.length === 0 ? (
                                    <p className={styles.noResults}>No vector results found</p>
                                ) : (
                                    searchResults.results.vector.map((result, idx) => (
                                        <div key={result.id} className={styles.resultCard}>
                                            <div className={styles.resultHeader}>
                                                <span className={styles.rank}>#{idx + 1}</span>
                                                <span
                                                    className={styles.score}
                                                    style={{ background: scoreColor(result.score) }}
                                                >
                                                    {(result.score * 100).toFixed(1)}% {scoreLabel(result.score)}
                                                </span>
                                                <span className={styles.source}>{result.source}</span>
                                                <span className={styles.chunkId}>{result.id}</span>
                                            </div>
                                            <pre className={styles.resultContent}>{result.fullContent}</pre>
                                            <button
                                                className={styles.compareButton}
                                                onClick={() => compareWithChunk(result.id)}
                                            >
                                                🔬 Compare Embeddings
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Keyword Results */}
                            <div className={styles.resultSection}>
                                <h3>📝 Keyword Search Results (Text Matching)</h3>
                                {searchResults.results.keyword.length === 0 ? (
                                    <p className={styles.noResults}>No keyword matches found — keyword search uses in-memory cache (re-index to populate)</p>
                                ) : (
                                    searchResults.results.keyword.map((result, idx) => (
                                        <div key={result.id} className={styles.resultCard} style={{ borderLeftColor: '#ff9800' }}>
                                            <div className={styles.resultHeader}>
                                                <span className={styles.rank}>#{idx + 1}</span>
                                                <span className={styles.score} style={{ background: '#ff9800' }}>
                                                    {(result.score * 100).toFixed(1)}% match
                                                </span>
                                                <span className={styles.source}>{result.source}</span>
                                            </div>
                                            <pre className={styles.resultContent}>{result.fullContent}</pre>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Embedding Comparison */}
                            {comparisonResult && (
                                <div className={styles.comparison}>
                                    <h3>🔬 Embedding Comparison</h3>
                                    <div className={styles.comparisonGrid}>
                                        <div className={styles.comparisonItem}>
                                            <strong>Query:</strong>
                                            <p>{comparisonResult.query}</p>
                                        </div>
                                        <div className={styles.comparisonItem}>
                                            <strong>Chunk Content:</strong>
                                            <p>{comparisonResult.chunk?.content}</p>
                                        </div>
                                        <div className={styles.comparisonItem}>
                                            <strong>Cosine Similarity:</strong>
                                            <p className={styles.similarityScore}
                                                style={{ color: scoreColor(comparisonResult.similarity) }}>
                                                {(comparisonResult.similarity * 100).toFixed(2)}%
                                            </p>
                                            <p className={styles.interpretation}>
                                                {comparisonResult.interpretation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Chunks Tab ── */}
            {activeTab === 'chunks' && (
                <div className={styles.chunksTab}>
                    <div className={styles.chunksHeader}>
                        <div>
                            <h2>All KB Chunks</h2>
                            <p style={{ color: '#666', margin: '4px 0 0', fontSize: 14 }}>
                                How the KB files will be split and indexed. Click a chunk to see full content.
                            </p>
                        </div>
                        <button onClick={loadChunks} className={styles.refreshButton} disabled={loading}>
                            {loading ? '⏳' : '🔄'} Refresh
                        </button>
                    </div>

                    {loading ? (
                        <p className={styles.noResults}>Parsing chunks...</p>
                    ) : chunks.length === 0 ? (
                        <p className={styles.noResults}>No chunks found. Check that /kb directory has .txt files.</p>
                    ) : (
                        <div className={styles.chunksList}>
                            {chunks.map((chunk, idx) => (
                                <div
                                    key={chunk.id}
                                    className={`${styles.chunkCard} ${selectedChunk?.id === chunk.id ? styles.chunkCardSelected : ''}`}
                                    onClick={() => setSelectedChunk(selectedChunk?.id === chunk.id ? null : chunk)}
                                >
                                    <div className={styles.chunkHeader}>
                                        <span className={styles.chunkId}>#{idx + 1}</span>
                                        {chunk.type === 'qa_pair' && (
                                            <span className={styles.badgeQA}>Q&A Pair</span>
                                        )}
                                        {chunk.type === 'text' && (
                                            <span className={styles.badgeText}>Text</span>
                                        )}
                                        <span className={styles.chunkSource}>{chunk.source}</span>
                                        <span className={styles.chunkLength}>{chunk.length} chars</span>
                                        <span className={styles.expandHint}>
                                            {selectedChunk?.id === chunk.id ? '▲ collapse' : '▼ expand'}
                                        </span>
                                    </div>

                                    {chunk.title && (
                                        <div className={styles.chunkTitle}>📌 {chunk.title}</div>
                                    )}
                                    {chunk.section && (
                                        <div className={styles.chunkSection}>📂 {chunk.section}</div>
                                    )}
                                    {chunk.problem && (
                                        <div className={styles.chunkProblem}>
                                            <strong>Problem:</strong> {chunk.problem}
                                        </div>
                                    )}

                                    {selectedChunk?.id !== chunk.id && (
                                        <div className={styles.chunkPreview}>
                                            {chunk.preview}
                                        </div>
                                    )}

                                    {selectedChunk?.id === chunk.id && (
                                        <div className={styles.chunkFull}>
                                            <strong>Full Content (as stored in vector DB):</strong>
                                            <pre>{chunk.fullContent}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function DiagItem({ label, value }) {
    return (
        <div className={styles.diagItem}>
            <span className={styles.diagLabel}>{label}:</span>
            <span className={styles.diagValue}>{value}</span>
        </div>
    );
}
