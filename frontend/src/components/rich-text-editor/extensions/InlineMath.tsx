/* eslint-disable react-hooks/rules-of-hooks */
import { createReactInlineContentSpec } from "@blocknote/react";
import type { MathfieldElement } from "mathlive";
import { useLayoutEffect, useRef, createElement } from "react";



export const InlineMath = createReactInlineContentSpec(
  {
    type: "inlineMath",
    propSchema: {
      latex: {
        default: "",
      },
    },
    content: "none",
  } as const,
  {
    render: ({ inlineContent, updateInlineContent, editor, contentRef }) => {
      const latex = inlineContent.props.latex ?? "";
      const ref = useRef<MathfieldElement>(null);

      useLayoutEffect(() => {
        const mathField = ref.current;
        if (!mathField) return;

        if (!inlineContent.props.latex) {
          setTimeout(() => mathField.focus(), 50);
        }

        const handleMoveOut = (e: Event) => {
          const customEvent = e as CustomEvent<{direction: "forward" | "backward"}>;
          const pos = editor._tiptapEditor.view?.posAtDOM(mathField as Node, 0);
          if (pos === null || pos === undefined) {
            console.log("No pos found");
            return;
          }
          if (customEvent.detail.direction === "forward") {
            mathField.blur();
            editor._tiptapEditor.commands.focus(pos + 1);
          } else if (customEvent.detail.direction === "backward") {
            mathField.blur();
            editor._tiptapEditor.commands.focus(pos);
          }
        };

        mathField.addEventListener("move-out", handleMoveOut);
        return () => {
          mathField.removeEventListener("move-out", handleMoveOut);
        };
      }, [editor]);

      return (
        <span ref={contentRef} className="inline-block rounded-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
          {createElement(
            "math-field",
            {
              ref,
              onInput: (evt: Event) => {
                const target = evt.target as HTMLInputElement | null;
                const value = target && "value" in target ? (target.value as string) : "";
                updateInlineContent({
                  type: "inlineMath",
                  props: {
                    latex: value || "",
                  },
                });
              },
              style: { minWidth: '20px', color: 'inherit', background: 'transparent', outline: 'none', border: 'none' }
            },
            latex
          )}
        </span>
      );
    },
    toExternalHTML: (props) => {
      return createElement(
        "math-field",
        {
          "read-only": true,
          className: "math-inline-preview",
        },
        props.inlineContent.props.latex
      );
    },
  }
);
