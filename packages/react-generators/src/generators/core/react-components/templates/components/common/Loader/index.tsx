import React from 'react';
import styled from 'styled-components/macro';

const LoaderWrapper = styled.div`
  height: 100%;
  width: 100%;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LoaderSpinner = styled.div`
  height: 80px;
  width: 80px;
`;

export const Loader: React.FC = () => {
  return (
    <LoaderWrapper>
      <LoaderSpinner className="is-loading" />
    </LoaderWrapper>
  );
};
