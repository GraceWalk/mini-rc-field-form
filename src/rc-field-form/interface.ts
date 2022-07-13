import type { ReactElement } from 'react';
import { ReducerAction, ValuedNotifyInfo } from "./useForm";

export type InternalNamePath = (string | number)[];
export type NamePath = string | number;

export type StoreValue = any;
export type Store = Record<string, StoreValue>;

export type RuleObject = AggregationRule | ArrayRule;
export type RuleRender = (form: FormInstance) => RuleObject;
export type Rule = RuleObject | RuleRender;

export interface ValidateOptions {
  triggerName?: string;
}

export interface FormInstance {
  getFieldValue: (name: NamePath) => StoreValue;
  getFieldsValue: () => any;
  setFieldValue: (name: NamePath, value: any) => void;
  setFieldsValue: (values: any) => void;
  dispatch: (action: ReducerAction) => void;
  registerField: (entity: FieldEntity) => void;
}

export interface ValidateErrorEntity {
  values: any;
  errorFields: { name: NamePath; errors: string[] }[];
  outOfDate: boolean;
}

export interface FieldEntity {
  props: {
    name?: NamePath;
    rules?: Rule[];
    dependencies?: NamePath[];
    initialValue?: any;
  };
  onStoreChange: (
    store: Store,
    namePathList: NamePath[],
    info: ValuedNotifyInfo,
  ) => void;
  validateRules: (options?: ValidateOptions) => Promise<RuleError[]>;
}

export type RuleType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'method'
  | 'regexp'
  | 'integer'
  | 'float'
  | 'object'
  | 'enum'
  | 'date'
  | 'url'
  | 'hex'
  | 'email';

type Validator = (
  rule: RuleObject,
  value: StoreValue,
  callback: (error?: string) => void,
) => Promise<void | any> | void;

export interface ValidatorRule {
  warningOnly?: boolean;
  message?: string | ReactElement;
  validator: Validator;
}

interface BaseRule {
  warningOnly?: boolean;
  enum?: StoreValue[];
  len?: number;
  max?: number;
  message?: string | ReactElement;
  min?: number;
  pattern?: RegExp;
  required?: boolean;
  transform?: (value: StoreValue) => StoreValue;
  type?: RuleType;
  whitespace?: boolean;

  /** Customize rule level `validateTrigger`. Must be subset of Field `validateTrigger` */
  validateTrigger?: string | string[];
}

type AggregationRule = BaseRule & Partial<ValidatorRule>;

interface ArrayRule extends Omit<AggregationRule, 'type'> {
  type: 'array';
  defaultField?: RuleObject;
}

export interface FieldError {
  name: NamePath;
  errors: string[];
  warnings: string[];
}

export interface RuleError {
  errors: string[];
  rule: RuleObject;
}
