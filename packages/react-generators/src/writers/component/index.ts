import {
  TypescriptCodeBlock,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';

interface ReactComponent {
  name: string;
  body: TypescriptCodeBlock;
}

export function writeReactComponent({
  name,
  body,
}: ReactComponent): TypescriptCodeBlock {
  return TypescriptCodeUtils.formatBlock(
    `
function NAME(): JSX.Element {
  BODY;
}

export default NAME;
`,
    {
      NAME: name,
      BODY: body,
    },
  );
}
