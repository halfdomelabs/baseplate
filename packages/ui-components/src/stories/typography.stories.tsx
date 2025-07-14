import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';

function Typography(): React.JSX.Element {
  return (
    <div className="space-y-4 py-4">
      <h1>Heading 1 (h1)</h1>
      <p className="text-style-lead">
        Some example lead text (.text-style-lead)
      </p>
      <p>
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Corrupti, ad
        nostrum nam animi, quas et magni aliquid sint esse tenetur voluptatem
        doloremque officiis eius deleniti harum eaque unde? Numquam, nam! (p)
      </p>
      <h2>Heading 2 (h2)</h2>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Quod, itaque
        modi! Nobis asperiores autem recusandae culpa soluta exercitationem
        repellendus blanditiis obcaecati, ipsum voluptas id laborum temporibus
        labore consequuntur numquam doloribus. (p)
      </p>
      <h3>Heading 3 (h3)</h3>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptate,
        pariatur exercitationem. Laborum, iure necessitatibus nisi corrupti at
        eaque dignissimos suscipit, ut amet aut consequatur deleniti obcaecati
        enim, blanditiis nostrum ab. (p)
      </p>
      <p className="text-style-large">
        Some large text for emphasis (.text-style-large)
      </p>
      <p className="text-style-small">
        Some small text hiding away (.text-style-small)
      </p>
      <p className="text-style-muted">
        Some muted text for descriptions and subtext (.text-style-muted)
      </p>
      <p className="text-style-prose">
        We can have prose text that can properly style links to{' '}
        <a href="https://www.google.com" target="_blank" rel="noreferrer">
          other pages
        </a>
        . By default, it formats the text similar to a paragraph.
        (.text-style-prose)
      </p>
    </div>
  );
}

const meta: Meta<typeof Typography> = {
  title: 'Typography',
  component: Typography,
  tags: ['!autodocs'],
};

export default meta;

export const Headings: StoryObj = {
  name: 'Typography',
  render: () => <Typography />,
};
