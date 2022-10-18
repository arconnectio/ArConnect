import { permissionData, PermissionType } from "~applications/permissions";
import { Spacer, Text, Tooltip } from "@arconnect/components";
import { CheckIcon, EditIcon } from "@iconicicons/react";
import { defaultGateway } from "~applications/gateway";
import PermissionCheckbox, {
  PermissionDescription
} from "~components/auth/PermissionCheckbox";
import { useMemo, useState } from "react";
import type Application from "~applications/application";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Arweave from "arweave";

export default function AppSettings({ app }: Props) {
  // app settings
  const [settings, updateSettings] = app.hook();
  const arweave = new Arweave(defaultGateway);

  // allowance spent qty
  const spent = useMemo(() => {
    const val = settings?.allowance?.spent;

    if (!val) return "0";
    return val.toString();
  }, [settings]);

  // allowance limit
  const limit = useMemo(() => {
    const val = settings?.allowance?.limit;

    if (!val) return arweave.ar.arToWinston("0.1");
    return val.toString();
  }, [settings]);

  // editing limit
  const [editingLimit, setEditingLimit] = useState(false);

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
      <Text noMargin>
        {browser.i18n.getMessage("spent")}
        {": "}
        {arweave.ar.winstonToAr(spent)}
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
      <Spacer y={0.55} />
      <Text noMargin>
        {browser.i18n.getMessage("limit")}
        {": "}
        {(editingLimit && (
          <EmptyInput
            value={arweave.ar.winstonToAr(limit)}
            onChange={(e) =>
              updateSettings((val) => ({
                ...val,
                allowance: {
                  ...val.allowance,
                  limit: Number(arweave.ar.arToWinston(e.target.value))
                }
              }))
            }
          />
        )) ||
          arweave.ar.winstonToAr(limit)}
        {" AR "}
        <EditLimitButton
          as={editingLimit ? CheckIcon : EditIcon}
          onClick={() => setEditingLimit((val) => !val)}
        />
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

const EmptyInput = styled.input.attrs({
  type: "number",
  focus: true
})`
  border: none;
  outline: none;
  background-color: transparent;
  padding: 0;
  margin: 0;
  font-size: 1em;
  color: rgb(${(props) => props.theme.secondaryText});
`;

const EditLimitButton = styled(EditIcon)`
  font-size: 1em;
  width: 1em;
  height: 1em;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.83);
  }
`;
