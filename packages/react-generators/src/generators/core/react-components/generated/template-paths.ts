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
  confirmDialog: string;
  errorableLoader: string;
  errorDisplay: string;
  formError: string;
  formLabel: string;
  index: string;
  linkButton: string;
  listGroup: string;
  modal: string;
  notFoundCard: string;
  reactDatePickerInput: string;
  reactSelectInput: string;
  selectInput: string;
  sidebar: string;
  spinner: string;
  table: string;
  textAreaInput: string;
  textInput: string;
  toast: string;
  useConfirmDialog: string;
  useStatus: string;
  useToast: string;
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
          alert: `${srcRoot}/components/Alert/index.tsx`,
          alertIcon: `${srcRoot}/components/AlertIcon/index.tsx`,
          backButton: `${srcRoot}/components/BackButton/index.tsx`,
          button: `${srcRoot}/components/Button/index.tsx`,
          buttonGroup: `${srcRoot}/components/ButtonGroup/index.tsx`,
          card: `${srcRoot}/components/Card/index.tsx`,
          checkedInput: `${srcRoot}/components/CheckedInput/index.tsx`,
          confirmDialog: `${srcRoot}/components/ConfirmDialog/index.tsx`,
          errorableLoader: `${srcRoot}/components/ErrorableLoader/index.tsx`,
          errorDisplay: `${srcRoot}/components/ErrorDisplay/index.tsx`,
          formError: `${srcRoot}/components/FormError/index.tsx`,
          formLabel: `${srcRoot}/components/FormLabel/index.tsx`,
          index: `${srcRoot}/components/index.ts`,
          linkButton: `${srcRoot}/components/LinkButton/index.tsx`,
          listGroup: `${srcRoot}/components/ListGroup/index.tsx`,
          modal: `${srcRoot}/components/Modal/index.tsx`,
          notFoundCard: `${srcRoot}/components/NotFoundCard/index.tsx`,
          reactDatePickerInput: `${srcRoot}/components/ReactDatePickerInput/index.tsx`,
          reactSelectInput: `${srcRoot}/components/ReactSelectInput/index.tsx`,
          selectInput: `${srcRoot}/components/SelectInput/index.tsx`,
          sidebar: `${srcRoot}/components/Sidebar/index.tsx`,
          spinner: `${srcRoot}/components/Spinner/index.tsx`,
          table: `${srcRoot}/components/Table/index.tsx`,
          textAreaInput: `${srcRoot}/components/TextAreaInput/index.tsx`,
          textInput: `${srcRoot}/components/TextInput/index.tsx`,
          toast: `${srcRoot}/components/Toast/index.tsx`,
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
