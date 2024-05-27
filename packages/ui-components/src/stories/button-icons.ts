import {
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiHome,
  HiCog6Tooth,
  HiPlus,
  HiPower,
} from 'react-icons/hi2';

const ICONS = {
  None: null,
  Down: HiOutlineChevronDown,
  Up: HiOutlineChevronUp,
  Right: HiOutlineChevronRight,
  Left: HiOutlineChevronLeft,
  Home: HiHome,
  Settings: HiCog6Tooth,
  Plus: HiPlus,
  Power: HiPower,
};

export const STORYBOOK_ICON_SELECT = {
  options: Object.keys(ICONS),
  mapping: ICONS,
};
