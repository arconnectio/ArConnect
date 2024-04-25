import { TooltipV2, ButtonV2 } from "@arconnect/components";
import browser from "webextension-polyfill";
import { useBalance } from "~wallets/hooks";
import styled from "styled-components";
import { InfoCircle } from "@untitled-ui/icons-react";
import { Text } from "@arconnect/components";
import { GraphText } from "../Graph";
import { Ticker } from "./Balance";
import AO from "url:/assets/ecosystem/ao.svg";
import AOAltLogo from "url:/assets/ecosystem/ao-token.svg";
import AOLogo from "url:/assets/ecosystem/ao-logo.png";

interface RewardProps {
  alt?: boolean;
  isVault?: boolean;
}

export default function Rewards({ alt = false, isVault = false }: RewardProps) {
  return (
    <Wrapper alt={alt} button={isVault}>
      {isVault || alt ? (
        <RewardsCard>
          <TopRowInfo>
            <RewardsTitle>
              Rewards
              <TooltipV2 content={InfoText} position={"right"}>
                <InfoIcon />
              </TooltipV2>
            </RewardsTitle>
            <Rate>1 ao/day</Rate>
          </TopRowInfo>
          <DetailWrapper>
            <BalanceText>
              2.00
              <img
                src={AOAltLogo}
                alt="ao logo"
                style={{
                  width: "1.75rem"
                }}
              />
            </BalanceText>
            <DetailContainer>
              <RewardDetail style={{ paddingBottom: "20px" }}>
                <div>
                  Status: <Status status="Active">Active</Status>
                </div>
                <div>
                  Streak: <Status status="Inactive">2 days</Status>
                </div>
              </RewardDetail>
            </DetailContainer>
          </DetailWrapper>
        </RewardsCard>
      ) : (
        <CreateVaultButton
          fullWidth
          onClick={() =>
            browser.tabs.create({
              url: browser.runtime.getURL("tabs/dashboard.html#/vaults/new")
            })
          }
        >
          Create Vault
        </CreateVaultButton>
      )}
    </Wrapper>
  );
}

// Rewards title
// i icon with tooltipv2
// linear gradient
// linear gradient

interface Props {
  status: "Active" | "Inactive";
}

const CreateVaultButton = styled(ButtonV2)`
  background: linear-gradient(
    to top right,
    rgba(254, 121, 185, 0.62),
    rgba(173, 0, 255, 0.62)
  );
`;

const Status = styled.span<Props>`
  color: ${(props) =>
    props.status === "Active" ? props.theme.success : "inherit"};
`;

const BalanceText = styled(GraphText)`
  position: relative;
  top: -0.555rem;
  font-size: 2rem;
  font-weight: 600;
  display: flex;
  gap: 4px;
  align-items: center;
  align-self: stretch;
`;

const DetailWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 1rem;
`;

const DetailContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const RewardDetail = styled(Text).attrs({
  heading: true,
  margin: false
})`
  position: relative;
  top: -0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  font-weight: 400;
  line-height: 19.12px;
  text-align: center;
  padding: 0px;
  flex-direction: column;
`;

const InfoText: React.ReactNode = (
  <div style={{ fontSize: "10px", lineHeight: "13.66px" }}>
    Rewards totals are estimates <br />
    only. The rewards are provided <br />
    by a third party service provider <br />
    and not ArConnect.
  </div>
);

const Rate = styled(Text).attrs({
  heading: true
})`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  font-weight: 500;
  // line-height: 21.86px;
  gap: 4px;
  text-align: center;
`;

const InfoIcon = styled(InfoCircle)`
  width: 1rem;
  height: 1rem;
  gap: 0px;
  border: 1.33px 0px 0px 0px;
  opacity: 0px;
  margin-top: 1px;
  cursor: pointer;
  color: ${(props) => props.theme.secondaryTextv2};
  margin-right: 1.85px;
`;

const RewardsTitle = styled(Text).attrs({
  heading: true
})`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  font-weight: 500;
  line-height: 21.86px;
  text-align: center;
  gap: 3px;
`;

const TopRowInfo = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const RewardsCard = styled.div`
  height: 70px;
  padding: 15px;
  gap: 4px;
  background: conic-gradient(
    from 177.7deg at 49.99% 100.5%,
    #fe79b9 0deg,
    #ad00ff 150deg,
    #2489ff 360deg
  );
  border-radius: 10px;
`;

const Wrapper = styled.div<{ alt: boolean; button: boolean }>`
  position: relative;
  height: ${(props) => props.button && "100px"};
  margin: ${(props) => (props.alt ? "0" : "0.5rem 12px 0px 12px")};
  z-index: 10;
`;
