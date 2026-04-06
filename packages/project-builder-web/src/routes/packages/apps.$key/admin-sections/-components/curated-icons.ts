import type { IconType } from 'react-icons/lib';

import { BsCardChecklist, BsGrid, BsTable } from 'react-icons/bs';
import { FaBox, FaChartBar, FaCog, FaTag, FaUser } from 'react-icons/fa';
import {
  MdAccessTime,
  MdAccountCircle,
  MdAdminPanelSettings,
  MdAnalytics,
  MdArticle,
  MdAttachFile,
  MdBarChart,
  MdBookmark,
  MdBuild,
  MdCalendarToday,
  MdCampaign,
  MdCategory,
  MdChat,
  MdCloudUpload,
  MdComment,
  MdDashboard,
  MdDescription,
  MdEmail,
  MdExplore,
  MdExtension,
  MdFavorite,
  MdFolder,
  MdForum,
  MdGroup,
  MdHome,
  MdImage,
  MdInsights,
  MdInventory,
  MdLibraryBooks,
  MdLocalOffer,
  MdLocationOn,
  MdLock,
  MdMovie,
  MdNotifications,
  MdPayment,
  MdPeople,
  MdPerson,
  MdPersonAdd,
  MdReceipt,
  MdSecurity,
  MdSend,
  MdSettings,
  MdShield,
  MdShoppingCart,
  MdStar,
  MdStore,
  MdTrendingUp,
  MdTune,
  MdVerifiedUser,
  MdVpnKey,
} from 'react-icons/md';

export interface CuratedIcon {
  name: string;
  icon: IconType;
}

export const CURATED_ICONS: CuratedIcon[] = [
  // People & Users
  { name: 'MdPeople', icon: MdPeople },
  { name: 'MdPerson', icon: MdPerson },
  { name: 'MdPersonAdd', icon: MdPersonAdd },
  { name: 'MdGroup', icon: MdGroup },
  { name: 'MdAccountCircle', icon: MdAccountCircle },
  // Content
  { name: 'MdArticle', icon: MdArticle },
  { name: 'MdDescription', icon: MdDescription },
  { name: 'MdLibraryBooks', icon: MdLibraryBooks },
  { name: 'MdForum', icon: MdForum },
  { name: 'MdComment', icon: MdComment },
  // Commerce
  { name: 'MdShoppingCart', icon: MdShoppingCart },
  { name: 'MdStore', icon: MdStore },
  { name: 'MdPayment', icon: MdPayment },
  { name: 'MdReceipt', icon: MdReceipt },
  { name: 'MdInventory', icon: MdInventory },
  // Data
  { name: 'MdDashboard', icon: MdDashboard },
  { name: 'MdBarChart', icon: MdBarChart },
  { name: 'MdAnalytics', icon: MdAnalytics },
  { name: 'MdInsights', icon: MdInsights },
  { name: 'MdTrendingUp', icon: MdTrendingUp },
  // System
  { name: 'MdSettings', icon: MdSettings },
  { name: 'MdBuild', icon: MdBuild },
  { name: 'MdExtension', icon: MdExtension },
  { name: 'MdTune', icon: MdTune },
  { name: 'MdAdminPanelSettings', icon: MdAdminPanelSettings },
  // Files
  { name: 'MdFolder', icon: MdFolder },
  { name: 'MdAttachFile', icon: MdAttachFile },
  { name: 'MdCloudUpload', icon: MdCloudUpload },
  { name: 'MdImage', icon: MdImage },
  { name: 'MdMovie', icon: MdMovie },
  // Communication
  { name: 'MdEmail', icon: MdEmail },
  { name: 'MdNotifications', icon: MdNotifications },
  { name: 'MdChat', icon: MdChat },
  { name: 'MdCampaign', icon: MdCampaign },
  { name: 'MdSend', icon: MdSend },
  // Navigation
  { name: 'MdHome', icon: MdHome },
  { name: 'MdExplore', icon: MdExplore },
  { name: 'MdBookmark', icon: MdBookmark },
  { name: 'MdStar', icon: MdStar },
  { name: 'MdFavorite', icon: MdFavorite },
  // Security
  { name: 'MdLock', icon: MdLock },
  { name: 'MdVpnKey', icon: MdVpnKey },
  { name: 'MdSecurity', icon: MdSecurity },
  { name: 'MdVerifiedUser', icon: MdVerifiedUser },
  { name: 'MdShield', icon: MdShield },
  // Misc
  { name: 'MdCalendarToday', icon: MdCalendarToday },
  { name: 'MdAccessTime', icon: MdAccessTime },
  { name: 'MdLocationOn', icon: MdLocationOn },
  { name: 'MdLocalOffer', icon: MdLocalOffer },
  { name: 'MdCategory', icon: MdCategory },
  // Font Awesome
  { name: 'FaUser', icon: FaUser },
  { name: 'FaBox', icon: FaBox },
  { name: 'FaTag', icon: FaTag },
  { name: 'FaCog', icon: FaCog },
  { name: 'FaChartBar', icon: FaChartBar },
  // Bootstrap
  { name: 'BsCardChecklist', icon: BsCardChecklist },
  { name: 'BsGrid', icon: BsGrid },
  { name: 'BsTable', icon: BsTable },
];

export const ICON_MAP = new Map(CURATED_ICONS.map((i) => [i.name, i.icon]));
