import React from 'react';
import classNames from 'classnames';

interface Props {
  h1?: boolean;
  h2?: boolean;
  h3?: boolean;
  h4?: boolean;
  h5?: boolean;
  h6?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Title: React.FC<Props> = ({
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  children,
  className,
}) => {
  return (
    <p
      className={classNames(
        {
          title: true,
          'is-1': h1,
          'is-2': h2,
          'is-3': h3,
          'is-4': h4,
          'is-5': h5,
          'is-6': h6,
        },
        className
      )}
    >
      {children}
    </p>
  );
};
