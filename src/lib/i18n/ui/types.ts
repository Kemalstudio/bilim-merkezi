import type ru from "./ru";

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? Widen<Item>[]
    : { [Key in keyof T]: Widen<T[Key]> };

/** The shape every interface dictionary follows; Russian is the reference. */
export type Ui = Widen<typeof ru>;

/** Noun forms by Intl.PluralRules category. */
export type PluralForms = Ui["units"]["lesson"];
