import clsx from 'clsx';
import React from 'react';
import { Link } from 'react-router-dom';

const Container = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={clsx(
      'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      className,
    )}
    {...props}
  />
));
Container.displayName = 'TabNavigation.Container';

const NavLink = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link> & { isActive: boolean }
>(({ isActive, ...props }, ref) => (
  <Link
    ref={ref}
    className={clsx(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      isActive ? 'bg-background text-foreground shadow' : '',
    )}
    {...props}
  />
));
NavLink.displayName = 'TabNavigation.Link';

export const TabNavigation = {
  Container: Container,
  Link: NavLink,
};
