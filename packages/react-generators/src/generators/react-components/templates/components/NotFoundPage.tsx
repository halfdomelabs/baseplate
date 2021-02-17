import React from 'react';
import styled from 'styled-components/macro';
import { Message } from './common';

const Wrapper = styled.div`
  width: 30rem;
  margin: 4rem auto 2rem;
`;

const NotFoundPage: React.FC = () => {
  return (
    <Wrapper>
      <Message type="error" header="Not Found">
        Sorry, we could not find the page you are looking for
      </Message>
    </Wrapper>
  );
};

export default NotFoundPage;
