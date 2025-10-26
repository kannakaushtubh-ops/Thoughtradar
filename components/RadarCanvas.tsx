
import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { Thought } from '../types';

interface RadarCanvasProps {
    thoughts: Thought[];
    onSelectThought: (thought: Thought | null) => void;
    selectedThoughtId: number | null;
}

export const RadarCanvas = forwardRef<HTMLCanvasElement, RadarCanvasProps>(({ thoughts, onSelectThought, selectedThoughtId }, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>();

    // Expose the internal canvas ref to the parent component
    useImperativeHandle(ref, () => internalCanvasRef.current!);

    useEffect(() => {
        const canvas = internalCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const { width, height } = canvas.getBoundingClientRect();
            canvas.width = width * devicePixelRatio;
            canvas.height = height * devicePixelRatio;
            ctx.scale(devicePixelRatio, devicePixelRatio);
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let rotation = 0;
        const pulseState = { radius: 0, alpha: 1 };

        const draw = () => {
            resizeCanvas();
            const { width, height } = canvas.getBoundingClientRect();
            const center = { x: width / 2, y: height / 2 };
            const radius = Math.min(width, height) / 2 * 0.9;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#111827'; // bg-gray-900
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw radar grid
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            [0.25, 0.5, 0.75, 1].forEach(r => {
                ctx.beginPath();
                ctx.arc(center.x, center.y, radius * r, 0, 2 * Math.PI);
                ctx.stroke();
            });

            // Draw radar sweep
            rotation += 0.01;
            const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
            gradient.addColorStop(0.8, 'rgba(0, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            ctx.save();
            ctx.translate(center.x, center.y);
            ctx.rotate(rotation);
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.arc(0,0, radius, -Math.PI/4, Math.PI/4);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();

            // Draw thoughts
            const newestVisibleThought = thoughts.find(t => !t.isGhost);
            thoughts.slice().reverse().forEach((thought, index) => {
                if(thought.isGhost) return; // Do not draw ghost thoughts

                const angle = (index / (thoughts.length || 1)) * 2 * Math.PI + (Math.PI / 4);
                // Inverse similarity: higher similarity = closer to center
                const distance = (1 - thought.similarity) * radius;
                
                const x = center.x + Math.cos(angle) * distance;
                const y = center.y + Math.sin(angle) * distance;

                const recency = 1 - Math.min(index / 20, 1); // Opacity fades for older thoughts
                
                const isSelected = thought.id === selectedThoughtId;

                ctx.beginPath();
                ctx.arc(x, y, isSelected ? 8 : 5, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(0, 255, 255, ${0.5 * recency})`;
                ctx.fill();
                
                if (isSelected) {
                    ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                if (thought.id === newestVisibleThought?.id) {
                    pulseState.radius += 0.5;
                    pulseState.alpha -= 0.02;

                    if (pulseState.alpha <= 0) {
                        pulseState.radius = 0;
                        pulseState.alpha = 1;
                    }

                    ctx.beginPath();
                    ctx.arc(x, y, 5 + pulseState.radius, 0, 2 * Math.PI);
                    ctx.strokeStyle = `rgba(0, 255, 255, ${pulseState.alpha})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            animationFrameId.current = requestAnimationFrame(draw);
        };
        draw();

        const handleClick = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;
            const center = { x: rect.width / 2, y: rect.height / 2 };
            const radius = Math.min(rect.width, rect.height) / 2 * 0.9;
            
            let clickedThought = null;
            let minDistance = 15; // Click radius

            thoughts.forEach((thought, index) => {
                if (thought.isGhost) return; // Cannot click ghost thoughts

                const angle = (index / (thoughts.length || 1)) * 2 * Math.PI + (Math.PI / 4);
                const distOnCanvas = (1 - thought.similarity) * radius;
                const x = center.x + Math.cos(angle) * distOnCanvas;
                const y = center.y + Math.sin(angle) * distOnCanvas;

                const clickDistance = Math.sqrt((clickX - x)**2 + (clickY - y)**2);
                if(clickDistance < minDistance) {
                    minDistance = clickDistance;
                    clickedThought = thought;
                }
            });
            onSelectThought(clickedThought);
        };
        canvas.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('click', handleClick);
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [thoughts, selectedThoughtId, onSelectThought]);

    return (
        <div className="w-full h-full bg-gray-900 rounded-lg border border-gray-700 relative">
            <canvas ref={internalCanvasRef} className="w-full h-full" />
            <div className="absolute top-2 left-2 text-xs text-gray-500 font-mono-ibm">SEMANTIC PROXIMITY</div>
        </div>
    );
});