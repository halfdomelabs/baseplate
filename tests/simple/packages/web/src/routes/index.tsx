import type { ReactElement } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { useGetBlogPostsQuery } from '@src/generated/graphql';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage(): ReactElement {
  const { data, error } = useGetBlogPostsQuery();

  if (!data) {
    return <ErrorableLoader error={error} />;
  }

  return (
    <div
      className="flex flex-col items-center space-y-4 p-4"
      data-testid="blog-list"
    >
      {data.blogPosts.map((post) => (
        <div className="border-gray-200 w-[200px] border p-4" key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content.slice(0, 100)}</p>
        </div>
      ))}
    </div>
  );
}
