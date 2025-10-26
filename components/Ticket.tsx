
import React, { forwardRef } from 'react';
import type { TicketData } from '../types';
import { IconRadar } from './Icons';

interface TicketProps {
    data: TicketData;
}

export const Ticket = forwardRef<HTMLDivElement, TicketProps>(({ data }, ref) => {
    const { thought, summary, radarSnapshotUri } = data;

    return (
        <div ref={ref} className="w-[380px] bg-[#fefaf0] text-black font-mono-ibm shadow-lg p-1">
            <div className="border-2 border-gray-800 p-4 flex flex-col space-y-4 relative">
                {/* Perforations */}
                <div className="absolute top-0 left-1/4 h-full w-px bg-[repeating-linear-gradient(to_bottom,transparent,transparent_4px,#aaa_4px,#aaa_8px)]"></div>

                <header className="flex justify-between items-center border-b-2 border-dashed border-gray-400 pb-2">
                    <div className="flex items-center space-x-2">
                        <IconRadar className="h-8 w-8 text-cyan-700"/>
                        <h2 className="text-xl font-bold">THOUGHT RADAR</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-xs">TICKET#</p>
                        <p className="font-bold text-lg">{thought.id}</p>
                    </div>
                </header>

                <div className="flex space-x-2">
                    <div className="w-3/4 flex flex-col space-y-4">
                        <div>
                            <p className="text-xs text-gray-600">EMITTED BY:</p>
                            <p className="font-bold text-lg">{thought.author}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">FULL THOUGHT:</p>
                            <p className="text-sm break-words">"{thought.text}"</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">RESONANCE:</p>
                            <p className="font-bold text-red-600 text-lg">{summary}</p>
                        </div>
                    </div>
                    <div className="w-1/4">
                        <p className="text-xs text-gray-600 text-center">SNAPSHOT</p>
                        <div className="w-full aspect-square border border-gray-400 mt-1 p-0.5">
                            {radarSnapshotUri && <img src={radarSnapshotUri} alt="Radar Snapshot" className="w-full h-full object-cover"/>}
                        </div>
                    </div>
                </div>

                <footer className="border-t-2 border-dashed border-gray-400 pt-2 flex justify-between items-end">
                    <div>
                        <p className="text-xs">{thought.timestamp.toLocaleDateString()}</p>
                        <p className="text-xs">{thought.timestamp.toLocaleTimeString()}</p>
                        <p className="text-[10px] uppercase mt-2">Digital Resonance - Not Valid for Travel</p>
                    </div>
                    <div className="h-8 w-16 bg-[repeating-linear-gradient(to_right,#000,#000_2px,transparent_2px,transparent_4px)]"></div>
                </footer>
            </div>
        </div>
    );
});
