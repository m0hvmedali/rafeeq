
import { supabase } from '../lib/supabase';
import { AnalysisResponse, MotivationalMessage } from '../types';

/**
 * RESILIENT DB
 * A unified storage layer that ensures:
 * 1. All AI outputs are saved locally and synced to cloud.
 * 2. If AI fails, we search this DB for "best match" historical data.
 */

const DB_KEY = 'rafeeq_resilient_knowledge_base';

export interface KnowledgeEntry {
    id: string;
    userId: string;
    timestamp: number;
    inputType: 'reflection' | 'question' | 'general';
    inputSummary: string; // The user's text or keywords
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

// --- CORE OPERATIONS ---

export const loadDB = (): ResilientDBStructure => {
    try {
        const stored = localStorage.getItem(DB_KEY);
        return stored ? JSON.parse(stored) : INITIAL_DB;
    } catch (e) {
        console.error("ResilientDB Load Error", e);
        return INITIAL_DB;
    }
};

const saveDB = (db: ResilientDBStructure) => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
        console.error("ResilientDB Save Error (Quota exceeded?)", e);
        // Strategy: Trim old entries if full
        if (db.entries.length > 50) {
            db.entries = db.entries.slice(0, 50);
            try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch(e2){}
        }
    }
};

// --- SYNC ENGINE ---

export const syncWithCloud = async (username: string) => {
    if (!supabase) return;
    const db = loadDB();

    // 1. PUSH local entries that are newer than last sync (Simplified: just upsert the blob for now)
    // In a production app, we would sync row-by-row. Here we treat the KB as a user document.
    try {
        // Fetch remote first to merge
        const { data: remoteData } = await supabase
            .from('user_knowledge_base')
            .select('data')
            .eq('user_id', username)
            .single();

        let mergedEntries = [...db.entries];
        
        if (remoteData && remoteData.data) {
            const remoteDB = remoteData.data as ResilientDBStructure;
            // Merge logic: Add remote entries that don't exist locally
            const localIds = new Set(db.entries.map(e => e.id));
            const newFromRemote = remoteDB.entries.filter(e => !localIds.has(e.id));
            mergedEntries = [...newFromRemote, ...mergedEntries];
        }

        // Sort by date desc
        mergedEntries.sort((a, b) => b.timestamp - a.timestamp);
        
        // Update Local
        db.entries = mergedEntries;
        db.lastSync = Date.now();
        saveDB(db);

        // Push Back to Cloud
        await supabase.from('user_knowledge_base').upsert({
            user_id: username,
            data: db,
            updated_at: new Date().toISOString()
        });
        
    } catch (e) {
        console.warn("Cloud Sync Warning:", e);
    }
};

// --- WRITE OPERATIONS ---

export const saveGeneratedContent = async (
    username: string, 
    input: string, 
    output: AnalysisResponse, 
    tags: string[] = []
) => {
    const db = loadDB();
    
    // Extract meaningful keywords from input for better search later
    const summary = input.split(' ').slice(0, 20).join(' '); // Simple truncation

    const newEntry: KnowledgeEntry = {
        id: crypto.randomUUID(),
        userId: username,
        timestamp: Date.now(),
        inputType: 'reflection',
        inputSummary: summary,
        data: output,
        tags: tags
    };

    // Add to top
    db.entries.unshift(newEntry);
    
    // Maintain size (Keep last 100 high quality interactions locally)
    if (db.entries.length > 100) {
        db.entries = db.entries.slice(0, 100);
    }

    saveDB(db);
    
    // Fire and forget sync (debounced in real app, direct here)
    // setTimeout(() => syncWithCloud(username), 1000);
};

// --- READ / SEARCH OPERATIONS (THE "BRAIN") ---

/**
 * Finds the most relevant past analysis based on current input text.
 * Uses a simple token overlap (Jaccard-like) algorithm.
 */
export const findBestMatch = (query: string): AnalysisResponse | null => {
    const db = loadDB();
    if (db.entries.length === 0) return null;

    const queryTokens = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    let bestEntry: KnowledgeEntry | null = null;
    let maxScore = 0;

    for (const entry of db.entries) {
        if (entry.inputType !== 'reflection') continue;

        // Tokenize stored input summary
        const entryTokens = new Set(entry.inputSummary.toLowerCase().split(/\s+/).filter(w => w.length > 2));
        
        // Calculate Intersection
        let matchCount = 0;
        queryTokens.forEach(token => {
            if (entryTokens.has(token)) matchCount++;
        });

        // Score: (Matches / Total Query Tokens) + Recency Bonus
        // Recency Bonus: 0.1 for every day recent? No, simple decay.
        // We prioritize relevance over recency here.
        const score = matchCount / queryTokens.size;

        if (score > maxScore) {
            maxScore = score;
            bestEntry = entry;
        }
    }

    // Threshold: At least 20% word overlap to consider it "relevant"
    if (bestEntry && maxScore > 0.2) {
        const fallbackData = bestEntry.data as AnalysisResponse;
        
        // Inject metadata so UI knows it's from memory
        return {
            ...fallbackData,
            source: 'memory',
            summary: {
                ...fallbackData.summary,
                analysisText: `(مسترجع من الذاكرة: ${new Date(bestEntry.timestamp).toLocaleDateString('ar-EG')}) \n\n ${fallbackData.summary.analysisText}`
            }
        };
    }

    return null;
};
