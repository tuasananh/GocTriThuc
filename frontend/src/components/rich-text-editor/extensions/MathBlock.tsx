/* eslint-disable react-hooks/rules-of-hooks */
import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import type { MathfieldElement } from 'mathlive';
import { useLayoutEffect, useRef, createElement } from 'react';

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
    render: (props) => {
      const latex = props.block.props.latex ?? '';
      const ref = useRef<MathfieldElement>(null);

      useLayoutEffect(() => {
        const mathField = ref.current;
        if (!mathField) return;

        if (!props.block.props.latex) {
          setTimeout(() => mathField.focus(), 50);
        }

        const handleMoveOut = (e: Event) => {
          const customEvent = e as CustomEvent<{ direction: 'forward' | 'backward' }>;
          if (customEvent.detail.direction === 'forward') {
            mathField.blur();
            props.editor.focus(); // Simple focus for now
          } else if (customEvent.detail.direction === 'backward') {
            mathField.blur();
            props.editor.focus();
          }
        };

        mathField.addEventListener('move-out', handleMoveOut);
        return () => {
          mathField.removeEventListener('move-out', handleMoveOut);
        };
      }, [props.editor]);

      return (
        <div
          className="w-full flex justify-center py-4 my-2 rounded-md ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all"
          data-math-block="true"
        >
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
