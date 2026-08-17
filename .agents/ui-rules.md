## UI Development Guidelines

- **Component Library**: Use ShadCN-based components from `@baseplate-dev/ui-components`
  - This package contains a customized variation of ShadCN components
  - Always prefer these components over creating custom ones
- **Styling**: Use Tailwind CSS utilities exclusively
  - Avoid writing custom CSS classes
  - Use Tailwind's utility classes for all styling needs
  - In plugins, prefix all Tailwind classes with the plugin name (e.g., `auth-`, `storage-`)
- **Icons**: Use icons from `react-icons/md` (Material Design icons)
  - Import icons like: `import { MdAdd, MdDelete } from 'react-icons/md'`
  - Avoid using other icon libraries (lucide-react, heroicons, etc.)
  - If a specific icon is not available in `react-icons/md`, consult before using alternatives.

## Auth in generated apps

These apply to templates that render session-aware code in generated apps.

- **Route guards read auth from route context; components read it from `useSession()`.** Route matches are resolved data and can be one render stale, so a component that renders differently for signed-in and signed-out users must not source that from `Route.useRouteContext()`.
- **Never gate the app tree on a session transition.** Rendering a loader in place of `children` while a session refetches unmounts the router, destroying route state and replaying stale matches. Gate only before the first session is known, when nothing has mounted.
- **Do not key the router on the session** (`<RouterProvider key={userId}>`). It looks like a fix for a stale-session render and instead causes the unmount above.
- **Guards must not decide on a pending session.** While `session.isPending` is true neither the identity nor the roles are settled, so a guard that redirects or denies then will bounce a user who is in fact authorized. Return early and let the guard re-run when the session settles.
