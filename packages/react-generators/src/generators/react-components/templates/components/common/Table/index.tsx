import React from 'react';
import classNames from 'classnames';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<Props> = ({ children, className }) => {
  return (
    <table className={classNames('table is-striped is-fullwidth', className)}>
      {children}
    </table>
  );
};
