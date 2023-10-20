import BaseListElement, {
  SettingIcon
} from "~components/dashboard/list/BaseElement";
import { Icon, SettingType } from "~settings/setting";
import { useHistory } from "~utils/hash_router";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";

export default function SettingListItem({
  name,
  displayName,
  description,
  type,
  icon
}: SettingListItemProps) {
  // setting state
  const [settingState, updateSetting] = useSetting(name);

  // router push
  const [push] = useHistory();

  async function handleClick() {
    switch (type) {
      case "subsetting":
        push(`/setting/${name}`);
        break;

      case "boolean":
        await updateSetting((v: unknown) => !v);
        break;

      default:
        break;
    }
  }

  return (
    <BaseListElement
      title={browser.i18n.getMessage(displayName)}
      description={browser.i18n.getMessage(description)}
      right={<></>}
      onClick={handleClick}
    >
      <SettingIcon as={icon} />
    </BaseListElement>
  );
}

export interface SettingListItemProps {
  name: string;
  icon: Icon;
  displayName: string;
  description: string;
  type?: SettingType | "subsetting";
}
