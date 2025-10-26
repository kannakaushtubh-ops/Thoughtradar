
import React, { useState } from 'react';
import { IconSend, IconTrash } from './Icons';

interface ThoughtFormProps {
    onEmit: (text: string, author: string, isGhost: boolean) => void;
    onClear: () => void;
}

export const ThoughtForm: React.FC<ThoughtFormProps> = ({ onEmit, onClear }) => {
    const [text, setText] = useState('');
    const [author, setAuthor] = useState('');
    const [isGhost, setIsGhost] = useState(false);
    const charCount = text.length;
    const charLimit = 300;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onEmit(text, author, isGhost);
        setText('');
        setIsGhost(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg flex flex-col space-y-4">
            <div>
                <label htmlFor="thought" className="block text-sm font-medium text-gray-400 mb-1">Your Thought</label>
                <div className="relative">
                    <textarea
                        id="thought"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="What's resonating with you?"
                        maxLength={charLimit}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-none h-32"
                    />
                    <div className={`absolute bottom-2 right-2 text-xs ${charCount > charLimit - 20 ? 'text-red-400' : 'text-gray-500'}`}>
                        {charCount}/{charLimit}
                    </div>
                </div>
            </div>
            <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-400 mb-1">Your Name (Optional)</label>
                <input
                    type="text"
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200"
                />
            </div>
             <div className="flex items-center space-x-2">
                <input
                    id="ghost"
                    type="checkbox"
                    checked={isGhost}
                    onChange={(e) => setIsGhost(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-cyan-500 focus:ring-cyan-600"
                />
                <label htmlFor="ghost" className="text-sm text-gray-400 select-none">
                    Emit as Ghost <span className="text-gray-500 hidden sm:inline">(invisible, affects others)</span>
                </label>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button type="submit" className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-transform transform hover:scale-105">
                    <IconSend className="w-5 h-5 mr-2"/>
                    Emit Thought
                </button>
                <button type="button" onClick={onClear} className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-red-700 text-base font-medium rounded-md shadow-sm text-red-300 bg-red-900/40 hover:bg-red-900/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors">
                     <IconTrash className="w-5 h-5 mr-2"/>
                    Clear Session
                </button>
            </div>
        </form>
    );
};