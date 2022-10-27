import { Warp, WarpFactory } from "warp-contracts";

export default class Token {
  /** Token contract ID */
  public id: string;

  /** Contract state */
  public state: Record<string, any>;

  private warp: Warp;

  constructor(id: string) {
    this.id = id;
    this.warp = WarpFactory.forMainnet();
  }

  /** Sync state to the latest one */
  public async sync() {
    this.warp.contract(this.id).readState();
  }
}
