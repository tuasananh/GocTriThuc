import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import type { MathfieldElement } from 'mathlive';
import { useEffect, useRef, createElement } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
const MathBlockRenderer = (props: {
  block: { props: { latex?: string } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: {
    focus: () => void;
    updateBlock: (block: any, update: any) => void;
    isEditable: boolean;
  };
}) => {
  const latex = props.block.props.latex ?? '';
  const ref = useRef<MathfieldElement>(null);

  useEffect(() => {
    const mathField = ref.current;
    if (!mathField || !props.editor.isEditable) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (!props.block.props.latex) {
      timeoutId = setTimeout(() => mathField.focus(), 50);
    }

    const handleMoveOut = () => {
      mathField.blur();
      props.editor.focus();
    };

    mathField.addEventListener('move-out', handleMoveOut);
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      mathField.removeEventListener('move-out', handleMoveOut);
    };
  }, [props.editor, props.block.props.latex]);

  return (
    <div className="w-full flex justify-center py-1 rounded-md" data-math-block="true">
      <style>{`
        [data-math-block="true"] math-field::part(container) {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        [data-math-block="true"] math-field {
          --highlight-color: transparent;
        }
      `}</style>
      {createElement(
        'math-field',
        {
          ref,
          'read-only': !props.editor.isEditable || undefined,
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
    parse: (element) => {
      // Match the wrapper div produced by toExternalHTML
      if (
        element instanceof HTMLElement &&
        (element.classList.contains('math-block-wrapper') || element.hasAttribute('data-latex'))
      ) {
        const latex =
          element.getAttribute('data-latex') ??
          element.querySelector('[data-latex]')?.getAttribute('data-latex') ??
          element.textContent ??
          '';
        return { latex };
      }
      return undefined;
    },
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
