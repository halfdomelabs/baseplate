import type { Meta, StoryObj } from '@storybook/react';

function Typography(): JSX.Element {
  return (
    <div className="space-y-4">
      <h1>Heading 1</h1>
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam</p>
      <h2>Heading 2</h2>
      <p className="subheading">A subheading is here</p>
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam</p>
      <h3>Heading 3</h3>
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam</p>
      <h4>Heading 4</h4>
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam</p>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Iste cum,
        laudantium odit quos ut fuga reiciendis, voluptate est expedita dolores,
        vero aut minus autem cupiditate consectetur quibusdam quas nesciunt
        sapiente?
      </p>
      <p className="description-text">
        Some description goes here. Lorem ipsum dolor sit amet consectetur.
      </p>
      <div>
        <a href="https://www.google.com">I am a link!</a>
      </div>
    </div>
  );
}

const meta: Meta<typeof Typography> = {
  title: 'Typography',
  component: Typography,
};

export default meta;

export const Headings: StoryObj = {
  name: 'Typography',
  render: () => <Typography />,
};
