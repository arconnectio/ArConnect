import { Section, TooltipV2, type DisplayTheme } from "@arconnect/components";
import { useBalance } from "~wallets/hooks";
import styled from "styled-components";
import { InfoCircle } from "@untitled-ui/icons-react";
import { Text } from "@arconnect/components";

// fetch ar balance
// fetch ao vault balance
// handle emissions rate
// show status in ui
// show streak in ui (days allocated)

// Any movement of funds disqualifies from using a vault

export default function Rewards() {
  return (
    <Wrapper>
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
      </RewardsCard>
    </Wrapper>
  );
}

// Rewards title
// i icon with tooltipv2
// linear gradient
// linear gradient

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
  line-height: 21.86px;
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
  width: 317.5px;
  display: flex;
  justify-content: space-between;
`;

const RewardsCard = styled.div`
  height: 70px;
  padding: 15px;
  gap: 4px;
  background: conic-gradient(
    from 177.82deg at 47.07% 100.5%,
    #fe79b9 0deg,
    #ad00ff 150deg,
    #2489ff 360deg
  );
  border-radius: 10px;
`;

const Wrapper = styled.div`
  position: relative;
  height: 100px;
  margin: 0.5rem 12px 0px 12px;
  z-index: 150;
`;
