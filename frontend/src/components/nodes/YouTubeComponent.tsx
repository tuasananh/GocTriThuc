import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import { ElementFormatType, NodeKey } from 'lexical';
import * as React from 'react';

type YouTubeComponentProps = Readonly<{
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  videoID: string;
}>;

export default function YouTubeComponent({
  format,
  nodeKey,
  videoID,
}: YouTubeComponentProps): React.JSX.Element {
  return (
    <BlockWithAlignableContents
      className={{
        base: 'relative mx-auto my-4',
        focus: 'ring-2 ring-blue-500 rounded-lg overflow-hidden',
      }}
      format={format}
      nodeKey={nodeKey}
    >
      <div className="aspect-video w-full overflow-hidden rounded-lg shadow-lg">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube-nocookie.com/embed/${videoID}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={true}
          title="YouTube video"
        />
      </div>
    </BlockWithAlignableContents>
  );
}
