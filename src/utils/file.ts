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
