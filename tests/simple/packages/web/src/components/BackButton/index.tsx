import type { ReactElement } from 'react';

import { MdArrowBack } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import LinkButton from '../LinkButton';

interface Props {
  className?: string;
  href?: string;
}

function BackButton({ className, href }: Props): ReactElement {
  const navigate = useNavigate();

  return (
    <LinkButton
      className={className}
      onClick={() => {
        if (href) {
          navigate(href);
        } else {
          navigate(-1);
        }
      }}
    >
      <MdArrowBack className="h-6 w-6 text-gray-600" />
      <span className="sr-only">Back</span>
    </LinkButton>
  );
}

export default BackButton;
