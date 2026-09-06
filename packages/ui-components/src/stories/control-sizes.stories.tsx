import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement, ReactNode } from 'react';

import { Button } from '#src/components/ui/button/button.js';
import { ComboboxField } from '#src/components/ui/combobox-field/combobox-field.js';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxInput,
} from '#src/components/ui/combobox/combobox.js';
import { InputField } from '#src/components/ui/input-field/input-field.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#src/components/ui/input-group/input-group.js';
import {
  InputOtp,
  InputOtpSlot,
} from '#src/components/ui/input-otp/input-otp.js';
import { Input } from '#src/components/ui/input/input.js';
import { NumberField } from '#src/components/ui/number-field/number-field.js';
import { SelectField } from '#src/components/ui/select-field/select-field.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#src/components/ui/select/select.js';
import { TextareaField } from '#src/components/ui/textarea-field/textarea-field.js';
import { Textarea } from '#src/components/ui/textarea/textarea.js';

type ControlSize = 'sm' | 'default' | 'xl';

const SIZES: ControlSize[] = ['sm', 'default', 'xl'];
const OPTIONS = ['One', 'Two', 'Three'];
const SELECT_OPTIONS = OPTIONS.map((label) => ({ label, value: label }));

/**
 * Every control that carries a `size`, at each supported value. Cells are
 * addressable as `[data-control][data-tier]` so a browser pass can measure
 * heights and embedded-action targets without depending on internal markup.
 */
function Row({
  label,
  render,
}: {
  label: string;
  render: (size: ControlSize) => ReactNode;
}): ReactElement {
  return (
    <>
      <div className="self-center text-sm text-muted-foreground">{label}</div>
      {SIZES.map((size) => (
        <div key={size} data-control={label} data-tier={size}>
          {render(size)}
        </div>
      ))}
    </>
  );
}

function Grid({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="grid w-full max-w-4xl grid-cols-[9rem_1fr_1fr_1fr] items-start gap-4 p-4">
      <div />
      {SIZES.map((size) => (
        <div key={size} className="text-sm font-medium">
          {size}
        </div>
      ))}
      {children}
    </div>
  );
}

function Primitives(): ReactElement {
  return (
    <Grid>
      <Row
        label="button"
        render={(size) => <Button size={size}>Save</Button>}
      />
      <Row
        label="button-icon"
        render={(size) => (
          <Button size={size === 'default' ? 'icon' : `icon-${size}`}>+</Button>
        )}
      />
      <Row
        label="input"
        render={(size) => <Input size={size} placeholder="Text" />}
      />
      <Row
        label="textarea"
        render={(size) => <Textarea size={size} placeholder="Text" />}
      />
      <Row
        label="input-otp"
        render={(size) => (
          <InputOtp size={size} length={4}>
            {Array.from({ length: 4 }, (_, index) => (
              <InputOtpSlot key={index} />
            ))}
          </InputOtp>
        )}
      />
    </Grid>
  );
}

function Compounds(): ReactElement {
  return (
    <Grid>
      <Row
        label="select"
        render={(size) => (
          <Select defaultValue="One">
            <SelectTrigger size={size}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent size={size}>
              {OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <Row
        label="input-group"
        render={(size) => (
          <InputGroup size={size}>
            <InputGroupInput placeholder="Search" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs">x</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        )}
      />
      <Row
        label="combobox"
        render={(size) => (
          <Combobox items={OPTIONS}>
            <ComboboxInput size={size} showClear placeholder="Pick one" />
          </Combobox>
        )}
      />
      <Row
        label="combobox-chips"
        render={(size) => (
          <Combobox multiple items={OPTIONS} defaultValue={['One']}>
            <ComboboxChips size={size}>
              <ComboboxChip>One</ComboboxChip>
              <ComboboxChipsInput placeholder="Add" />
            </ComboboxChips>
          </Combobox>
        )}
      />
    </Grid>
  );
}

/** Labels and descriptions keep their own typography at every size. */
function FieldWrappers(): ReactElement {
  return (
    <Grid>
      <Row
        label="input-field"
        render={(size) => (
          <InputField size={size} label="Name" description="Your full name" />
        )}
      />
      <Row
        label="textarea-field"
        render={(size) => (
          <TextareaField size={size} label="Bio" description="A short bio" />
        )}
      />
      <Row
        label="select-field"
        render={(size) => (
          <SelectField
            size={size}
            label="Role"
            description="Pick one"
            options={SELECT_OPTIONS}
          />
        )}
      />
      <Row
        label="combobox-field"
        render={(size) => (
          <ComboboxField
            size={size}
            label="Team"
            description="Search teams"
            options={SELECT_OPTIONS}
          />
        )}
      />
      <Row
        label="number-field"
        render={(size) => (
          <NumberField size={size} label="Count" description="How many" />
        )}
      />
    </Grid>
  );
}

const meta = {
  title: 'stories/Control Sizes',
  component: Primitives,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Primitives>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PrimitiveControls: Story = {};
export const CompoundControls: Story = { render: () => <Compounds /> };
export const FieldWrapperControls: Story = { render: () => <FieldWrappers /> };
