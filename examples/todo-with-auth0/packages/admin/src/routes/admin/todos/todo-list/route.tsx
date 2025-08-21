import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  /* TPL_ROUTE:START */ '/admin/todos/todo-list' /* TPL_ROUTE:END */,
)({
  loader: () => ({
    crumb: /* TPL_CRUMB:START */ 'Todo Lists' /* TPL_CRUMB:END */,
  }),
});
