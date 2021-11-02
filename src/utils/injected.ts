import { MessageFormat, validateMessage, MessageType } from "./messenger";
import arweaveLogo from "../assets/arweave.png";

/**
 * Create an overlay for pending actions
 *
 * @param text Text to display in the overlay
 * @returns overlay html
 */
export function createOverlay(text: string) {
  const container = document.createElement("div");
  container.innerHTML = `
    <div style="position: fixed; top: 0; bottom: 0; left: 0; right: 0; z-index: 1000000000000; background-color: rgba(0, 0, 0, .73); font-family: 'Inter', sans-serif;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff;">
        <h1 style="text-align: center; margin: 0; font-size: 3em; font-weight: 600; margin-bottom: .35em; line-height: 1em;">ArConnect</h1>
        <p style="text-align: center; font-size: 1.2em; font-weight: 500;">${text}</p>
      </div>
    </div>
  `;

  return container;
}

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

var messageId = 0;

export const callAPI = (message: MessageFormat) =>
  new Promise<void | any>((resolve, reject) => {
    // give every message a unique autoincrementing id
    let id = messageId;
    message.id = id;
    messageId += 1;
    window.postMessage(message, window.location.origin);
    window.addEventListener("message", callback);

    // @ts-ignore
    function callback(e: MessageEvent<any>) {
      if (
        !validateMessage(e.data, {
          type: `${message.type}_result` as MessageType
        })
      )
        return;

      // only resolve when the result matching our message.id is deleivered
      if (id != e.data?.id) return;

      window.removeEventListener("message", callback);
      if (e.data?.res === false) reject(e.data?.message);
      else resolve(e.data);
    }
  });
