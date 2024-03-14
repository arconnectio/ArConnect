import { InputWithBtn, InputWrapper } from "~components/arlocal/InputWrapper";
import { permissionData, type PermissionType } from "~applications/permissions";
import { defaultAllowance } from "~applications/allowance";
import { CheckIcon, EditIcon } from "@iconicicons/react";
import { useEffect, useMemo, useState } from "react";
import { IconButton } from "~components/IconButton";
import PermissionCheckbox, {
  PermissionDescription
} from "~components/auth/PermissionCheckbox";
import { removeApp } from "~applications";
import {
  ButtonV2,
  InputV2,
  ModalV2,
  SelectV2,
  Spacer,
  Text,
  TooltipV2,
  useInput,
  useModal,
  useToasts
} from "@arconnect/components";
import { concatGatewayURL, urlToGateway } from "~gateways/utils";
import type Application from "~applications/application";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Arweave from "arweave";
import { defaultGateway, suggestedGateways, testnets } from "~gateways/gateway";

export default function AppSettings({ app, showTitle = false }: Props) {
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

  // active gateway
  const gateway = useMemo(() => {
    const val = settings?.gateway;

    if (!val) {
      return concatGatewayURL(defaultGateway);
    }

    return concatGatewayURL(val);
  }, [settings]);

  // is the current gateway a custom one
  const isCustom = useMemo(() => {
    const gatewayUrls = suggestedGateways
      .concat(testnets)
      .map((g) => concatGatewayURL(g));

    return !gatewayUrls.includes(gateway);
  }, [gateway]);

  // editing custom gateway
  const [editingCustom, setEditingCustom] = useState(false);

  // custom gateway input
  const customGatewayInput = useInput();

  useEffect(() => {
    if (!isCustom || !settings.gateway) return;

    setEditingCustom(true);
    customGatewayInput.setState(concatGatewayURL(settings.gateway));
  }, [isCustom, settings?.gateway]);

  // toasts
  const { setToast } = useToasts();

  // remove modal
  const removeModal = useModal();

  if (!settings) return <></>;

  return (
    <>
      {showTitle && (
        <>
          <Spacer y={0.45} />
          <AppName>{settings?.name || settings?.url}</AppName>
          <AppUrl
            href={`https://${settings?.url || ""}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Text>
              {settings?.url}
              {settings?.blocked && <BlockedText>Blocked</BlockedText>}
            </Text>
          </AppUrl>
        </>
      )}
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
              ...defaultAllowance,
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
        <TooltipV2
          content={browser.i18n.getMessage("resetSpentQty")}
          position="top"
        >
          <ResetButton
            onClick={() =>
              updateSettings((val) => ({
                ...val,
                allowance: {
                  ...defaultAllowance,
                  ...val.allowance,
                  spent: 0
                }
              }))
            }
          >
            {browser.i18n.getMessage("reset")}
          </ResetButton>
        </TooltipV2>
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
                  ...defaultAllowance,
                  ...val.allowance,
                  limit: Number(arweave.ar.arToWinston(e.target.value))
                }
              }))
            }
          />
        )) ||
          arweave.ar.winstonToAr(limit)}
        {" AR "}
        <TooltipV2
          content={browser.i18n.getMessage("allowance_edit")}
          position="top"
        >
          <EditLimitButton
            as={editingLimit ? CheckIcon : EditIcon}
            onClick={() => setEditingLimit((val) => !val)}
          />
        </TooltipV2>
      </Text>
      <Spacer y={1} />
      <Title>{browser.i18n.getMessage("gateway")}</Title>
      <SelectV2
        onChange={(e) => {
          // @ts-expect-error
          if (e.target.value === "custom") {
            return setEditingCustom(true);
          }

          setEditingCustom(false);
          updateSettings((val) => ({
            ...val,
            // @ts-expect-error
            gateway: urlToGateway(e.target.value)
          }));
        }}
        fullWidth
      >
        {suggestedGateways.concat(testnets).map((g, i) => {
          const url = concatGatewayURL(g);

          return (
            <option value={url} selected={!isCustom && url === gateway} key={i}>
              {url}
            </option>
          );
        })}
        <option value="custom" selected={isCustom}>
          Custom
        </option>
      </SelectV2>
      {editingCustom && (
        <>
          <Spacer y={0.8} />
          <InputWithBtn>
            <InputWrapper>
              <InputV2
                {...customGatewayInput.bindings}
                type="text"
                placeholder="https://arweave.net:443"
                fullWidth
              />
            </InputWrapper>
            <IconButton
              secondary
              onClick={() => {
                updateSettings((val) => ({
                  ...val,
                  gateway: urlToGateway(customGatewayInput.state)
                }));
                setToast({
                  type: "info",
                  content: browser.i18n.getMessage("setCustomGateway"),
                  duration: 3000
                });
              }}
            >
              <CheckIcon />
            </IconButton>
          </InputWithBtn>
        </>
      )}
      <Spacer y={1} />
      <Title>{browser.i18n.getMessage("bundlrNode")}</Title>
      <InputV2
        value={settings.bundler}
        onChange={(e) =>
          updateSettings((val) => ({
            ...val,
            // @ts-expect-error
            bundler: e.target.value
          }))
        }
        fullWidth
        placeholder="https://node2.bundlr.network"
      />
      <Spacer y={1.65} />
      <ButtonV2 fullWidth onClick={() => removeModal.setOpen(true)}>
        {browser.i18n.getMessage("removeApp")}
      </ButtonV2>
      <Spacer y={0.7} />
      <ButtonV2
        fullWidth
        secondary
        onClick={() =>
          updateSettings((val) => ({
            ...val,
            blocked: !val.blocked
          }))
        }
      >
        {browser.i18n.getMessage(settings.blocked ? "unblock" : "block")}
      </ButtonV2>
      <ModalV2
        {...removeModal.bindings}
        root={document.getElementById("__plasmo")}
        actions={
          <>
            <ButtonV2 secondary onClick={() => removeModal.setOpen(false)}>
              {browser.i18n.getMessage("cancel")}
            </ButtonV2>
            <ButtonV2 onClick={() => removeApp(app.url)}>
              {browser.i18n.getMessage("remove")}
            </ButtonV2>
          </>
        }
      >
        <CenterText heading>{browser.i18n.getMessage("removeApp")}</CenterText>
        <Spacer y={0.55} />
        <CenterText noMargin>
          {browser.i18n.getMessage("removeAppNote")}
        </CenterText>
        <Spacer y={0.75} />
      </ModalV2>
    </>
  );
}

interface Props {
  app: Application;
  showTitle?: boolean;
}

const AppName = styled(Text).attrs({
  title: true,
  noMargin: true
})`
  font-weight: 600;
`;

const AppUrl = styled.a`
  cursor: pointer;
  text-decoration: none;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.7;
  }
`;

const BlockedText = styled.span`
  color: #ff0000;
  font-weight: 500;
  font-size: 0.8rem;
  text-transform: uppercase;
  margin-left: 0.375rem;
`;

const Title = styled(Text).attrs({
  heading: true
})`
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

const CenterText = styled(Text)`
  text-align: center;
  max-width: 22vw;
  margin: 0 auto;

  @media screen and (max-width: 720px) {
    max-width: 90vw;
  }
`;
