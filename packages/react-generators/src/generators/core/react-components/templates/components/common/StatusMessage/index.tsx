import { Message } from '../Message';
import { Status } from 'hooks/status';
import React from 'react';

interface Props {
  status?: Status | null;
}

export const StatusMessage: React.FC<Props> = ({ status }) => {
  if (!status) {
    return null;
  }
  return <Message type={status.type}>{status.message}</Message>;
};
