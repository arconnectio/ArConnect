import { Spacer, Text } from "@arconnect/components";
import browser from "webextension-polyfill";
import logo from "url:/assets/icon512.png";
import styled from "styled-components";
import { getPreReleaseVersionLabel, getVersionLabel } from "~utils/runtime";

export default function About() {
  const preReleaseVersionLabel = getPreReleaseVersionLabel();

  return (
    <>
      <Logo />
      <Spacer y={0.85} />
      <Name>ArConnect</Name>
      <Version>
        {getVersionLabel()}
        {preReleaseVersionLabel ? (
          <DevelopmentVersion>{preReleaseVersionLabel}</DevelopmentVersion>
        ) : null}
      </Version>
      <Version>{process.env.PLASMO_TARGET}</Version>
      <Spacer y={1.1} />
      <Text>
        {browser.i18n.getMessage("permissions_used")}
        <PermissionsList>
          {(browser.runtime.getManifest().permissions || []).map(
            (permission, i) => (
              <PermissionLi key={i}>{permission}</PermissionLi>
            )
          )}
        </PermissionsList>
      </Text>
    </>
  );
}

const Logo = styled.img.attrs({
  draggable: false,
  alt: "ArConnect",
  src: logo
})`
  width: 220px;
  margin: 0 auto;
  display: block;
  user-select: none;
`;

const Name = styled(Text).attrs({
  subtitle: true,
  noMargin: true
})`
  font-weight: 600;
  text-align: center;
`;

const Version = styled(Text).attrs({
  noMargin: true
})`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
  gap: 0.37rem;
`;

const DevelopmentVersion = styled.span`
  font-size: 0.9em;
  font-weight: 500;
  padding: 0.1rem 0.2rem;
  border-radius: 3px;
  background-color: #ff5100;
  color: #fff;
`;

const PermissionsList = styled.ul`
  padding-left: 0.5rem;
`;

const PermissionLi = styled.li`
  list-style-type: "-";
  padding-left: 0.5rem;
`;
