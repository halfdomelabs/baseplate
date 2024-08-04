import { ErrorableLoader } from '@src/components';
import { useGetBlogPostsQuery } from '@src/generated/graphql';

export function HomePage(): JSX.Element {
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
        <div className="w-[200px] border border-gray-200 p-4" key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content.substring(0, 100)}</p>
        </div>
      ))}
    </div>
  );
}
