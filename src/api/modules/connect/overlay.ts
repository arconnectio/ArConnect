/**
 * Create an overlay for pending actions
 *
 * @param text Text to display in the overlay
 * @returns overlay html
 */
export default function createOverlay(text: string) {
  const container = document.createElement("div");

  container.classList.add(OVERLAY_CLASS);
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

// class applied to the arconnect overlay element
export const OVERLAY_CLASS = "arconnect_connect_overlay_extension_temporary";
