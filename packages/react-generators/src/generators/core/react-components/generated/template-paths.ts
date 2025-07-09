import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

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
  errorDisplay: string;
  errorableLoader: string;
  formItem: string;
  hooksUseControlledState: string;
  hooksUseControllerMerged: string;
  index: string;
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
  dependencies: { packageInfo: packageInfoProvider },
  exports: { coreReactComponentsPaths: coreReactComponentsPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        coreReactComponentsPaths: {
          alert: `${srcRoot}/components/alert/alert.tsx`,
          button: `${srcRoot}/components/button/button.tsx`,
          calendar: `${srcRoot}/components/calendar/calendar.tsx`,
          card: `${srcRoot}/components/card/card.tsx`,
          checkbox: `${srcRoot}/components/checkbox/checkbox.tsx`,
          checkboxField: `${srcRoot}/components/checkbox-field/checkbox-field.tsx`,
          circularProgress: `${srcRoot}/components/circular-progress/circular-progress.tsx`,
          cn: `${srcRoot}/utils/cn.ts`,
          combobox: `${srcRoot}/components/combobox/combobox.tsx`,
          comboboxField: `${srcRoot}/components/combobox-field/combobox-field.tsx`,
          confirmDialog: `${srcRoot}/components/confirm-dialog/confirm-dialog.tsx`,
          datePickerField: `${srcRoot}/components/date-picker-field/date-picker-field.tsx`,
          dateTimePickerField: `${srcRoot}/components/date-time-picker-field/date-time-picker-field.tsx`,
          dialog: `${srcRoot}/components/dialog/dialog.tsx`,
          emptyDisplay: `${srcRoot}/components/empty-display/empty-display.tsx`,
          errorableLoader: `${srcRoot}/components/errorable-loader/errorable-loader.tsx`,
          errorDisplay: `${srcRoot}/components/error-display/error-display.tsx`,
          formItem: `${srcRoot}/components/form-item/form-item.tsx`,
          hooksUseControlledState: `${srcRoot}/hooks/use-controlled-state.ts`,
          hooksUseControllerMerged: `${srcRoot}/hooks/use-controller-merged.ts`,
          index: `${srcRoot}/components/index.ts`,
          input: `${srcRoot}/components/input/input.tsx`,
          inputField: `${srcRoot}/components/input-field/input-field.tsx`,
          label: `${srcRoot}/components/label/label.tsx`,
          loader: `${srcRoot}/components/loader/loader.tsx`,
          mergeRefs: `${srcRoot}/utils/merge-refs.ts`,
          navigationMenu: `${srcRoot}/components/navigation-menu/navigation-menu.tsx`,
          notFoundCard: `${srcRoot}/components/not-found-card/not-found-card.tsx`,
          popover: `${srcRoot}/components/popover/popover.tsx`,
          scrollArea: `${srcRoot}/components/scroll-area/scroll-area.tsx`,
          select: `${srcRoot}/components/select/select.tsx`,
          selectField: `${srcRoot}/components/select-field/select-field.tsx`,
          sidebarLayout: `${srcRoot}/components/sidebar-layout/sidebar-layout.tsx`,
          stylesButton: `${srcRoot}/styles/button.ts`,
          stylesInput: `${srcRoot}/styles/input.ts`,
          stylesSelect: `${srcRoot}/styles/select.ts`,
          switchComponent: `${srcRoot}/components/switch/switch.tsx`,
          switchField: `${srcRoot}/components/switch-field/switch-field.tsx`,
          table: `${srcRoot}/components/table/table.tsx`,
          textarea: `${srcRoot}/components/textarea/textarea.tsx`,
          textareaField: `${srcRoot}/components/textarea-field/textarea-field.tsx`,
          toaster: `${srcRoot}/components/toaster/toaster.tsx`,
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
