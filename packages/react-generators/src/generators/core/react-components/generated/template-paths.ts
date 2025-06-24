import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface CoreReactComponentsPaths {
  alert: string;
  alertIcon: string;
  backButton: string;
  button: string;
  buttonGroup: string;
  card: string;
  checkedInput: string;
  combobox: string;
  confirmDialog: string;
  errorableLoader: string;
  errorDisplay: string;
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
  notFoundCard: string;
  reactDatePickerInput: string;
  reactSelectInput: string;
  scrollArea: string;
  select: string;
  selectInput: string;
  sidebar: string;
  spinner: string;
  table: string;
  textAreaInput: string;
  textInput: string;
  toast: string;
  hooksUseControlledState: string;
  useConfirmDialog: string;
  useStatus: string;
  useToast: string;
  stylesButton: string;
  stylesInput: string;
  stylesSelect: string;
  typesForm: string;
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
          alertIcon: `${srcRoot}/components/AlertIcon/index.tsx`,
          backButton: `${srcRoot}/components/BackButton/index.tsx`,
          button: `${srcRoot}/components/button/button.tsx`,
          buttonGroup: `${srcRoot}/components/ButtonGroup/index.tsx`,
          card: `${srcRoot}/components/card/card.tsx`,
          checkedInput: `${srcRoot}/components/CheckedInput/index.tsx`,
          cn: `${srcRoot}/utils/cn.ts`,
          combobox: `${srcRoot}/components/combobox/combobox.tsx`,
          confirmDialog: `${srcRoot}/components/ConfirmDialog/index.tsx`,
          errorableLoader: `${srcRoot}/components/ErrorableLoader/index.tsx`,
          errorDisplay: `${srcRoot}/components/ErrorDisplay/index.tsx`,
          formError: `${srcRoot}/components/FormError/index.tsx`,
          formItem: `${srcRoot}/components/form-item/form-item.tsx`,
          formLabel: `${srcRoot}/components/FormLabel/index.tsx`,
          hooksUseControlledState: `${srcRoot}/hooks/use-controlled-state.ts`,
          index: `${srcRoot}/components/index.ts`,
          input: `${srcRoot}/components/input/input.tsx`,
          inputField: `${srcRoot}/components/input-field/input-field.tsx`,
          label: `${srcRoot}/components/label/label.tsx`,
          linkButton: `${srcRoot}/components/LinkButton/index.tsx`,
          listGroup: `${srcRoot}/components/ListGroup/index.tsx`,
          loader: `${srcRoot}/components/loader/loader.tsx`,
          mergeRefs: `${srcRoot}/utils/merge-refs.ts`,
          modal: `${srcRoot}/components/Modal/index.tsx`,
          notFoundCard: `${srcRoot}/components/NotFoundCard/index.tsx`,
          reactDatePickerInput: `${srcRoot}/components/ReactDatePickerInput/index.tsx`,
          reactSelectInput: `${srcRoot}/components/ReactSelectInput/index.tsx`,
          scrollArea: `${srcRoot}/components/scroll-area/scroll-area.tsx`,
          select: `${srcRoot}/components/select/select.tsx`,
          selectInput: `${srcRoot}/components/SelectInput/index.tsx`,
          sidebar: `${srcRoot}/components/Sidebar/index.tsx`,
          spinner: `${srcRoot}/components/Spinner/index.tsx`,
          stylesButton: `${srcRoot}/styles/button.ts`,
          stylesInput: `${srcRoot}/styles/input.ts`,
          stylesSelect: `${srcRoot}/styles/select.ts`,
          table: `${srcRoot}/components/Table/index.tsx`,
          textAreaInput: `${srcRoot}/components/TextAreaInput/index.tsx`,
          textInput: `${srcRoot}/components/TextInput/index.tsx`,
          toast: `${srcRoot}/components/Toast/index.tsx`,
          typesForm: `${srcRoot}/types/form.ts`,
          useConfirmDialog: `${srcRoot}/hooks/useConfirmDialog.ts`,
          useStatus: `${srcRoot}/hooks/useStatus.ts`,
          useToast: `${srcRoot}/hooks/useToast.tsx`,
        },
      },
    };
  },
});

export const CORE_REACT_COMPONENTS_PATHS = {
  provider: coreReactComponentsPaths,
  task: coreReactComponentsPathsTask,
};
