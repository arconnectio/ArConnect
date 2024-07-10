import { Section, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { permissionData, type PermissionType } from "~applications/permissions";
import Checkbox from "~components/Checkbox";
import { useEffect, useState } from "react";

type PermissionsProps = {
  requestedPermissions: PermissionType[];
  update: (updatedPermissions: PermissionType[]) => void;
};

export default function Permissions({
  requestedPermissions,
  update
}: PermissionsProps) {
  const [permissions, setPermissions] = useState<Map<PermissionType, boolean>>(
    new Map()
  );

  useEffect(() => {
    setPermissions(
      new Map(requestedPermissions.map((permission) => [permission, true]))
    );
  }, []);

  return (
    <Wrapper>
      <div>
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
                          const updated = new Map(permissions);
                          updated.set(permissionName, checked);

                          setPermissions(updated);
                          const updatedPermissions = Array.from(
                            updated.entries()
                          )
                            .filter(([, value]) => value)
                            .map(([key]) => key);
                          update(updatedPermissions);
                        }}
                        checked={requestedPermissions.includes(permissionName)}
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
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  width: 100vw;
  flex-direction: column;
  justify-content: space-between;
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
  font-weight: 500;
`;

export const PermissionTitle = styled(Text).attrs({
  noMargin: true,
  heading: true
})`
  font-size: 0.875rem;
  font-weight: 500;
`;
