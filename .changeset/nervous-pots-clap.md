---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/plugin-auth': patch
---

Generated apps no longer depend on sonner: toasts come from a Base UI `toast.tsx` component that the app owns, which stacks, swipes to dismiss, announces errors assertively, and sits bottom-right instead of top-center. Code that imported `toast` from `'sonner'` should import it from the generated components instead (`@/components/ui/toast`, or the shared component library in library mode).
