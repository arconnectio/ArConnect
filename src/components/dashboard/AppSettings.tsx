import { permissionData, PermissionType } from "~applications/permissions";
import { defaultGateway } from "~applications/gateway";
import { Spacer, Text, Tooltip } from "@arconnect/components";
import PermissionCheckbox, {
  PermissionDescription
} from "~components/auth/PermissionCheckbox";
import type Application from "~applications/application";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import styled from "styled-components";

export default function AppSettings({ app }: Props) {
  // app settings
  const [settings, updateSettings] = app.hook();
  const arweave = new Arweave(defaultGateway);

  if (!settings) return <></>;

  return (
    <>
      <Title>{browser.i18n.getMessage("permissions")}</Title>
      {Object.keys(permissionData).map((permissionName: PermissionType, i) => (
        <div key={i}>
          <PermissionCheckbox
            onChange={(checked) =>
              updateSettings((val) => {
                // toggle permission
                if (checked && !val.permissions.includes(permissionName)) {
                  val.permissions.push(permissionName);
                } else if (!checked) {
                  val.permissions = val.permissions.filter(
                    (p) => p !== permissionName
                  );
                }

                return val;
              })
            }
            checked={settings.permissions.includes(permissionName)}
          >
            {permissionName}
            <br />
            <PermissionDescription>
              {browser.i18n.getMessage(permissionData[permissionName])}
            </PermissionDescription>
          </PermissionCheckbox>
          {i !== Object.keys(permissionData).length - 1 && <Spacer y={0.8} />}
        </div>
      ))}
      <Spacer y={1} />
      <Title>{browser.i18n.getMessage("allowance")}</Title>
      <PermissionCheckbox
        onChange={(checked) =>
          updateSettings((val) => ({
            ...val,
            allowance: {
              ...val.allowance,
              enabled: checked
            }
          }))
        }
        checked={settings.allowance?.enabled}
      >
        {browser.i18n.getMessage(
          settings.allowance?.enabled ? "enabled" : "disabled"
        )}
        <br />
        <PermissionDescription>
          {browser.i18n.getMessage("allowanceTip")}
        </PermissionDescription>
      </PermissionCheckbox>
      <Spacer y={0.8} />
      <Text>
        {browser.i18n.getMessage("spent")}
        {": "}
        {arweave.ar.winstonToAr(settings.allowance?.spent?.toString() || "0")}
        {" AR "}
        <Tooltip content={browser.i18n.getMessage("resetSpentQty")}>
          <ResetButton
            onClick={() =>
              updateSettings((val) => ({
                ...val,
                allowance: {
                  ...val.allowance,
                  spent: 0
                }
              }))
            }
          >
            {browser.i18n.getMessage("reset")}
          </ResetButton>
        </Tooltip>
      </Text>
    </>
  );
}

interface Props {
  app: Application;
}

const Title = styled(Text).attrs({
  heading: true
})`
  font-weight: 600;
  margin-bottom: 0.6em;
`;

const ResetButton = styled.span`
  border-bottom: 1px dotted rgba(${(props) => props.theme.theme}, 0.8);
  margin-left: 0.37rem;
  cursor: pointer;
`;
