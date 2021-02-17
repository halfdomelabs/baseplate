import { Message } from '../Message';
import React from 'react';
import { Loader } from '../Loader';

interface Props {
  error?: Error | string;
}

export const ErrorableLoader: React.FC<Props> = ({ error }) => {
  if (error) {
    return (
      <Message type="error">
        {typeof error === 'string'
          ? error
          : `We encountered an error loading the data: ${error.toString()}`}
      </Message>
    );
  }
  return <Loader />;
};
