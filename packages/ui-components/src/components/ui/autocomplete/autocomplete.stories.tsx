import type { Meta, StoryObj } from '@storybook/react-vite';

import * as React from 'react';

import {
  Autocomplete,
  AutocompleteCollection,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteLabel,
  AutocompleteList,
  AutocompleteStatus,
  useAutocompleteFilter,
} from './autocomplete.js';

const languages = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Rust',
  'Go',
  'Ruby',
  'Java',
  'C#',
  'Swift',
  'Kotlin',
  'Elixir',
] as const;

const meta: Meta<typeof Autocomplete> = {
  title: 'components/Autocomplete',
  component: Autocomplete,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Autocomplete items={languages}>
        <AutocompleteInput placeholder="Search languages..." />
        <AutocompleteContent>
          <AutocompleteEmpty>No results found.</AutocompleteEmpty>
          <AutocompleteList>
            {(item: string) => (
              <AutocompleteItem key={item} value={item}>
                {item}
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
    </div>
  ),
};

export const WithClear: Story = {
  render: () => (
    <div className="w-80">
      <Autocomplete items={languages}>
        <AutocompleteInput placeholder="Search languages..." showClear />
        <AutocompleteContent>
          <AutocompleteEmpty>No results found.</AutocompleteEmpty>
          <AutocompleteList>
            {(item: string) => (
              <AutocompleteItem key={item} value={item}>
                {item}
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
    </div>
  ),
};

interface City {
  id: string;
  name: string;
  country: string;
}

const cities: City[] = [
  { id: '1', name: 'Tokyo', country: 'Japan' },
  { id: '2', name: 'New York', country: 'United States' },
  { id: '3', name: 'London', country: 'United Kingdom' },
  { id: '4', name: 'Paris', country: 'France' },
  { id: '5', name: 'Berlin', country: 'Germany' },
  { id: '6', name: 'Sydney', country: 'Australia' },
  { id: '7', name: 'Toronto', country: 'Canada' },
  { id: '8', name: 'Seoul', country: 'South Korea' },
  { id: '9', name: 'São Paulo', country: 'Brazil' },
  { id: '10', name: 'Mumbai', country: 'India' },
  { id: '11', name: 'Cairo', country: 'Egypt' },
  { id: '12', name: 'Mexico City', country: 'Mexico' },
  { id: '13', name: 'Bangkok', country: 'Thailand' },
  { id: '14', name: 'Istanbul', country: 'Turkey' },
  { id: '15', name: 'Lagos', country: 'Nigeria' },
];

async function searchCities(
  query: string,
  filter: (item: string, query: string) => boolean,
): Promise<{ cities: City[]; error: string | null }> {
  await new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 400 + 100);
  });

  if (query === 'error') {
    return {
      cities: [],
      error: 'Failed to fetch cities. Please try again.',
    };
  }

  return {
    cities: cities.filter(
      (city) => filter(city.name, query) || filter(city.country, query),
    ),
    error: null,
  };
}

function AsyncAutocompleteExample(): React.ReactElement {
  const [searchValue, setSearchValue] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<City[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const { contains } = useAutocompleteFilter();
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [open, setIsOpen] = React.useState(false);

  function getStatus(): React.ReactNode | null {
    if (isPending) {
      return 'Searching…';
    }
    if (error) {
      return error;
    }
    if (searchValue === '') {
      return null;
    }
    if (searchResults.length === 0) {
      return `No cities matching "${searchValue}"`;
    }
    return `${searchResults.length} result${searchResults.length === 1 ? '' : 's'} found`;
  }

  const status = getStatus();

  return (
    <div className="w-80">
      <Autocomplete
        items={searchResults}
        filteredItems={searchResults}
        open={
          open &&
          !(isPending && searchResults.length === 0) &&
          searchValue !== ''
        }
        onOpenChange={setIsOpen}
        value={searchValue}
        onValueChange={(nextValue) => {
          setSearchValue(nextValue);

          const controller = new AbortController();
          abortControllerRef.current?.abort();
          abortControllerRef.current = controller;

          if (nextValue === '') {
            setSearchResults([]);
            setError(null);
            return;
          }

          startTransition(async () => {
            setError(null);
            const result = await searchCities(nextValue, contains);
            if (controller.signal.aborted) {
              return;
            }
            startTransition(() => {
              setSearchResults(result.cities);
              setError(result.error);
            });
          });
        }}
        itemToStringValue={(item) => item.name}
      >
        <AutocompleteInput
          placeholder="Search cities or countries..."
          showSpinner={isPending && open}
        />
        <AutocompleteContent>
          <AutocompleteStatus className="sr-only">{status}</AutocompleteStatus>
          {isPending ? null : (
            <AutocompleteEmpty>
              {error ?? `No cities matching "${searchValue}"`}
            </AutocompleteEmpty>
          )}
          <AutocompleteList>
            {(city: City) => (
              <AutocompleteItem key={city.id} value={city}>
                <div className="flex flex-col">
                  <span>{city.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {city.country}
                  </span>
                </div>
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
    </div>
  );
}

export const Async: Story = {
  render: () => <AsyncAutocompleteExample />,
};

interface ToolGroup {
  label: string;
  items: string[];
}

const toolGroups: ToolGroup[] = [
  {
    label: 'Frontend',
    items: ['React', 'Vue', 'Svelte', 'Angular'],
  },
  {
    label: 'Backend',
    items: ['Node.js', 'Django', 'Rails', 'Spring'],
  },
  {
    label: 'Database',
    items: ['PostgreSQL', 'MongoDB', 'Redis', 'SQLite'],
  },
];

export const Grouped: Story = {
  render: () => (
    <div className="w-80">
      <Autocomplete items={toolGroups}>
        <AutocompleteInput placeholder="Search tools..." />
        <AutocompleteContent>
          <AutocompleteEmpty>No tools found.</AutocompleteEmpty>
          <AutocompleteList>
            {(group: ToolGroup) => (
              <AutocompleteGroup key={group.label} items={group.items}>
                <AutocompleteLabel>{group.label}</AutocompleteLabel>
                <AutocompleteCollection>
                  {(item: string) => (
                    <AutocompleteItem key={item} value={item}>
                      {item}
                    </AutocompleteItem>
                  )}
                </AutocompleteCollection>
              </AutocompleteGroup>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
    </div>
  ),
};
