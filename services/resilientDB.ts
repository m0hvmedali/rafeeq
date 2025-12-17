
import { supabase } from '../lib/supabase';
import { AnalysisResponse, MotivationalMessage } from '../types';

/**
 * RESILIENT DB - THE SELF-LEARNING MEMORY
 * Stores every successful interaction.
 * Prevents duplicates.
 * Acts as Level 1 Cache and Final Fallback.
 */

const DB_KEY = 'rafeeq_resilient_knowledge_base';

export interface KnowledgeEntry {
    id: string;
    userId: string;
    timestamp: number;
    inputType: 'reflection' | 'question' | 'general';
    inputSummary: string; // Used for fuzzy matching
    data: AnalysisResponse | MotivationalMessage;
    tags: string[];
}

export interface ResilientDBStructure {
    version: number;
    entries: KnowledgeEntry[];
    lastSync: number;
}

const INITIAL_DB: ResilientDBStructure = {
    version: 1,
    entries: [],
    lastSync: 0
};

// --- LOAD / SAVE ---

export const loadDB = (): ResilientDBStructure => {
    try {
        const stored = localStorage.getItem(DB_KEY);
        return stored ? JSON.parse(stored) : INITIAL_DB;
    } catch (e) {
        return INITIAL_DB;
    }
};

const saveDB = (db: ResilientDBStructure) => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
        // If quota exceeded, trim aggressively
        if (db.entries.length > 20) {
            db.entries = db.entries.slice(0, 20);
            localStorage.setItem(DB_KEY, JSON.stringify(db));
        }
    }
};

// --- SELF-LEARNING WRITER ---

export const saveGeneratedContent = async (
    username: string, 
    input: string, 
    output: AnalysisResponse, 
    tags: string[] = []
) => {
    const db = loadDB();
    const normalizedInput = input.trim().toLowerCase();

    // 1. DUPLICATE PREVENTION LOGIC
    // Check if we have a very recent entry (last 24 hours) with very similar text
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const isDuplicate = db.entries.some(entry => {
        return entry.timestamp > oneDayAgo && 
               calculateSimilarity(entry.inputSummary, normalizedInput) > 0.8;
    });

    if (isDuplicate) {
        console.log("Memory: Skipping duplicate entry.");
        return;
    }

    // 2. CREATE NEW ENTRY
    const newEntry: KnowledgeEntry = {
        id: crypto.randomUUID(),
        userId: username,
        timestamp: Date.now(),
        inputType: 'reflection',
        inputSummary: input, // Store full input for better matching, or truncate if too long
        data: output,
        tags: tags
    };

    // 3. ADD & TRIM
    db.entries.unshift(newEntry);
    if (db.entries.length > 50) db.entries = db.entries.slice(0, 50); // Keep last 50 high quality

    saveDB(db);
    
    // 4. CLOUD SYNC (Fire & Forget)
    syncWithCloud(username);
};

// --- CACHE READER (ALGORITHM STEP 1 & 7) ---

/**
 * Finds the best match in memory.
 * @param query The user input
 * @param minScore Threshold for acceptance (0.6 for Cache, 0.25 for Fallback)
 */
export const findBestMatch = (query: string, minScore: number = 0.6): AnalysisResponse | null => {
    const db = loadDB();
    if (db.entries.length === 0) return null;

    const normalizedQuery = query.trim().toLowerCase();
    
    let bestEntry: KnowledgeEntry | null = null;
    let maxScore = 0;

    for (const entry of db.entries) {
        if (entry.inputType !== 'reflection') continue;
        
        const score = calculateSimilarity(entry.inputSummary.toLowerCase(), normalizedQuery);

        if (score > maxScore) {
            maxScore = score;
            bestEntry = entry;
        }
    }

    if (bestEntry && maxScore > minScore) {
        console.log(`Memory Hit! Score: ${maxScore.toFixed(2)} > ${minScore}`);
        const data = bestEntry.data as AnalysisResponse;
        return {
            ...data,
            source: 'memory', // Will be overwritten by orchestrator to 'memory-fallback' if needed
            summary: {
                ...data.summary,
                analysisText: `(استرجاع من الذاكرة - تطابق ${(maxScore*100).toFixed(0)}%) \n\n ${data.summary.analysisText}`
            }
        };
    }

    return null;
};

// --- UTILS ---

// Simple Jaccard Index for similarity
const calculateSimilarity = (str1: string, str2: string): number => {
    const set1 = new Set(str1.split(/\s+/).filter(w => w.length > 2));
    const set2 = new Set(str2.split(/\s+/).filter(w => w.length > 2));
    
    if (set1.size === 0 || set2.size === 0) return 0;

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
};

// --- SYNC ---
export const syncWithCloud = async (username: string) => {
    if (!supabase) return;
    const db = loadDB();
    try {
        await supabase.from('user_knowledge_base').upsert({
            user_id: username,
            data: db,
            updated_at: new Date().toISOString()
        });
    } catch(e) { /* silent fail */ }
};
