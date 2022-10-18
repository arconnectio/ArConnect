import { getStorageConfig } from "~utils/storage";
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

  /** Default value of the setting */
  public defaultValue: ValueType;

  /** Pickable options */
  public options?: ValueType[];

  /** Name in extension storage */
  public storageName: string;

  /** Setting display icon */
  public icon: Icon;

  /** Storage to fetch from */
  #storage: Storage;

  constructor({
    name,
    displayName,
    description,
    type,
    defaultValue,
    options,
    icon
  }: InitParams) {
    this.name = name;
    this.displayName = displayName;
    this.description = description;
    this.type = type;
    this.defaultValue = defaultValue;
    this.icon = icon;

    // set storage name
    this.storageName = `${PREFIX}${name}`;

    // init storage
    this.#storage = new Storage(getStorageConfig());

    // add options
    if (type === "pick") {
      if (!options) throw new Error("Options not defined");

      this.options = options;
    }
  }

  /**
   * Get the current value of the setting
   */
  public async getValue<T = ValueType>(): Promise<T> {
    const value = await this.#storage.get<T>(this.storageName);

    // if the setting is not yet set,
    // return the default value
    if (typeof value === "undefined") {
      // @ts-expect-error
      return this.defaultValue;
    }

    return value;
  }

  /**
   * Set the value of the setting
   */
  public async setValue(value: ValueType) {
    // ensure the picked option is from the
    // defined options
    if (this.type === "pick" && !this.options.includes(value)) {
      throw new Error("Selected option is not included in the defined options");
    }
    // ensure the submitted value's type is correct
    else if (this.type !== "pick" && typeof value !== this.type) {
      throw new Error("Invalid value submitted");
    }

    // update value
    await this.#storage.set(this.storageName, value);
  }
}

/**
 * string / number / boolean
 * pick - Pick from a list
 */
type SettingType = "string" | "number" | "boolean" | "pick";
export type ValueType = string | number | boolean;

export type Icon = (props: React.ComponentProps<"svg">) => JSX.Element;

interface InitParams {
  name: string;
  displayName: string;
  icon: Icon;
  description?: string;
  type: SettingType;
  defaultValue: ValueType;
  options?: ValueType[];
}
