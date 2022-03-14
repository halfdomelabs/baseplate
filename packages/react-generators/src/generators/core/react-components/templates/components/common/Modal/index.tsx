import React from 'react';
import classNames from 'classnames';

interface Props {
  active?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({ active, onClose, children, className }: Props) => {
  return (
    <div
      className={classNames(
        {
          modal: true,
          'is-active': active,
        },
        className
      )}
    >
      <div className="modal-background" onClick={onClose} />
      {children}
      <button
        className="modal-close is-large"
        onClick={onClose}
        aria-label="close"
      />
    </div>
  );
};

interface ModalContentProps {
  children: React.ReactNode;
}

Modal.Content = ({ children }: ModalContentProps) => {
  return (
    <div className="modal-content has-background-white p-4">{children}</div>
  );
};
