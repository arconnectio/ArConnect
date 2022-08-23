import { MessageFormat, validateMessage, MessageType } from "./messenger";
import arweaveLogo from "../assets/arweave.png";

/**
 * Create an animation for transactions
 */
export function createCoinWithAnimation() {
  const arCoin = document.createElement("img"),
    pos = { x: 0, y: 0 },
    id = `ar-coin-animation-${
      document.querySelectorAll(".ar-coing-animation").length
    }`;
  let visibility = 100;

  arCoin.setAttribute("src", arweaveLogo);
  arCoin.setAttribute("alt", "a");
  arCoin.style.position = "fixed";
  arCoin.style.bottom = "0";
  arCoin.style.right = `${Math.floor(Math.random() * 30)}px`;
  arCoin.style.width = "18px";
  arCoin.style.zIndex = "1000000";
  arCoin.style.transition = "all .23s ease";
  arCoin.id = id;
  arCoin.classList.add("ar-coing-animation");
  document.body.appendChild(arCoin);

  // @ts-ignore
  const animation = setInterval(() => {
    if (visibility < 0) {
      document.querySelector(`#${id}`)?.remove();
      return clearInterval(animation);
    }

    visibility -= 6.5;
    pos.x += Math.floor(Math.random() * 30) - 10;
    pos.y += Math.floor(Math.random() * 24);
    arCoin.style.transform = `translate(-${pos.x}px, -${pos.y}px)`;
    arCoin.style.opacity = `${visibility / 100}`;
  }, 100);
}

let messageId = 0;

export const callAPI = (message: any) =>
  new Promise<void | any>((resolve, reject) => {
    // give every message a unique autoincrementing id
    const id = messageId;

    message.id = id;
    messageId += 1;

    window.postMessage(
      { ...message, ext: "arconnect", sender: "api" },
      window.location.origin
    );

    window.addEventListener("message", callback);

    // @ts-ignore
    function callback(e: MessageEvent<any>) {
      if (!validateMessage(e.data, undefined, `${message.type}_result`)) return;

      // only resolve when the result matching our message.id is deleivered
      if (id !== e.data?.id) return;

      window.removeEventListener("message", callback);
      if (e.data?.res === false) reject(e.data?.message);
      else resolve(e.data);
    }
  });
