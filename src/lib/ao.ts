import { connect } from "@permaweb/aoconnect";
import { ArweaveSigner, createData } from "arbundles";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { defaultConfig } from "~tokens/aoTokens/config";

export const joinUrl = ({ url, path }: { url: string; path: string }) => {
  if (!path) return url;

  // Create a URL object
  const urlObj = new URL(url);

  // Remove leading slash from path if present
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  // Ensure the URL object's pathname ends with a slash if it's not empty
  urlObj.pathname = urlObj.pathname.replace(/\/?$/, "/");

  // Join the normalized path
  urlObj.pathname += normalizedPath;

  return urlObj.toString();
};

export class AOProcess {
  private processId: string;
  private ao: {
    result: any;
    results: any;
    message: any;
    spawn: any;
    monitor: any;
    unmonitor: any;
    dryrun: any;
    assign: any;
  };

  constructor({
    processId,
    connectionConfig
  }: {
    processId: string;
    connectionConfig?: {
      CU_URL: string;
      MU_URL: string;
      GATEWAY_URL: string;
      GRAPHQL_URL: string;
    };
  }) {
    this.processId = processId;
    this.ao = connect({
      GRAPHQL_URL:
        connectionConfig?.GATEWAY_URL ??
        joinUrl({ url: defaultConfig.GATEWAY_URL, path: "graphql" }),
      CU_URL: connectionConfig?.GATEWAY_URL ?? defaultConfig.CU_URL,
      MU_URL: connectionConfig?.MU_URL ?? defaultConfig.MU_URL,
      GATEWAY_URL: connectionConfig?.GATEWAY_URL ?? defaultConfig.GATEWAY_URL
    });
  }

  async createAoSigner(
    wallet: JWKInterface
  ): Promise<
    (args: {
      data: string | Buffer;
      tags?: { name: string; value: string }[];
      target?: string;
      anchor?: string;
    }) => Promise<{ id: string; raw: ArrayBuffer }>
  > {
    const aoSigner = async ({ data, tags, target, anchor }) => {
      const signer = new ArweaveSigner(wallet);
      const dataItem = createData(data, signer, { tags, target, anchor });

      await dataItem.sign(signer);

      return {
        id: dataItem.id,
        raw: dataItem.getRaw()
      };
    };

    return aoSigner;
  }

  async read<K>({
    tags,
    retries = 3
  }: {
    tags?: Array<{ name: string; value: string }>;
    retries?: number;
  }): Promise<K> {
    let attempts = 0;
    let lastError: Error | undefined;
    while (attempts < retries) {
      try {
        console.debug(`Evaluating read interaction on contract`, {
          tags
        });
        // map tags to inputs
        const result = await this.ao.dryrun({
          process: this.processId,
          tags
        });

        if (result.Error !== undefined) {
          throw new Error(result.Error);
        }

        if (result.Messages.length === 0) {
          throw new Error("Process does not support provided action.");
        }

        console.debug(`Read interaction result`, {
          result: result.Messages[0].Data
        });

        const data: K = JSON.parse(result.Messages[0].Data);
        return data;
      } catch (e) {
        attempts++;
        console.debug(`Read attempt ${attempts} failed`, {
          error: e,
          tags
        });
        lastError = e;
        // exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 2 ** attempts * 1000)
        );
      }
    }
    throw lastError;
  }

  async send<I, K>({
    tags,
    data,
    wallet
  }: {
    tags: Array<{ name: string; value: string }>;
    data?: I;
    wallet: JWKInterface;
  }): Promise<{ id: string; result?: K }> {
    console.debug(`Evaluating send interaction on contract`, {
      tags,
      data,
      processId: this.processId
    });

    // append ar-io-sdk tags

    const messageId = await this.ao.message({
      process: this.processId,
      tags: [...tags],
      data: JSON.stringify(data),
      signer: await this.createAoSigner(wallet)
    });

    console.debug(`Sent message to process`, {
      messageId,
      processId: this.processId
    });

    // check the result of the send interaction
    const output = await this.ao.result({
      message: messageId,
      process: this.processId
    });

    console.debug("Message result", {
      output,
      messageId,
      processId: this.processId
    });

    // check if there are any Messages in the output
    if (output.Messages.length === 0) {
      return { id: messageId };
    }

    const tagsOutput = output.Messages[0].Tags;
    const error = tagsOutput.find((tag) => tag.name === "Error");
    // if there's an Error tag, throw an error related to it
    if (error) {
      const result = output.Messages[0].Data;
      throw new Error(`${error.Value}: ${result}`);
    }

    const resultData: K = JSON.parse(output.Messages[0].Data);

    console.debug("Message result data", {
      resultData,
      messageId,
      processId: this.processId
    });

    return { id: messageId, result: resultData };
  }
}
