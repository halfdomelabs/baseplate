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
          alert: `${componentsRoot}/alert/alert.tsx`,
          button: `${componentsRoot}/button/button.tsx`,
          calendar: `${componentsRoot}/calendar/calendar.tsx`,
          card: `${componentsRoot}/card/card.tsx`,
          checkbox: `${componentsRoot}/checkbox/checkbox.tsx`,
          checkboxField: `${componentsRoot}/checkbox-field/checkbox-field.tsx`,
          circularProgress: `${componentsRoot}/circular-progress/circular-progress.tsx`,
          cn: `${srcRoot}/utils/cn.ts`,
          combobox: `${componentsRoot}/combobox/combobox.tsx`,
          comboboxField: `${componentsRoot}/combobox-field/combobox-field.tsx`,
          confirmDialog: `${componentsRoot}/confirm-dialog/confirm-dialog.tsx`,
          datePickerField: `${componentsRoot}/date-picker-field/date-picker-field.tsx`,
          dateTimePickerField: `${componentsRoot}/date-time-picker-field/date-time-picker-field.tsx`,
          dialog: `${componentsRoot}/dialog/dialog.tsx`,
          emptyDisplay: `${componentsRoot}/empty-display/empty-display.tsx`,
          errorableLoader: `${componentsRoot}/errorable-loader/errorable-loader.tsx`,
          errorDisplay: `${componentsRoot}/error-display/error-display.tsx`,
          formItem: `${componentsRoot}/form-item/form-item.tsx`,
          hooksUseControlledState: `${srcRoot}/hooks/use-controlled-state.ts`,
          hooksUseControllerMerged: `${srcRoot}/hooks/use-controller-merged.ts`,
          input: `${componentsRoot}/input/input.tsx`,
          inputField: `${componentsRoot}/input-field/input-field.tsx`,
          label: `${componentsRoot}/label/label.tsx`,
          loader: `${componentsRoot}/loader/loader.tsx`,
          mergeRefs: `${srcRoot}/utils/merge-refs.ts`,
          navigationMenu: `${componentsRoot}/navigation-menu/navigation-menu.tsx`,
          notFoundCard: `${componentsRoot}/not-found-card/not-found-card.tsx`,
          popover: `${componentsRoot}/popover/popover.tsx`,
          scrollArea: `${componentsRoot}/scroll-area/scroll-area.tsx`,
          select: `${componentsRoot}/select/select.tsx`,
          selectField: `${componentsRoot}/select-field/select-field.tsx`,
          sidebarLayout: `${componentsRoot}/sidebar-layout/sidebar-layout.tsx`,
          stylesButton: `${srcRoot}/styles/button.ts`,
          stylesInput: `${srcRoot}/styles/input.ts`,
          stylesSelect: `${srcRoot}/styles/select.ts`,
          switchComponent: `${componentsRoot}/switch/switch.tsx`,
          switchField: `${componentsRoot}/switch-field/switch-field.tsx`,
          table: `${componentsRoot}/table/table.tsx`,
          textarea: `${componentsRoot}/textarea/textarea.tsx`,
          textareaField: `${componentsRoot}/textarea-field/textarea-field.tsx`,
          toaster: `${componentsRoot}/toaster/toaster.tsx`,
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
