import { createReactInlineContentSpec } from '@blocknote/react';
import type { MathfieldElement } from 'mathlive';
import { useEffect, useRef, createElement } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
const InlineMathRenderer = ({
  inlineContent,
  updateInlineContent,
  editor,
  contentRef,
}: {
  inlineContent: { props: { latex?: string } };
  updateInlineContent: (content: { type: 'inlineMath'; props: { latex: string } }) => void;
  editor: { focus: () => void };
  contentRef: React.Ref<HTMLSpanElement>;
}) => {
  const latex = inlineContent.props.latex ?? '';
  const ref = useRef<MathfieldElement>(null);

  useEffect(() => {
    const mathField = ref.current;
    if (!mathField) return;

    if (!inlineContent.props.latex) {
      setTimeout(() => mathField.focus(), 50);
    }

    const handleMoveOut = () => {
      mathField.blur();
      editor.focus();
    };

    mathField.addEventListener('move-out', handleMoveOut);
    return () => {
      mathField.removeEventListener('move-out', handleMoveOut);
    };
  }, [editor, inlineContent.props.latex]);

  return (
    <span ref={contentRef} className="inline-block rounded-sm">
      {createElement(
        'math-field',
        {
          ref,
          onInput: (evt: Event) => {
            const target = evt.target as HTMLInputElement | null;
            const value = target && 'value' in target ? (target.value as string) : '';
            updateInlineContent({
              type: 'inlineMath',
              props: {
                latex: value || '',
              },
            });
          },
          style: {
            minWidth: '20px',
            color: 'inherit',
            background: 'transparent',
            outline: 'none',
            border: 'none',
          },
        },
        latex,
      )}
    </span>
  );
};

export const InlineMath = createReactInlineContentSpec(
  {
    type: 'inlineMath',
    propSchema: {
      latex: {
        default: '',
      },
    },
    content: 'none',
  } as const,
  {
    render: InlineMathRenderer,
    toExternalHTML: (props) => {
      return createElement(
        'math-field',
        {
          'read-only': true,
          className: 'math-inline-preview',
        },
        props.inlineContent.props.latex,
      );
    },
  },
);
