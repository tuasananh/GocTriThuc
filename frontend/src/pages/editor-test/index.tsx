import { useState } from 'react';
import { RichTextEditor } from '@/components/rich-text-editor';

export function EditorTestPage() {
  const [exportedHtml, setExportedHtml] = useState<string>('');
  const storageKey = 'test-editor-save';

  const handleClearStorage = () => {
    localStorage.removeItem(storageKey);
    window.location.reload();
  };

  return (
    <div className="dark min-h-screen bg-background p-8 flex justify-center">
      <div className="max-w-5xl w-full">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">BlockNote Editor Test</h1>
            <p className="text-muted-foreground">
              Type <kbd className="px-2 py-1 bg-muted rounded">/inlinemath</kbd> to insert inline math or <kbd className="px-2 py-1 bg-muted rounded">/math</kbd> for a math block.
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
          onExport={(html) => setExportedHtml(html)} 
        />

        {exportedHtml && (
          <div className="mt-8 p-4 bg-muted/20 border border-border rounded-xl">
            <h2 className="text-lg font-semibold text-foreground mb-4">Exported HTML (Lossy)</h2>
            <div className="bg-background border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto text-muted-foreground">
              {exportedHtml}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Rendered Preview:</h3>
              <div 
                className="bg-background border border-border rounded-lg p-4 text-foreground"
                dangerouslySetInnerHTML={{ __html: exportedHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
