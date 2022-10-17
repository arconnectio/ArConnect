import { Checkbox, Text } from "@arconnect/components";
import styled from "styled-components";

const PermissionCheckbox = styled(Checkbox)`
  align-items: flex-start;
`;

export const PermissionDescription = styled(Text).attrs({
  noMargin: true
})`
  margin-top: 0.2rem;
`;

export default PermissionCheckbox;
