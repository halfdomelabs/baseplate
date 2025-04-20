// @ts-nocheck

import { MdArrowBack } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import LinkButton from '../LinkButton/index.js';

interface Props {
  className?: string;
  href?: string;
}

function BackButton({ className, href }: Props): JSX.Element {
  const navigate = useNavigate();

  return (
    <LinkButton
      className={className}
      onClick={() => (href ? navigate(href) : navigate(-1))}
    >
      <MdArrowBack className="h-6 w-6 text-gray-600" />
      <span className="sr-only">Back</span>
    </LinkButton>
  );
}

export default BackButton;
