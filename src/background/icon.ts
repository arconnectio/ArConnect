import manifest from "../../public/manifest.json";

export function updateIcon(hasPerms: boolean) {
  let defaultIcons: { [index: number]: string } = {};

  // remap with numbers
  for (const iconSize in manifest.icons) {
    // @ts-ignore
    defaultIcons[parseFloat(iconSize)] = manifest.icons[iconSize];
  }

  //if(permissionsForSite.length > 0) chrome.browserAction.setIcon({ path: "" });
  //else chrome.browserAction.setIcon({ path: defaultIcons });
}
