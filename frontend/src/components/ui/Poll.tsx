import * as React from 'react';
import { useCallback, useMemo } from 'react';

export type Option = {
    text: string;
    votes: Array<number | string>;
    uid: string;
};

export type Options = ReadonlyArray<Option>;

export interface PollProps {
    question: string;
    options: Options;
    isEditable?: boolean;
    onQuestionChange?: (question: string) => void;
    onVote?: (option: Option) => void;
    onAddOption?: () => void;
    onDeleteOption?: (option: Option) => void;
    onOptionTextChange?: (option: Option, text: string) => void;
    className?: string;
}

function getTotalVotes(options: Options): number {
    return options.reduce((total, option) => total + option.votes.length, 0);
}

function PollOption({
    option,
    index,
    options,
    totalVotes,
    onVote,
    onDelete,
    onTextChange,
    disabled,
}: {
    option: Option;
    index: number;
    options: Options;
    totalVotes: number;
    onVote?: (option: Option) => void;
    onDelete?: (option: Option) => void;
    onTextChange?: (option: Option, text: string) => void;
    disabled: boolean;
}) {
    const percentage = totalVotes === 0 ? 0 : (option.votes.length / totalVotes) * 100;

    return (
        <div className="group relative flex flex-col gap-1 mb-2">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={option.text}
                    onChange={(e) => onTextChange?.(option, e.target.value)}
                    disabled={disabled}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-blue-500 focus:outline-none text-sm py-1 dark:text-zinc-200"
                />
                {!disabled && options.length > 2 && (
                    <button
                        onClick={() => onDelete?.(option)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete option"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                    </button>
                )}
            </div>
            <div
                className="relative h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 overflow-hidden cursor-pointer"
                onClick={() => !disabled && onVote?.(option)}
            >
                <div
                    className="absolute inset-y-0 left-0 bg-blue-500/20 dark:bg-blue-500/30 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                    <span className="text-zinc-700 dark:text-zinc-300">{option.votes.length} votes</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{Math.round(percentage)}%</span>
                </div>
            </div>
        </div>
    );
}

export const Poll: React.FC<PollProps> = ({
    question,
    options,
    isEditable = false,
    onQuestionChange,
    onVote,
    onAddOption,
    onDeleteOption,
    onOptionTextChange,
    className = "",
}) => {
    const totalVotes = useMemo(() => getTotalVotes(options), [options]);

    return (
        <div className={`p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow ${className}`}>
            <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => onQuestionChange?.(e.target.value)}
                    disabled={!isEditable}
                    placeholder="Ask a question..."
                    className="flex-1 bg-transparent font-semibold text-lg focus:outline-none dark:text-white"
                />
            </div>

            <div className="space-y-1">
                {options.map((option, index) => (
                    <PollOption
                        key={option.uid}
                        index={index}
                        option={option}
                        options={options}
                        totalVotes={totalVotes}
                        onVote={onVote}
                        onDelete={onDeleteOption}
                        onTextChange={onOptionTextChange}
                        disabled={!isEditable}
                    />
                ))}
            </div>

            {isEditable && (
                <button
                    onClick={onAddOption}
                    className="mt-3 w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors border border-dashed border-blue-200 dark:border-blue-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" /><path d="M12 5v14" />
                    </svg>
                    Add Option
                </button>
            )}

            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{totalVotes} total votes</span>
                {!isEditable && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">View only</span>
                )}
            </div>
        </div>
    );
};
