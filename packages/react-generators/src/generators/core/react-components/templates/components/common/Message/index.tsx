import React from 'react';
import classNames from 'classnames';

interface Props {
  type: 'error' | 'warning' | 'info' | 'success';
  header?: string;
  children: React.ReactNode;
}

export const Message: React.FC<Props> = ({ type, header, children }) => {
  return (
    <article
      className={classNames({
        message: true,
        'is-danger': type === 'error',
        'is-warning': type === 'warning',
        'is-info': type === 'info',
        'is-success': type === 'success',
      })}
    >
      {header && (
        <div className="message-header">
          <p>{header}</p>
        </div>
      )}
      <div className="message-body">{children}</div>
    </article>
  );
};
