import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactComponentsPaths {
  alert: string;
  button: string;
  calendar: string;
  card: string;
  checkboxField: string;
  checkbox: string;
  checkedInput: string;
  circularProgress: string;
  comboboxField: string;
  combobox: string;
  confirmDialog: string;
  datePickerField: string;
  dateTimePickerField: string;
  dialog: string;
  emptyDisplay: string;
  errorDisplay: string;
  errorableLoader: string;
  formItem: string;
  formError: string;
  formLabel: string;
  index: string;
  inputField: string;
  input: string;
  label: string;
  linkButton: string;
  listGroup: string;
  loader: string;
  modal: string;
  navigationMenu: string;
  notFoundCard: string;
  popover: string;
  reactSelectInput: string;
  scrollArea: string;
  selectField: string;
  select: string;
  selectInput: string;
  sidebarLayout: string;
  switchField: string;
  switchComponent: string;
  table: string;
  textareaField: string;
  textarea: string;
  toaster: string;
  useConfirmDialog: string;
  hooksUseControlledState: string;
  hooksUseControllerMerged: string;
  useStatus: string;
  stylesButton: string;
  stylesInput: string;
  stylesSelect: string;
  typesForm: string;
  typesIcon: string;
  cn: string;
  mergeRefs: string;
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
          checkedInput: `${srcRoot}/components/CheckedInput/index.tsx`,
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
          formError: `${srcRoot}/components/FormError/index.tsx`,
          formItem: `${srcRoot}/components/form-item/form-item.tsx`,
          formLabel: `${srcRoot}/components/FormLabel/index.tsx`,
          hooksUseControlledState: `${srcRoot}/hooks/use-controlled-state.ts`,
          hooksUseControllerMerged: `${srcRoot}/hooks/use-controller-merged.ts`,
          index: `${srcRoot}/components/index.ts`,
          input: `${srcRoot}/components/input/input.tsx`,
          inputField: `${srcRoot}/components/input-field/input-field.tsx`,
          label: `${srcRoot}/components/label/label.tsx`,
          linkButton: `${srcRoot}/components/LinkButton/index.tsx`,
          listGroup: `${srcRoot}/components/ListGroup/index.tsx`,
          loader: `${srcRoot}/components/loader/loader.tsx`,
          mergeRefs: `${srcRoot}/utils/merge-refs.ts`,
          modal: `${srcRoot}/components/Modal/index.tsx`,
          navigationMenu: `${srcRoot}/components/navigation-menu/navigation-menu.tsx`,
          notFoundCard: `${srcRoot}/components/not-found-card/not-found-card.tsx`,
          popover: `${srcRoot}/components/popover/popover.tsx`,
          reactSelectInput: `${srcRoot}/components/ReactSelectInput/index.tsx`,
          scrollArea: `${srcRoot}/components/scroll-area/scroll-area.tsx`,
          select: `${srcRoot}/components/select/select.tsx`,
          selectField: `${srcRoot}/components/select-field/select-field.tsx`,
          selectInput: `${srcRoot}/components/SelectInput/index.tsx`,
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
          useStatus: `${srcRoot}/hooks/useStatus.ts`,
        },
      },
    };
  },
});

export const CORE_REACT_COMPONENTS_PATHS = {
  provider: coreReactComponentsPaths,
  task: coreReactComponentsPathsTask,
};
