import * as React from 'react';
import { useRef, useState } from 'react';

const imageResizerDirections = {
    east: 'e',
    north: 'n',
    northEast: 'ne',
    northWest: 'nw',
    south: 's',
    southEast: 'se',
    southWest: 'sw',
    west: 'w',
};

export default function ImageResizer({
    imageRef,
    onResizeEnd,
    lockAspectRatio
}: {
    imageRef: React.RefObject<HTMLImageElement | null>;
    onResizeEnd: (width: number, height: number) => void;
    lockAspectRatio: boolean;
}) {
    const [isResizing, setIsResizing] = useState(false);
    const startPos = useRef<{ x: number; y: number; w: number; h: number; ratio: number } | null>(null);

    const onPointerDown = (e: React.PointerEvent, dir: string) => {
        if (!imageRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const { width, height } = imageRef.current.getBoundingClientRect();
        startPos.current = {
            x: e.clientX,
            y: e.clientY,
            w: width,
            h: height,
            ratio: width / height
        };
        setIsResizing(true);

        const onPointerMove = (moveEvent: PointerEvent) => {
            if (!startPos.current || !imageRef.current) return;
            const dx = moveEvent.clientX - startPos.current.x;
            const dy = moveEvent.clientY - startPos.current.y;

            let nextWidth = startPos.current.w;
            let nextHeight = startPos.current.h;

            if (dir.includes('e')) nextWidth += dx;
            if (dir.includes('w')) nextWidth -= dx;
            if (dir.includes('s')) nextHeight += dy;
            if (dir.includes('n')) nextHeight -= dy;

            // Handle Aspect Ratio Lock (Prop, Shift or Ctrl)
            const shouldLockRatio = lockAspectRatio || moveEvent.shiftKey || moveEvent.ctrlKey;

            if (shouldLockRatio) {
                if (dir === 'e' || dir === 'w') {
                    nextHeight = nextWidth / startPos.current.ratio;
                } else if (dir === 's' || dir === 'n') {
                    nextWidth = nextHeight * startPos.current.ratio;
                } else {
                    // Corners
                    const ratio = startPos.current.ratio;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        nextHeight = nextWidth / ratio;
                    } else {
                        nextWidth = nextHeight * ratio;
                    }
                }
            }

            nextWidth = Math.max(50, nextWidth);
            nextHeight = Math.max(50, nextHeight);

            imageRef.current.style.width = `${nextWidth}px`;
            imageRef.current.style.height = `${nextHeight}px`;
        };

        const onPointerUp = () => {
            setIsResizing(false);
            if (imageRef.current) {
                const { width, height } = imageRef.current.getBoundingClientRect();
                onResizeEnd(width, height);
            }
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    };

    return (
        <div className={`absolute inset-0 pointer-events-none border-2 border-blue-500 rounded-sm ${isResizing ? 'opacity-100' : 'opacity-0 hover:opacity-100 transition-opacity'}`}>
            {Object.entries(imageResizerDirections).map(([key, dir]) => (
                <div
                    key={key}
                    onPointerDown={(e) => onPointerDown(e, dir)}
                    className={`absolute h-3 w-3 bg-blue-500 border border-white rounded-full pointer-events-auto cursor-${dir}-resize`}
                    style={{
                        top: dir.includes('n') ? -6 : dir.includes('s') ? 'auto' : '50%',
                        bottom: dir.includes('s') ? -6 : 'auto',
                        left: dir.includes('w') ? -6 : dir.includes('e') ? 'auto' : '50%',
                        right: dir.includes('e') ? -6 : 'auto',
                        transform: dir === 'e' || dir === 'w' || dir === 's' || dir === 'n' ? 'translate(-50%, -50%)' : 'none',
                        marginTop: dir === 'e' || dir === 'w' ? -6 : 0,
                        marginLeft: dir === 's' || dir === 'n' ? -6 : 0,
                    }}
                />
            ))}
        </div>
    );
}
