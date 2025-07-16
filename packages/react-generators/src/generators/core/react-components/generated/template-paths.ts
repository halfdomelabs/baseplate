import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactPathsProvider } from '#src/providers/react-paths.js';

export interface CoreReactComponentsPaths {
  alert: string;
  button: string;
  calendar: string;
  card: string;
  checkbox: string;
  checkboxField: string;
  circularProgress: string;
  cn: string;
  combobox: string;
  comboboxField: string;
  confirmDialog: string;
  datePickerField: string;
  dateTimePickerField: string;
  dialog: string;
  emptyDisplay: string;
  errorableLoader: string;
  errorDisplay: string;
  formItem: string;
  hooksUseControlledState: string;
  hooksUseControllerMerged: string;
  input: string;
  inputField: string;
  label: string;
  loader: string;
  mergeRefs: string;
  navigationMenu: string;
  notFoundCard: string;
  popover: string;
  scrollArea: string;
  select: string;
  selectField: string;
  sidebarLayout: string;
  stylesButton: string;
  stylesInput: string;
  stylesSelect: string;
  switchComponent: string;
  switchField: string;
  table: string;
  textarea: string;
  textareaField: string;
  toaster: string;
  typesForm: string;
  typesIcon: string;
  useConfirmDialog: string;
}

const coreReactComponentsPaths = createProviderType<CoreReactComponentsPaths>(
  'core-react-components-paths',
);

const coreReactComponentsPathsTask = createGeneratorTask({
  dependencies: {
    packageInfo: packageInfoProvider,
    reactPaths: reactPathsProvider,
  },
  exports: { coreReactComponentsPaths: coreReactComponentsPaths.export() },
  run({ packageInfo, reactPaths }) {
    const componentsRoot = reactPaths.getComponentsFolder();
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactComponentsPaths: {
          alert: `${componentsRoot}/ui/alert/alert.tsx`,
          button: `${componentsRoot}/ui/button/button.tsx`,
          calendar: `${componentsRoot}/ui/calendar/calendar.tsx`,
          card: `${componentsRoot}/ui/card/card.tsx`,
          checkbox: `${componentsRoot}/ui/checkbox/checkbox.tsx`,
          checkboxField: `${componentsRoot}/ui/checkbox-field/checkbox-field.tsx`,
          circularProgress: `${componentsRoot}/ui/circular-progress/circular-progress.tsx`,
          cn: `${srcRoot}/utils/cn.ts`,
          combobox: `${componentsRoot}/ui/combobox/combobox.tsx`,
          comboboxField: `${componentsRoot}/ui/combobox-field/combobox-field.tsx`,
          confirmDialog: `${componentsRoot}/ui/confirm-dialog/confirm-dialog.tsx`,
          datePickerField: `${componentsRoot}/ui/date-picker-field/date-picker-field.tsx`,
          dateTimePickerField: `${componentsRoot}/ui/date-time-picker-field/date-time-picker-field.tsx`,
          dialog: `${componentsRoot}/ui/dialog/dialog.tsx`,
          emptyDisplay: `${componentsRoot}/ui/empty-display/empty-display.tsx`,
          errorableLoader: `${componentsRoot}/ui/errorable-loader/errorable-loader.tsx`,
          errorDisplay: `${componentsRoot}/ui/error-display/error-display.tsx`,
          formItem: `${componentsRoot}/ui/form-item/form-item.tsx`,
          hooksUseControlledState: `${srcRoot}/hooks/use-controlled-state.ts`,
          hooksUseControllerMerged: `${srcRoot}/hooks/use-controller-merged.ts`,
          input: `${componentsRoot}/ui/input/input.tsx`,
          inputField: `${componentsRoot}/ui/input-field/input-field.tsx`,
          label: `${componentsRoot}/ui/label/label.tsx`,
          loader: `${componentsRoot}/ui/loader/loader.tsx`,
          mergeRefs: `${srcRoot}/utils/merge-refs.ts`,
          navigationMenu: `${componentsRoot}/ui/navigation-menu/navigation-menu.tsx`,
          notFoundCard: `${componentsRoot}/ui/not-found-card/not-found-card.tsx`,
          popover: `${componentsRoot}/ui/popover/popover.tsx`,
          scrollArea: `${componentsRoot}/ui/scroll-area/scroll-area.tsx`,
          select: `${componentsRoot}/ui/select/select.tsx`,
          selectField: `${componentsRoot}/ui/select-field/select-field.tsx`,
          sidebarLayout: `${componentsRoot}/ui/sidebar-layout/sidebar-layout.tsx`,
          stylesButton: `${srcRoot}/styles/button.ts`,
          stylesInput: `${srcRoot}/styles/input.ts`,
          stylesSelect: `${srcRoot}/styles/select.ts`,
          switchComponent: `${componentsRoot}/ui/switch/switch.tsx`,
          switchField: `${componentsRoot}/ui/switch-field/switch-field.tsx`,
          table: `${componentsRoot}/ui/table/table.tsx`,
          textarea: `${componentsRoot}/ui/textarea/textarea.tsx`,
          textareaField: `${componentsRoot}/ui/textarea-field/textarea-field.tsx`,
          toaster: `${componentsRoot}/ui/toaster/toaster.tsx`,
          typesForm: `${srcRoot}/types/form.ts`,
          typesIcon: `${srcRoot}/types/icon.ts`,
          useConfirmDialog: `${srcRoot}/hooks/use-confirm-dialog.ts`,
        },
      },
    };
  },
});

export const CORE_REACT_COMPONENTS_PATHS = {
  provider: coreReactComponentsPaths,
  task: coreReactComponentsPathsTask,
};
