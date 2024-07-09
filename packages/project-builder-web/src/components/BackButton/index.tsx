import { MdArrowBack } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import LinkButton from '../LinkButton';

interface Props {
  className?: string;
}

function BackButton({ className }: Props): JSX.Element {
  const navigate = useNavigate();

  return (
    <LinkButton className={className} onClick={() => navigate(-1)}>
      <MdArrowBack className="size-6 text-gray-600" />
      <span className="sr-only">Back</span>
    </LinkButton>
  );
}

export default BackButton;
