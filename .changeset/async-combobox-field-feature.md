---
'@baseplate-dev/ui-components': patch
---

Add AsyncComboboxField component with advanced async option loading

- **New AsyncComboboxField component**: Provides async option loading with debounced search, race condition protection, and delayed loading indicators to prevent flashing
- **ComboboxLoading component**: New loading state component that pairs with ComboboxEmpty for consistent async combobox experiences
- **useDebounce hook**: Utility hook for debouncing values to improve performance in async scenarios
- **Persistent selected values**: Selected options are cached and persist across searches, solving the common issue where selected values disappear when search results change
- **Optional value resolution**: Added `resolveValue` prop to fetch option details when values are set externally (useful for pre-populated forms)
- **Race condition protection**: Prevents stale results from overwriting newer search results
- **Configurable loading delay**: Prevents loading indicator flashing for fast API responses (default 200ms delay)
- **Comprehensive error handling**: Support for custom error formatting and graceful error states
- **React Hook Form integration**: Full support via AsyncComboboxFieldController with proper validation
- **Extensive Storybook examples**: Stories demonstrating all features including persistent values, error states, and loading behaviors

This component provides a production-ready async combobox solution that handles all the edge cases and UX considerations needed for real-world applications.
