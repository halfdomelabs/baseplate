import type React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import type { IconType } from 'react-icons/lib';

import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@baseplate-dev/ui-components';
import { useState } from 'react';
import { useController } from 'react-hook-form';
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

interface CuratedIcon {
  name: string;
  icon: IconType;
}

const CURATED_ICONS: CuratedIcon[] = [
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

const ICON_MAP = new Map(CURATED_ICONS.map((i) => [i.name, i.icon]));

interface IconPickerFieldProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
}

function IconPickerField({
  label,
  description,
  error,
  value,
  onChange,
}: IconPickerFieldProps): React.ReactElement {
  const [search, setSearch] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [open, setOpen] = useState(false);

  const SelectedIcon = value ? ICON_MAP.get(value) : undefined;

  const filtered =
    search.length > 0
      ? CURATED_ICONS.filter((i) =>
          i.name.toLowerCase().includes(search.toLowerCase()),
        )
      : CURATED_ICONS;

  return (
    <Field data-invalid={!!error}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button variant="outline" className="h-9 w-full justify-start" />
            }
          >
            {SelectedIcon ? (
              <span className="flex items-center gap-2">
                <SelectedIcon className="size-4" />
                <span className="text-sm">{value}</span>
              </span>
            ) : value ? (
              <span className="text-sm">{value}</span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Select an icon
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 p-3">
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="mb-2"
            />
            <TooltipProvider>
              <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
                {filtered.map((item) => (
                  <Tooltip key={item.name}>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          className={`flex size-8 items-center justify-center rounded-md hover:bg-accent ${value === item.name ? 'bg-accent ring-1 ring-ring' : ''}`}
                          onClick={() => {
                            onChange?.(item.name);
                            setOpen(false);
                            setSearch('');
                          }}
                        />
                      }
                    >
                      <item.icon className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent>{item.name}</TooltipContent>
                  </Tooltip>
                ))}
                {filtered.length === 0 ? (
                  <p className="col-span-8 py-4 text-center text-sm text-muted-foreground">
                    No icons found
                  </p>
                ) : null}
              </div>
            </TooltipProvider>
            <div className="mt-2 border-t pt-2">
              <p className="mb-1 text-xs text-muted-foreground">
                Or enter a custom name from{' '}
                <a
                  href="https://react-icons.github.io/react-icons/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  react-icons
                </a>
                :
              </p>
              <div className="flex gap-1">
                <Input
                  placeholder="e.g. MdPeople"
                  value={customValue}
                  onChange={(e) => {
                    setCustomValue(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customValue) {
                      e.preventDefault();
                      onChange?.(customValue);
                      setCustomValue('');
                      setOpen(false);
                    }
                  }}
                  className="h-7 text-xs"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 shrink-0"
                  type="button"
                  disabled={!customValue}
                  onClick={() => {
                    onChange?.(customValue);
                    setCustomValue('');
                    setOpen(false);
                  }}
                >
                  Set
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {value ? (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-9 shrink-0 text-xs text-muted-foreground"
            onClick={() => {
              onChange?.(null);
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>
      <FieldDescription>{description}</FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

interface ReactIconComboboxControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<IconPickerFieldProps, 'value' | 'onChange' | 'error'> {
  control: Control<TFieldValues>;
  name: TFieldName;
}

function ReactIconComboboxController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  ...rest
}: ReactIconComboboxControllerProps<
  TFieldValues,
  TFieldName
>): React.JSX.Element {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  return (
    <IconPickerField
      error={error?.message}
      {...rest}
      value={(field.value as string | null) ?? null}
      onChange={(val) => {
        field.onChange(val ?? '');
      }}
    />
  );
}

export { ReactIconComboboxController };
