
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ThoughtForm } from './components/ThoughtForm';
import { RadarCanvas } from './components/RadarCanvas';
import { PrintOverlay } from './components/PrintOverlay';
import { Ticket } from './components/Ticket';
import { useTfIdf } from './hooks/useTfIdf';
import type { Thought, TicketData } from './types';
import { summarizeThought } from './services/geminiService';
import { IconAlertTriangle, IconInfoCircle } from './components/Icons';

const App: React.FC = () => {
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [selectedThought, setSelectedThought] = useState<Thought | null>(null);
    const [lastPostTimestamps, setLastPostTimestamps] = useState<Map<string, number>>(new Map());
    const [error, setError] = useState<string | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [ticketData, setTicketData] = useState<TicketData | null>(null);

    const ticketRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { addDocument, calculateSimilarity, documents } = useTfIdf();

    const clearError = () => {
        if (error) {
            setError(null);
        }
    };

    const handleEmitThought = useCallback(async (text: string, author: string, isGhost: boolean) => {
        clearError();
        const normalizedAuthor = author.trim() || 'Anonymous';

        // Validation
        if (!text.trim()) {
            setError("Thought cannot be empty.");
            return;
        }
        const lastPost = lastPostTimestamps.get(normalizedAuthor);
        if (lastPost && Date.now() - lastPost < 3000) {
            setError("Please wait 3 seconds before emitting another thought.");
            return;
        }

        const newVector = addDocument(text);
        let maxSimilarity = 0;
        if (thoughts.length > 0) {
            thoughts.forEach(thought => {
                const similarity = calculateSimilarity(newVector, thought.vector);
                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                }
            });
        }
        
        if (maxSimilarity > 0.94) {
            setError("This thought is too similar to an existing one.");
            return;
        }

        const newThought: Thought = {
            id: Date.now(),
            text,
            author: normalizedAuthor,
            timestamp: new Date(),
            vector: newVector,
            similarity: thoughts.length > 0 ? maxSimilarity : 1,
            isGhost,
        };

        setThoughts(prev => [newThought, ...prev]);
        setLastPostTimestamps(new Map(lastPostTimestamps.set(normalizedAuthor, Date.now())));
        setSelectedThought(newThought.isGhost ? null : newThought);
        
        setIsPrinting(true);
        
        try {
            const summary = await summarizeThought(text);
            const radarSnapshotUri = canvasRef.current?.toDataURL('image/png') ?? '';

            setTicketData({ thought: newThought, summary, radarSnapshotUri });

        } catch (e) {
            console.error("Failed to generate summary or snapshot:", e);
            setError("Could not generate ticket summary.");
            const radarSnapshotUri = canvasRef.current?.toDataURL('image/png') ?? '';
            setTicketData({ thought: newThought, summary: 'Summary not available.', radarSnapshotUri });
        }

    }, [lastPostTimestamps, thoughts, addDocument, calculateSimilarity]);

    useEffect(() => {
        if (ticketData) {
            const timer = setTimeout(() => {
                generateTicketImage();
            }, 3000);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketData]);


    const generateTicketImage = async () => {
        if (!ticketRef.current || !ticketData) return;
        
        try {
            const canvas = await (window as any).html2canvas(ticketRef.current, {
                backgroundColor: null, 
                scale: 2,
            });
            const link = document.createElement('a');
            link.download = `thought-ticket-${ticketData.thought.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Failed to generate ticket image', err);
            setError('Failed to generate ticket image. Please try again.');
        } finally {
            setIsPrinting(false);
            setTicketData(null);
        }
    };


    const handleClearSession = () => {
        setThoughts([]);
        setSelectedThought(null);
        setLastPostTimestamps(new Map());
        documents.current = [];
        clearError();
    };
    
    const handleSelectThought = (thought: Thought | null) => {
        setSelectedThought(thought);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col p-4 lg:p-6 relative overflow-hidden">
            <PrintOverlay isVisible={isPrinting} />
            
            <header className="w-full max-w-7xl mx-auto mb-4 flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-bold text-cyan-400 font-mono-ibm">
                    Thought Radar
                    <span className="text-gray-400"> — Microblog</span>
                </h1>
            </header>

            <main className="flex-grow w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col space-y-6">
                   <ThoughtForm onEmit={handleEmitThought} onClear={handleClearSession} />
                   {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative flex items-start space-x-2" role="alert">
                            <IconAlertTriangle className="h-5 w-5 mt-0.5 text-red-400"/>
                            <div>
                                <strong className="font-bold">Error:</strong>
                                <span className="block sm:inline ml-2">{error}</span>
                            </div>
                            <button onClick={clearError} className="absolute top-0 bottom-0 right-0 px-4 py-3">&times;</button>
                        </div>
                    )}
                     <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-cyan-300 flex items-center"><IconInfoCircle className="h-5 w-5 mr-2" />Selected Thought</h3>
                        {selectedThought ? (
                            <div className="bg-gray-900 p-3 rounded-md">
                                <p className="text-gray-300 break-words">"{selectedThought.text}"</p>
                                <p className="text-right text-sm text-cyan-400 mt-2">- {selectedThought.author}</p>
                                <p className="text-right text-xs text-gray-500">{selectedThought.timestamp.toLocaleString()}</p>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">Click a blip on the radar to see details.</p>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-2 min-h-[400px] lg:min-h-0">
                    <RadarCanvas
                        ref={canvasRef}
                        thoughts={thoughts}
                        onSelectThought={handleSelectThought}
                        selectedThoughtId={selectedThought?.id || null}
                    />
                </div>
            </main>

            {ticketData && (
                <div className="absolute -left-[9999px] top-0">
                    <Ticket ref={ticketRef} data={ticketData} />
                </div>
            )}
        </div>
    );
};

export default App;