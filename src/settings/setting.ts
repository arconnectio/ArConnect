import { Storage } from "@plasmohq/storage";
import { PREFIX } from "~settings";

export default class Setting {
  /** Name of the setting */
  public name: string;

  /** Display name of the setting */
  public displayName: string;

  /** Setting description */
  public description?: string;

  /** Type of the setting */
  public type: SettingType;

  /** Subsettings for list types */
  public subsettings?: Setting[];

  /** Pickable options */
  public options?: ValueType[];

  /** Name in extension storage */
  public storageName: string;

  /** Storage to fetch from */
  #storage: Storage;

  constructor({ name, displayName, description, type, subsettings, options }: InitParams) {
    this.name = name;
    this.displayName = displayName;
    this.description = description;
    this.type = type;

    // set storage name
    this.storageName = `${PREFIX}${name}`;

    // init storage
    this.#storage = new Storage({
      area: "local"
    });

    // add subsettings
    if (type === "list") {
      if (!subsettings) throw new Error("Subsettings not defined");

      this.subsettings = subsettings;
    }

    // add options
    if (type === "pick") {
      if (!options) throw new Error("Options not defined");

      this.options = options;
    }
  }

  /**
   * Get the current value of the setting
   */
  public async getValue(): Promise<ValueType | Setting[]> {
    // return the subsettings for a list setting type
    if (this.type === "list") {
      return this.subsettings;
    }

    return await this.#storage.get(this.storageName);
  }

  /**
   * Set the value of the setting
   */
  public async setValue(value: ValueType) {
    // the value of list types is read only
    if (this.type === "list") {
      throw new Error(
        "List settings are read only. Modify the subsettings instead"
      );
    } else 
    // ensure the picked option is from the
    // defined options
    if (this.type === "pick" && !this.options.includes(value)) {
      throw new Error(
        "Selected option is not included in the defined options"
      );
    } else 
    // ensure the submitted value's type is correct
    if (this.type !== "pick" && typeof value !== this.type) {
      throw new Error("Invalid value submitted");
    }

    // update value
    await this.#storage.set(this.storageName, value);
  }
}

/**
 * signle - Single setting, can be string / boolean / number
 * pick - Pick from a list
 * list - List / array of settings
 */
type SettingType = "string" | "number" | "boolean" | "pick" | "list";
export type ValueType = string | number | boolean;

interface InitParams {
  name: string;
  displayName: string;
  description?: string;
  type: SettingType;
  subsettings?: Setting[];
  options?: ValueType[];
}
