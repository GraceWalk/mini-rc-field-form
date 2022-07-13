import { ReducerAction, ValuedNotifyInfo } from "./useForm";

export type NamePath = string | number;

export type StoreValue = any;
export type Store = Record<string, StoreValue>;

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
  props: any;
  onStoreChange: (
    store: Store,
    namePathList: NamePath,
    info: ValuedNotifyInfo,
  ) => void;
  validateRules: any;
}
