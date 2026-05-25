import { useState, useEffect } from 'react';
import { RichTextEditor } from '@/components/rich-text-editor';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

export function EditorTestPage() {
  const [exportedHtml, setExportedHtml] = useState<string>('');
  const storageKey = 'test-editor-save';

  useEffect(() => {
    if (exportedHtml) {
      const blocks = document.querySelectorAll('.rendered-preview pre code');
      blocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [exportedHtml]);

  const handleClearStorage = () => {
    localStorage.removeItem(storageKey);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background p-8 flex justify-center">
      <div className="max-w-5xl w-full">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">BlockNote Editor Test</h1>
            <p className="text-muted-foreground">
              Type <kbd className="px-2 py-1 bg-muted rounded">/inlinemath</kbd> to insert inline
              math or <kbd className="px-2 py-1 bg-muted rounded">/math</kbd> for a math block.
            </p>
          </div>
          <button
            onClick={handleClearStorage}
            className="px-3 py-1.5 text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors"
          >
            Clear Local Storage & Reload
          </button>
        </div>

        <RichTextEditor
          storageKey={storageKey}
          onChange={async (editor) => {
            const html = await editor.blocksToHTMLLossy(editor.document);
            setExportedHtml(html);
          }}
        />

        {exportedHtml && (
          <div className="mt-8 space-y-6">
            <div className="p-6 bg-muted/10 border border-border rounded-xl shadow-sm">
              <h2 className="text-md font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Exported HTML Output
              </h2>
              <div className="bg-background border border-border rounded-lg p-4 font-mono text-xs overflow-x-auto text-muted-foreground max-h-48 scrollbar-thin">
                {exportedHtml}
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-background">
              <div className="border-b border-border bg-muted/10 px-6 py-4 flex justify-between items-center">
                <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Article Preview
                </h3>
                <span className="text-xs text-muted-foreground bg-background px-2.5 py-1 border border-border rounded-full font-medium">
                  Inter Variable Font
                </span>
              </div>
              <div className="p-8 md:p-12 bg-background">
                <div
                  className="rendered-preview max-w-3xl mx-auto text-foreground"
                  dangerouslySetInnerHTML={{ __html: exportedHtml }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
