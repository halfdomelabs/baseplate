// @ts-nocheck

import { ErrorableLoader } from '%react-components';

function PAGE_NAME(): JSX.Element {
  const { data, error } = GET_ITEM_QUERY();
  const [DELETE_FUNCTION] = DELETE_MUTATION({
    refetchQueries: [{ query: REFETCH_DOCUMENT }],
  });

  const handleDeleteItem = async (item: ROW_FRAGMENT_NAME): Promise<void> => {
    await DELETE_FUNCTION({
      variables: { input: { id: item.id } },
    });
  };

  return (
    <div className="space-y-4">
      <h1>PLURAL_MODEL</h1>
      <CREATE_BUTTON />
      {!data ? <ErrorableLoader error={error} /> : <TABLE_COMPONENT />}
    </div>
  );
}

export default PAGE_NAME;
