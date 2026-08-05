import * as React from 'react';

import { Link } from '../../components/link.js';
import { theme } from '../../constants/theme.js';

/**
 * A rendered content segment, mirroring the notification module's segment IR.
 * Kept structural so the email renders the same text/link formatting the in-app
 * feed shows.
 */
export type NotificationEmailSegment =
  | { kind: 'text'; text: string }
  | { kind: 'emphasis'; text: string }
  | { kind: 'link'; text: string; url: string };

/** Render one content segment (plain text, emphasized text, or a link). */
export function SegmentView({
  segment,
}: {
  segment: NotificationEmailSegment;
}): React.ReactElement {
  switch (segment.kind) {
    case 'link': {
      return <Link href={segment.url}>{segment.text}</Link>;
    }
    case 'emphasis': {
      return (
        <strong style={{ fontWeight: theme.typography.weights.semibold }}>
          {segment.text}
        </strong>
      );
    }
    case 'text': {
      return <>{segment.text}</>;
    }
  }
}

/** Render a segment array inline, as a title or body line. */
export function SegmentsView({
  segments,
}: {
  segments: NotificationEmailSegment[];
}): React.ReactElement {
  return (
    <>
      {segments.map((segment, index) => (
        <SegmentView key={index} segment={segment} />
      ))}
    </>
  );
}
