import { ButtonV2, Section, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { permissionData, type PermissionType } from "~applications/permissions";
import Checkbox from "~components/Checkbox";
import { useEffect, useMemo, useState } from "react";
import { defaultGateway, type Gateway } from "~gateways/gateway";
import type { AppInfo } from "~applications/application";
import { useAuthParams } from "~utils/auth";
import HeadV2 from "~components/popup/HeadV2";
import App from "~components/auth/App";

export default function Permissions() {
  const [permissions, setPermissions] = useState<Map<PermissionType, boolean>>(
    new Map()
  );

  // connect params
  const params = useAuthParams<{
    url: string;
    permissions: PermissionType[];
    appInfo: AppInfo;
    gateway?: Gateway;
  }>();

  // app data
  const appData = useMemo<AppInfo>(() => {
    if (!params) return {};

    return params.appInfo;
  }, [params]);

  // app url
  const appUrl = useMemo(() => {
    if (!params) return "";

    return params.url;
  }, [params]);

  useEffect(() => {
    if (!params) return;

    setPermissions(
      new Map(params.permissions.map((permission) => [permission, true]))
    );
  }, [params]);

  function onSave() {
    const updatedPermissions = Array.from(permissions.entries())
      .filter(([, value]) => value)
      .map(([key]) => key);

    const updatedParams = {
      ...params,
      permissions: updatedPermissions,
      type: "connect"
    };

    // TODO: Code to go back
  }

  return (
    <Wrapper>
      <div>
        <HeadV2
          title={browser.i18n.getMessage("edit_permissions")}
          showOptions={false}
        />
        <App
          appName={appData.name || appUrl}
          appUrl={appUrl}
          // TODO: wayfinder
          gateway={params?.gateway || defaultGateway}
          appIcon={appData.logo}
          showTitle={false}
        />
        <Section style={{ paddingTop: 0 }}>
          <Title noMargin>{browser.i18n.getMessage("permissions")}</Title>
          <PermissionsWrapper>
            {Object.keys(permissionData).map(
              (permissionName: PermissionType, i) => {
                let formattedPermissionName = permissionName
                  .split("_")
                  .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
                  .join(" ");

                if (permissionName === "SIGNATURE") {
                  formattedPermissionName = "Sign Data";
                }

                return (
                  <div key={i}>
                    <Permission>
                      <Checkbox
                        size={16}
                        onChange={(checked) => {
                          setPermissions((prevPermissions) => {
                            const newPermissions = new Map(prevPermissions);
                            newPermissions.set(permissionName, checked);
                            return newPermissions;
                          });
                        }}
                        checked={!!permissions.get(permissionName)}
                      />
                      <div>
                        <PermissionTitle>
                          {formattedPermissionName}
                        </PermissionTitle>
                        <PermissionDescription>
                          {browser.i18n.getMessage(
                            permissionData[permissionName]
                          )}
                        </PermissionDescription>
                      </div>
                    </Permission>
                  </div>
                );
              }
            )}
          </PermissionsWrapper>
        </Section>
      </div>
      <Section>
        <ButtonV2 fullWidth onClick={onSave}>
          {browser.i18n.getMessage("save")}
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
`;

const Title = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 0.75em;
  font-size: 1.125rem;
`;

const PermissionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Permission = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PermissionDescription = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.625rem;
`;

export const PermissionTitle = styled(Text).attrs({
  noMargin: true,
  heading: true
})`
  font-size: 0.875rem;
`;
