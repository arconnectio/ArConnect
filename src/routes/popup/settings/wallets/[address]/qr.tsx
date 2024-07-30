import {
  useToasts,
  Section,
  TooltipV2,
  useInput,
  ButtonV2,
  InputV2,
  Spacer,
  Text
} from "@arconnect/components";
import { CheckIcon, CopyIcon } from "@iconicicons/react";
import copy from "copy-to-clipboard";
import { QRCodeSVG } from "qrcode.react";
import {
  useEffect,
  useRef,
  useState,
  type Key,
  type MouseEventHandler
} from "react";
import { useLocation } from "wouter";
import HeadV2 from "~components/popup/HeadV2";
import { WarningIcon } from "~components/popup/Token";
import browser from "webextension-polyfill";
import { Degraded, WarningWrapper } from "~routes/popup/send";
import { formatAddress } from "~utils/format";
import { getKeyfile, type DecryptedWallet } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import {
  AddressField,
  ContentWrapper,
  CopyAction,
  QRCodeWrapper,
  Wrapper
} from "~routes/popup/receive";
import { dataToFrames } from "qrloop";
import { checkPassword } from "~wallets/auth";

export default function GenerateQR({ address }: { address: string }) {
  const [wallet, setWallet] = useState<DecryptedWallet>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);

  const [, setLocation] = useLocation();
  const { setToast } = useToasts();
  const passwordInput = useInput();

  const isHardware = wallet?.type === "hardware";

  const copyAddress: MouseEventHandler = (e) => {
    e.stopPropagation();
    copy(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
    setToast({
      type: "success",
      duration: 2000,
      content: `${formatAddress(address, 3)} ${browser.i18n.getMessage(
        "copied_address_2"
      )}`
    });
  };

  async function generateQr() {
    try {
      setLoading(true);
      const isPasswordCorrect = await checkPassword(passwordInput.state);
      if (isPasswordCorrect) {
        const wallet = await getKeyfile(address);
        setWallet(wallet);
      } else {
        passwordInput.setStatus("error");
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalidPassword"),
          duration: 2200
        });
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if ((wallet as any)?.keyfile) {
      setFrames(dataToFrames(JSON.stringify((wallet as any)?.keyfile)));
      freeDecryptedWallet((wallet as any).keyfile);
    }
  }, [wallet]);

  return (
    <Wrapper>
      <div>
        <HeadV2
          title={
            wallet
              ? wallet?.nickname ?? "Account"
              : browser.i18n.getMessage("generate_qr_code")
          }
          back={() => {
            if (address) {
              setLocation(`/quick-settings/wallets/${address}`);
            } else {
              setLocation("/");
            }
          }}
        />
      </div>
      {wallet ? (
        <div>
          {isHardware ? (
            <Degraded
              style={{
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <WarningWrapper>
                <WarningIcon color="#fff" />
              </WarningWrapper>
              <div>
                <span>
                  {browser.i18n.getMessage("cannot_generate_qr_code")}
                </span>
              </div>
            </Degraded>
          ) : (
            <ContentWrapper>
              <Section style={{ padding: "8px 15px 0 15px" }}>
                <QRCodeWrapper>
                  <QRCodeLoop frames={frames} fps={5} size={275} />
                </QRCodeWrapper>
              </Section>
              <Section style={{ padding: "8px 15px 0 15px" }}>
                <AddressField fullWidth onClick={copyAddress}>
                  {formatAddress(address ?? "", 6)}
                  <TooltipV2
                    content={browser.i18n.getMessage("copy_address")}
                    position="bottom"
                  >
                    <CopyAction as={copied ? CheckIcon : CopyIcon} />
                  </TooltipV2>
                </AddressField>
              </Section>
            </ContentWrapper>
          )}
        </div>
      ) : (
        <Section style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
          <Text style={{ fontSize: "0.98rem" }}>
            {browser.i18n.getMessage("generate_qr_code_title")}
          </Text>
          <InputV2
            small
            type="password"
            placeholder={browser.i18n.getMessage("password")}
            {...passwordInput.bindings}
            fullWidth
          />
          <Spacer y={1} />
          <ButtonV2 fullWidth onClick={generateQr} loading={loading}>
            {browser.i18n.getMessage("generate")}
          </ButtonV2>
        </Section>
      )}
    </Wrapper>
  );
}

const QRCodeLoop = ({
  frames,
  size,
  fps
}: {
  frames: string[];
  size: number;
  fps: number;
}) => {
  const [frame, setFrame] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const nextFrame = (frame: number, frames: string[]) => {
      frame = (frame + 1) % frames.length;
      return frame;
    };

    let lastT: number;
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!lastT) lastT = t;
      if ((t - lastT) * fps < 1000) return;
      lastT = t;
      setFrame((prevFrame) => nextFrame(prevFrame, frames));
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [frames, fps]);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {frames.map((chunk: any, i: Key) => (
        <div
          key={i}
          style={{ position: "absolute", opacity: i === frame ? 1 : 0 }}
        >
          <QRCodeSVG
            fgColor="#fff"
            bgColor="transparent"
            size={size}
            value={chunk}
          />
        </div>
      ))}
    </div>
  );
};
