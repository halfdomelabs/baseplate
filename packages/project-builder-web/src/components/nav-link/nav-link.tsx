import type { LinkComponent } from '@tanstack/react-router';

import { createLink, Link } from '@tanstack/react-router';

const NavLinkComponent = createLink(Link);

/**
 * A link component that sets the `aria-current` attribute to `page` when the link is active.
 *
 * @param props - The props to pass to the link component.
 * @returns The link component.
 */
export const NavLink: LinkComponent<typeof Link> = (props) => (
  <NavLinkComponent {...props} />
);
