/**
 * Checks if the provided token ID is a Test U-Token or U-Token.
 *
 * @param {string} tokenID - The token ID to check.
 * @returns {boolean} Returns `true` if the token ID is a U-Token, otherwise `false`.
 */

export const isUToken = (tokenID: string) => {
  return (
    // Test U-TOKEN
    tokenID === "FYJOKdtNKl18QgblxgLEZUfJMFUv6tZTQqGTtY-D6jQ" ||
    // U-TOKEN
    tokenID === "KTzTXT_ANmF84fWEKHzWURD1LWd9QaFR9yfYUwH2Lxw"
  );
};

/**
 * Sends an HTTP request for L2 token Transfers
 *
 * @param {RequestInit & { url: string }} config - The configuration for the Fetch request.
 *                                                It should include the URL, method, headers, and any other relevant options.
 * @returns {Promise<Response>} - A Promise that resolves to the response object.
 */

export const sendRequest = async (
  config: RequestInit & { url: string }
): Promise<Response> => {
  try {
    const response = await fetch(config.url, config);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data !== undefined) {
      return data;
    } else {
      throw new Error(`${config.url}: null response`);
    }
  } catch (error) {
    throw new Error("Unknown error occurred");
  }
};
