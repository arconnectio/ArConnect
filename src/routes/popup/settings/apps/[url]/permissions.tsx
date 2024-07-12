import { Spacer, Text } from "@arconnect/components";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { permissionData, type PermissionType } from "~applications/permissions";
import Checkbox from "~components/Checkbox";
import { useLocation } from "wouter";

export default function AppPermissions({ url }: Props) {
  // app settings
  const app = new Application(decodeURIComponent(url));
  const [settings, updateSettings] = app.hook();
  const [, setLocation] = useLocation();

  if (!settings) return <></>;

  return (
    <>
      <HeadV2
        title={settings?.name || settings?.url}
        back={() => setLocation(`/quick-settings/apps/${url}`)}
      />
      <Wrapper>
        <Title noMargin>{browser.i18n.getMessage("permissions")}</Title>
        {Object.keys(permissionData).map(
          (permissionName: PermissionType, i) => (
            <div key={i}>
              <Permission>
                <Checkbox
                  size={16}
                  onChange={(checked) =>
                    updateSettings((val) => {
                      // toggle permission
                      if (
                        checked &&
                        !val.permissions.includes(permissionName)
                      ) {
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
                />
                <div>
                  <PermissionTitle>{permissionName}</PermissionTitle>
                  <PermissionDescription>
                    {browser.i18n.getMessage(permissionData[permissionName])}
                  </PermissionDescription>
                </div>
              </Permission>
              {i !== Object.keys(permissionData).length - 1 && (
                <Spacer y={0.8} />
              )}
            </div>
          )
        )}
        <Spacer y={1} />
      </Wrapper>
    </>
  );
}

interface Props {
  url: string;
}

const Wrapper = styled.div`
  padding: 0 1rem;
`;

const Title = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 0.6em;
  font-size: 1.125rem;
`;

const Permission = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PermissionDescription = styled(Text).attrs({
  noMargin: true
})`
  margin-top: 0;
  font-size: 0.625rem;
`;

export const PermissionTitle = styled(Text).attrs({
  noMargin: true,
  heading: true
})`
  margin-top: 0.2rem;
  font-size: 0.875rem;
`;
