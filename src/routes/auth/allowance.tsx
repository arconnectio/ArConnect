import { useAuthParams, useAuthUtils } from "~utils/auth";

export default function Allowance() {
  // connect params
  const params = useAuthParams();

  // get auth utils
  const { closeWindow, cancel } = useAuthUtils("connect", params?.authID);

  return <></>;
}
