import * as React from 'react';
import { useMemo, useRef, useState } from 'react';

interface ColorPickerProps {
    color: string;
    onChange?: (
        value: string,
        skipHistoryStack: boolean,
        skipRefocus: boolean,
    ) => void;
}

const basicColors = [
    '#d0021b',
    '#f5a623',
    '#f8e71c',
    '#8b572a',
    '#7ed321',
    '#417505',
    '#bd10e0',
    '#9013fe',
    '#4a90e2',
    '#50e3c2',
    '#b8e986',
    '#000000',
    '#4a4a4a',
    '#9b9b9b',
    '#ffffff',
];

const WIDTH = 214;
const HEIGHT = 150;

interface Position {
    x: number;
    y: number;
}

interface RGB {
    r: number;
    g: number;
    b: number;
}

interface HSV {
    h: number;
    s: number;
    v: number;
}

interface Color {
    hex: string;
    hsv: HSV;
    rgb: RGB;
}

function clamp(value: number, max: number, min: number) {
    return value > max ? max : value < min ? min : value;
}

function toHex(value: string): string {
    if (!value.startsWith('#')) {
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx) {
            throw new Error('2d context not supported');
        }
        ctx.fillStyle = value;
        return ctx.fillStyle;
    } else if (value.length === 4 || value.length === 5) {
        value = value
            .split('')
            .map((v, i) => (i ? v + v : '#'))
            .join('');
        return value;
    } else if (value.length === 7 || value.length === 9) {
        return value;
    }
    return '#000000';
}

function hex2rgb(hex: string): RGB {
    hex = toHex(hex);
    const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    if (!match) {
        return { r: 0, g: 0, b: 0 };
    }
    return {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
    };
}

function rgb2hsv({ r, g, b }: RGB): HSV {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    const h = d
        ? (max === r
            ? (g - b) / d + (g < b ? 6 : 0)
            : max === g
                ? 2 + (b - r) / d
                : 4 + (r - g) / d) * 60
        : 0;
    const s = max ? (d / max) * 100 : 0;
    const v = max * 100;
    return { h, s, v };
}

function hsv2rgb({ h, s, v }: HSV): RGB {
    s /= 100;
    v /= 100;
    const i = ~~(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - s * f);
    const t = v * (1 - s * (1 - f));
    const index = i % 6;
    const r = Math.round([v, q, p, p, t, v][index] * 255);
    const g = Math.round([t, v, v, q, p, p][index] * 255);
    const b = Math.round([p, p, t, v, v, q][index] * 255);
    return { r, g, b };
}

function rgb2hex({ r, g, b }: RGB): string {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function transformColor<M extends keyof Color, C extends Color[M]>(
    format: M,
    color: C,
): Color {
    let hex: Color['hex'] = toHex('#121212');
    let rgb: Color['rgb'] = hex2rgb(hex);
    let hsv: Color['hsv'] = rgb2hsv(rgb);

    if (format === 'hex') {
        const value = color as Color['hex'];
        hex = toHex(value);
        rgb = hex2rgb(hex);
        hsv = rgb2hsv(rgb);
    } else if (format === 'rgb') {
        const value = color as Color['rgb'];
        rgb = value;
        hex = rgb2hex(rgb);
        hsv = rgb2hsv(rgb);
    } else if (format === 'hsv') {
        const value = color as Color['hsv'];
        hsv = value;
        rgb = hsv2rgb(hsv);
        hex = rgb2hex(rgb);
    }
    return { hex, hsv, rgb };
}

function MoveWrapper({
    className,
    style,
    onChange,
    children,
}: {
    className?: string;
    style?: React.CSSProperties;
    onChange: (position: Position) => void;
    children: React.ReactNode;
}) {
    const divRef = useRef<HTMLDivElement>(null);

    const move = (e: React.MouseEvent | MouseEvent): void => {
        if (divRef.current) {
            const { current: div } = divRef;
            const { width, height, left, top } = div.getBoundingClientRect();
            const x = clamp(e.clientX - left, width, 0);
            const y = clamp(e.clientY - top, height, 0);
            onChange({ x, y });
        }
    };

    const onMouseDown = (e: React.MouseEvent): void => {
        if (e.button !== 0) return;
        move(e);

        const onMouseMove = (_e: MouseEvent): void => {
            move(_e);
        };
        const onMouseUp = (_e: MouseEvent): void => {
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseUp, false);
            move(_e);
        };
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);
    };

    return (
        <div
            ref={divRef}
            className={className}
            style={style}
            onMouseDown={onMouseDown}
        >
            {children}
        </div>
    );
}

export default function ColorPicker({
    color,
    onChange,
}: Readonly<ColorPickerProps>) {
    const [selfColor, setSelfColor] = useState(transformColor('hex', color));
    const [inputColor, setInputColor] = useState(color);

    const saturationPosition = useMemo(
        () => ({
            x: (selfColor.hsv.s / 100) * WIDTH,
            y: ((100 - selfColor.hsv.v) / 100) * HEIGHT,
        }),
        [selfColor.hsv.s, selfColor.hsv.v],
    );

    const huePosition = useMemo(
        () => ({
            x: (selfColor.hsv.h / 360) * WIDTH,
        }),
        [selfColor.hsv.h],
    );

    const emitOnChange = (newColor: string, skipRefocus: boolean = false) => {
        if (onChange) {
            onChange(newColor, false, skipRefocus);
        }
    };

    const onSetHex = (hex: string) => {
        setInputColor(hex);
        if (/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
            const newColor = transformColor('hex', hex);
            setSelfColor(newColor);
            emitOnChange(hex);
        }
    };

    const onMoveSaturation = ({ x, y }: Position) => {
        const newHsv = {
            ...selfColor.hsv,
            s: (x / WIDTH) * 100,
            v: 100 - (y / HEIGHT) * 100,
        };
        const newColor = transformColor('hsv', newHsv);
        setSelfColor(newColor);
        setInputColor(newColor.hex);
        emitOnChange(newColor.hex);
    };

    const onMoveHue = ({ x }: Position) => {
        const newHsv = { ...selfColor.hsv, h: (x / WIDTH) * 360 };
        const newColor = transformColor('hsv', newHsv);
        setSelfColor(newColor);
        setInputColor(newColor.hex);
        emitOnChange(newColor.hex);
    };

    const onBasicColorClick = (e: React.MouseEvent, basicColor: string) => {
        // Prevent dropdown from closing
        e.stopPropagation();
        setInputColor(basicColor);
        const newColor = transformColor('hex', basicColor);
        setSelfColor(newColor);
        emitOnChange(basicColor);
    };

    React.useEffect(() => {
        // Sync with external color changes
        if (color !== selfColor.hex) {
            const newColor = transformColor('hex', color);
            setSelfColor(newColor);
            setInputColor(color);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [color]);

    return (
        <div className="color-picker-wrapper" style={{ width: WIDTH + 20 }}>
            {/* Basic Colors */}
            <div className="color-picker-basic-colors">
                {basicColors.map((basicColor) => (
                    <button
                        key={basicColor}
                        className="color-picker-basic-color"
                        style={{ backgroundColor: basicColor }}
                        onClick={(e) => onBasicColorClick(e, basicColor)}
                        type="button"
                        aria-label={`Color: ${basicColor}`}
                    />
                ))}
            </div>

            {/* Saturation Panel */}
            <MoveWrapper
                className="color-picker-saturation"
                style={{
                    backgroundColor: `hsl(${selfColor.hsv.h}, 100%, 50%)`,
                    width: WIDTH,
                    height: HEIGHT,
                }}
                onChange={onMoveSaturation}
            >
                <div
                    className="color-picker-cursor"
                    style={{
                        left: saturationPosition.x,
                        top: saturationPosition.y,
                    }}
                />
            </MoveWrapper>

            {/* Hue Slider */}
            <MoveWrapper
                className="color-picker-hue"
                style={{ width: WIDTH }}
                onChange={onMoveHue}
            >
                <div
                    className="color-picker-hue-cursor"
                    style={{ left: huePosition.x }}
                />
            </MoveWrapper>

            {/* Hex Input */}
            <div className="flex items-center gap-2 mt-2 px-1">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Hex</span>
                <input
                    className="flex-1 rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs outline-none focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                    type="text"
                    value={inputColor}
                    onChange={(e) => onSetHex(e.target.value)}
                />
                <div
                    className="h-5 w-5 rounded border border-zinc-300 dark:border-zinc-600"
                    style={{ backgroundColor: selfColor.hex }}
                />
            </div>
        </div>
    );
}
