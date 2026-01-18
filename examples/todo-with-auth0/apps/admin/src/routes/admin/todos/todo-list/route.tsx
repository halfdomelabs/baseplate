import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/todos/todo-list' /* TPL_ROUTE_PATH:END */,
)({
  loader: () => ({
    crumb: /* TPL_CRUMB:START */ 'Todo Lists' /* TPL_CRUMB:END */,
  }),
});
