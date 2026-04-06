import type React from 'react';

interface AppContentLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode;
}

export function AppContentLayout({
  header,
  children,
}: AppContentLayoutProps): React.ReactElement {
  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden">
      {header}
      <div
        className="mb-(--action-bar-height) flex flex-1 overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}
