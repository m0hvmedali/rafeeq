
import { AnalysisResponse, MotivationalMessage } from "../types";
import { INITIAL_KNOWLEDGE_BASE, MemoryEntry } from "../lib/knowledgeBase";

const STORAGE_KEY = 'rafeeq_neural_memory_v1';

// Load memory from LocalStorage or initialize
const loadMemory = (): MemoryEntry[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [...INITIAL_KNOWLEDGE_BASE];
    } catch {
        return [...INITIAL_KNOWLEDGE_BASE];
    }
};

let inMemoryCache: MemoryEntry[] = loadMemory();

// Save new entry to memory
export const saveToMemory = (query: string, response: any, source: MemoryEntry['source']) => {
    const newEntry: MemoryEntry = {
        queryHash: query.toLowerCase().trim(), // Simple normalization
        originalQuery: query,
        response: response,
        timestamp: Date.now(),
        source: source
    };

    // Add to beginning, keep max 50 entries to avoid bloat
    inMemoryCache = [newEntry, ...inMemoryCache].slice(0, 50);
    
    // Persist
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryCache));
};

// Calculate Similarity (Jaccard Index for word overlap) - fast and effective enough
const calculateSimilarity = (str1: string, str2: string): number => {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
};

// Search Memory
export const findCachedResponse = (query: string, type: 'analysis' | 'motivation' = 'analysis'): any | null => {
    const threshold = 0.4; // 40% word overlap required
    
    // Sort by similarity
    const matches = inMemoryCache
        .map(entry => ({
            entry,
            score: calculateSimilarity(query, entry.originalQuery)
        }))
        .filter(match => match.score > threshold)
        .sort((a, b) => b.score - a.score);

    if (matches.length > 0) {
        // Ensure the cached response matches the requested type structure roughly
        const bestMatch = matches[0].entry.response;
        if (type === 'analysis' && (bestMatch as AnalysisResponse).summary) return bestMatch;
        if (type === 'motivation' && (bestMatch as MotivationalMessage).text) return bestMatch;
    }
    
    return null;
};
