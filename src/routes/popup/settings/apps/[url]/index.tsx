import { InputWithBtn, InputWrapper } from "~components/arlocal/InputWrapper";
import { defaultAllowance } from "~applications/allowance";
import { InformationIcon } from "@iconicicons/react";
import { useEffect, useMemo, useState } from "react";
import { IconButton } from "~components/IconButton";
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
import Application from "~applications/application";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Arweave from "arweave";
import { defaultGateway, suggestedGateways, testnets } from "~gateways/gateway";
import HeadV2 from "~components/popup/HeadV2";
import { useLocation } from "wouter";
import { ToggleSwitch } from "~routes/popup/subscriptions/subscriptionDetails";

export default function AppSettings({ url }: Props) {
  // app settings
  const app = new Application(url);
  const [settings, updateSettings] = app.hook();
  const arweave = new Arweave(defaultGateway);

  const [, setLocation] = useLocation();

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

  const limitInput = useInput();

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
      <HeadV2 title={settings?.name || settings?.url} />
      <Wrapper>
        <div>
          <Flex alignItems="center" justifyContent="space-between">
            <TitleV1 noMargin>{browser.i18n.getMessage("permissions")}</TitleV1>
            <ResetButton
              onClick={() =>
                setLocation(`/quick-settings/apps/${url}/permissions`)
              }
            >
              <Text
                heading
                noMargin
                style={{
                  fontSize: "1rem",
                  fontWeight: 500,
                  lineHeight: 1
                }}
              >
                {browser.i18n.getMessage("view_all")}
              </Text>
            </ResetButton>
          </Flex>
          <Spacer y={1} />
          <Flex alignItems="center" justifyContent="space-between">
            <Flex alignItems="center" justifyContent="center">
              <TitleV1>{browser.i18n.getMessage("allowance")}</TitleV1>
              <TooltipV2
                content={
                  <div style={{ width: "200px", textAlign: "center" }}>
                    {browser.i18n.getMessage("allowanceTip")}
                  </div>
                }
                position="top"
              >
                <InfoIcon />
              </TooltipV2>
            </Flex>
            <ToggleSwitch
              checked={settings?.allowance.enabled}
              setChecked={(enabled: boolean) => {
                updateSettings((val) => ({
                  ...val,
                  allowance: {
                    ...defaultAllowance,
                    ...val.allowance,
                    enabled: !val.allowance.enabled
                  }
                }));
              }}
            />
          </Flex>
          <Spacer y={1} />
          <div>
            <TitleV2>{browser.i18n.getMessage("limit")}</TitleV2>
            <div
              style={{
                position: "relative"
              }}
            >
              <NumberInputV2
                small
                {...limitInput.bindings}
                type="number"
                min={0}
                defaultValue={arweave.ar.winstonToAr(limit)}
                placeholder={browser.i18n.getMessage("allowance_edit")}
                onChange={(e) =>
                  updateSettings((val) => ({
                    ...val,
                    allowance: {
                      ...defaultAllowance,
                      ...val.allowance,
                      limit: arweave.ar.arToWinston((e.target as any).value)
                    }
                  }))
                }
                fullWidth
              />
              <div
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "25%",
                  fontSize: "16px"
                }}
              >
                AR
              </div>
            </div>
          </div>
          <Spacer y={0.55} />
          <Flex justifyContent="space-between" alignItems="center">
            <TitleV2 style={{ marginBottom: 0 }}>
              {browser.i18n.getMessage("spent")}:{" "}
              {arweave.ar.winstonToAr(spent)}
              {" AR "}
            </TitleV2>
            <TooltipV2
              content={browser.i18n.getMessage("resetSpentQty")}
              position="topEnd"
            >
              <ResetButton
                onClick={() =>
                  updateSettings((val) => ({
                    ...val,
                    allowance: {
                      ...defaultAllowance,
                      ...val.allowance,
                      spent: "0"
                    }
                  }))
                }
              >
                <Text
                  heading
                  noMargin
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    lineHeight: 1
                  }}
                >
                  {browser.i18n.getMessage("reset")}
                </Text>
              </ResetButton>
            </TooltipV2>
          </Flex>
          <Spacer y={1} />
          <TitleV2>{browser.i18n.getMessage("gateway")}</TitleV2>
          <SelectV2
            small
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
                <option
                  value={url}
                  selected={!isCustom && url === gateway}
                  key={i}
                >
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
                    small
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
                  Save
                </IconButton>
              </InputWithBtn>
            </>
          )}
          <Spacer y={1} />
          <TitleV2>{browser.i18n.getMessage("bundlrNode")}</TitleV2>
          <InputV2
            small
            value={settings.bundler}
            onChange={(e) =>
              updateSettings((val) => ({
                ...val,
                // @ts-expect-error
                bundler: e.target.value
              }))
            }
            fullWidth
            placeholder="https://turbo.ardrive.io"
          />
          <Spacer y={1.65} />
        </div>
        <div>
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
                <ButtonV2
                  onClick={async () => {
                    await removeApp(app.url);
                    setLocation(`/quick-settings/apps`);
                  }}
                >
                  {browser.i18n.getMessage("remove")}
                </ButtonV2>
              </>
            }
          >
            <CenterText heading>
              {browser.i18n.getMessage("removeApp")}
            </CenterText>
            <Spacer y={0.55} />
            <CenterText noMargin>
              {browser.i18n.getMessage("removeAppNote")}
            </CenterText>
            <Spacer y={0.75} />
          </ModalV2>
        </div>
      </Wrapper>
    </>
  );
}

interface Props {
  url: string;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 1rem;
  height: calc(100vh - 80px);
`;

const InfoIcon = styled(InformationIcon)`
  color: ${(props) => props.theme.secondaryTextv2};
`;

const TitleV1 = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 0;
  font-size: 1.125rem;
`;

const TitleV2 = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 0.6em;
  font-size: 1rem;
  font-weight: 600;
`;

const NumberInputV2 = styled(InputV2)`
  /* Chrome, Safari, Edge, Opera */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  &[type="number"] {
    -moz-appearance: textfield;
  }
`;

const ResetButton = styled.span`
  border-bottom: 1px solid rgba(${(props) => props.theme.primaryText}, 0.8);
  margin-left: 0.37rem;
  cursor: pointer;
`;

const CenterText = styled(Text)`
  text-align: center;
  max-width: 22vw;
  margin: 0 auto;

  @media screen and (max-width: 720px) {
    max-width: 90vw;
  }
`;

const Flex = styled.div<{ alignItems: string; justifyContent: string }>`
  display: flex;
  align-items: ${(props) => props.alignItems};
  justify-content: ${(props) => props.justifyContent};
`;
