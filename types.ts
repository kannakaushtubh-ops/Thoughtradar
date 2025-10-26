
export interface Thought {
    id: number;
    text: string;
    author: string;
    timestamp: Date;
    vector: Map<string, number>;
    similarity: number;
    isGhost: boolean;
}

export interface Vector extends Map<string, number> {}

export interface TicketData {
    thought: Thought;
    summary: string;
    radarSnapshotUri: string;
}