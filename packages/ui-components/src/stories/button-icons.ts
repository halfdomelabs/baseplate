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
  None: undefined,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiHome,
  HiCog6Tooth,
  HiPlus,
  HiPower,
};

export const STORYBOOK_ICON_SELECT = {
  options: Object.keys(ICONS),
  mapping: ICONS,
  control: {
    type: 'select',
    labels: {
      HiOutlineChevronDown: 'Down',
      HiOutlineChevronUp: 'Up',
      HiOutlineChevronRight: 'Right',
      HiOutlineChevronLeft: 'Left',
      HiHome: 'Home',
      HiCog6Tooth: 'Settings',
      HiPlus: 'Plus',
      HiPower: 'Power',
    },
  },
};
