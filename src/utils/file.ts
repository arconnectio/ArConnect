/**
 * Read file content as binary
 *
 * @param file File object to read from
 * @returns File content as an ArrayBuffer
 */
export const readFileBinary = (file: File) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();

    try {
      reader.readAsArrayBuffer(file);
    } catch (e) {
      reject(e);
    }

    // reader events
    reader.onabort = () => reject("File reading aborted");
    reader.onerror = () => reject("File reading threw an error");
    reader.onload = (e) => {
      if (!e.target?.result) {
        return reject("No result returned from reading");
      }

      if (typeof e.target.result === "string") {
        return reject("Invalid string result from reading file");
      }

      resolve(e.target.result);
    };
  });

/**
 * Read file content as a string
 *
 * @param file File object to read from
 * @returns File content as a string
 */
export const readFileString = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    try {
      reader.readAsText(file);
    } catch (e) {
      reject(e);
    }

    // reader events
    reader.onabort = () => reject("File reading aborted");
    reader.onerror = () => reject("File reading threw an error");
    reader.onload = (e) => {
      if (!e.target?.result) {
        return reject("No result returned from reading");
      }

      if (typeof e.target.result !== "string") {
        return reject("Invalid result from reading file (not string)");
      }

      resolve(e.target.result);
    };
  });

/**
 * Download a file for the user
 *
 * @param content Content of the file
 * @param contentType File content-type
 * @param fileName Name of the file (with the extension)
 */
export function downloadFile(
  content: string,
  contentType: string,
  fileName: string
) {
  // create element that downloads the virtual file
  const el = document.createElement("a");

  el.setAttribute(
    "href",
    `data:${contentType};charset=utf-8,${encodeURIComponent(content)}`
  );
  el.setAttribute("download", fileName);
  el.style.display = "none";

  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
}
