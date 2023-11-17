// @ts-nocheck

import classNames from 'classnames';

// adapted from https://flowbite.com/docs/typography/lists/#description-list

interface Props {
  className?: string;
  children?: React.ReactNode;
}

function DescriptionList({ className, children }: Props): JSX.Element {
  return (
    <dl
      className={classNames(
        'grid md:grid-cols-[minmax(100px,_1fr)_2fr]',
        className,
      )}
    >
      {children}
    </dl>
  );
}

interface DescriptionListItemProps {
  className?: string;
  children: React.ReactNode;
  label: string | React.ReactNode;
}

DescriptionList.Item = function DescriptionListItem({
  children,
  label,
}: DescriptionListItemProps): JSX.Element {
  return (
    <>
      <dt className="col-start-1 mt-2  text-gray-500 first-of-type:mt-0 first-of-type:border-t-0 md:mt-0 md:border-t md:py-4 md:pr-2">
        {label}
      </dt>
      <dd className="first-of-type:border-t-0 md:border-t md:py-4">
        {children}
      </dd>
    </>
  );
};

export default DescriptionList;
