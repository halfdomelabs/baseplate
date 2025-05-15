import {
  MdAdd,
  MdChevronLeft,
  MdChevronRight,
  MdExpandLess,
  MdExpandMore,
  MdHome,
  MdPowerSettingsNew,
  MdSettings,
} from 'react-icons/md';

const ICONS = {
  None: null,
  Down: MdExpandMore,
  Up: MdExpandLess,
  Right: MdChevronRight,
  Left: MdChevronLeft,
  Home: MdHome,
  Settings: MdSettings,
  Plus: MdAdd,
  Power: MdPowerSettingsNew,
};

export const STORYBOOK_ICON_SELECT = {
  options: Object.keys(ICONS),
  mapping: ICONS,
};
