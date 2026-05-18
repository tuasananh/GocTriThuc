import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import type { MathfieldElement } from 'mathlive';
import { useEffect, useRef, createElement } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
const MathBlockRenderer = (props: {
  block: { props: { latex?: string } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: { focus: () => void; updateBlock: (block: any, update: any) => void };
}) => {
  const latex = props.block.props.latex ?? '';
  const ref = useRef<MathfieldElement>(null);

  useEffect(() => {
    const mathField = ref.current;
    if (!mathField) return;

    if (!props.block.props.latex) {
      setTimeout(() => mathField.focus(), 50);
    }

    const handleMoveOut = () => {
      mathField.blur();
      props.editor.focus();
    };

    mathField.addEventListener('move-out', handleMoveOut);
    return () => {
      mathField.removeEventListener('move-out', handleMoveOut);
    };
  }, [props.editor, props.block.props.latex]);

  return (
    <div className="w-full flex justify-center py-4 my-2 rounded-md" data-math-block="true">
      {createElement(
        'math-field',
        {
          ref,
          onInput: (evt: Event) => {
            const target = evt.target as HTMLInputElement | null;
            const value = target && 'value' in target ? (target.value as string) : '';
            props.editor.updateBlock(props.block, {
              type: 'mathBlock',
              props: { latex: value || '' },
            });
          },
          style: {
            width: '100%',
            minHeight: '3em',
            padding: '0.5em',
            fontSize: '1.2em',
            color: 'inherit',
            background: 'transparent',
            outline: 'none',
            border: 'none',
          },
        },
        latex,
      )}
    </div>
  );
};

export const MathBlock = createReactBlockSpec(
  {
    type: 'mathBlock',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      latex: {
        default: '',
      },
    },
    content: 'none',
  } as const,
  {
    render: MathBlockRenderer,
    toExternalHTML: (props) => {
      return createElement(
        'div',
        {
          className: 'math-block-wrapper',
          style: { display: 'flex', justifyContent: 'center', padding: '1rem 0' },
        },
        createElement(
          'math-field',
          {
            'read-only': true,
            className: 'math-block-preview',
            style: { fontSize: '1.2em', width: '100%' },
          },
          props.block.props.latex,
        ),
      );
    },
  },
);
