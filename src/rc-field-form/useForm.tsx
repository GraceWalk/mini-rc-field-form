import { useRef } from "react";
import {
  FieldEntity,
  FormInstance,
  NamePath,
  Store,
  StoreValue,
} from "./interface";

interface UpdateAction {
  type: "updateValue";
  namePath: NamePath;
  value: StoreValue;
}

interface ValidateAction {
  type: "validateField";
  namePath: NamePath;
  triggerName: string;
}

export type ReducerAction = UpdateAction | ValidateAction;

interface ValueUpdateInfo {
  type: "valueUpdate";
}

export type NotifyInfo = ValueUpdateInfo;

export type ValuedNotifyInfo = NotifyInfo & {
  store: Store;
};

export interface ValidateOptions {
  triggerName?: string;
}

class FormStore {
  private store: Store = {};
  private fieldEntities: FieldEntity[] = [];

  // 对外暴露 API
  public getForm = (): FormInstance => ({
    getFieldValue: this.getFieldValue,
    getFieldsValue: this.getFieldsValue,
    setFieldValue: this.setFieldValue,
    setFieldsValue: this.setFieldsValue,
    dispatch: this.dispatch,
    registerField: this.registerField,
  });

  private registerField = (entity: FieldEntity) => {
    this.fieldEntities.push(entity);
  };

  private getFieldValue = (name: NamePath) => {
    return this.store[name];
  };

  private getFieldsValue = () => {
    return { ...this.store };
  };

  private setFieldValue = (name: NamePath, value: any) => {
    this.store[name] = value;
  };

  private setFieldsValue = (newValues: any) => {
    return { ...this.store, ...newValues };
  };

  private updateStore = (nextStore: Store) => {
    this.store = nextStore;
  };

  private getFieldEntities = () => {
    return this.fieldEntities;
  };

  private notifyObservers = (
    prevStore: Store,
    name: NamePath,
    info: NotifyInfo
  ) => {
    const mergedInfo: ValuedNotifyInfo = {
      ...info,
      store: this.getFieldsValue(),
    };
    this.getFieldEntities().forEach(({ onStoreChange }) => {
      onStoreChange(prevStore, name, mergedInfo);
    });
  };

  private dispatch = (action: ReducerAction) => {
    switch (action.type) {
      case "updateValue": {
        const { namePath, value } = action;
        this.updateValue(namePath, value);
        break;
      }
      case "validateField": {
        break;
      }
      default:
    }
  };

  private updateValue = (name: NamePath, value: StoreValue) => {
    const prevStore = this.store;
    // 1. 更新 store 对象
    this.updateStore({
      ...this.store,
      [name]: value, // 这里要注意 key 值是 [name] 而不是 'name'
    });
    // 2. 触发对应组件的更新
    this.notifyObservers(prevStore, name, {
      type: "valueUpdate",
    });
  };
}

export default function useForm(formInstance?: FormInstance) {
  // 创建一个 ref 用于保存实例，直到组件被销毁
  const formRef = useRef<FormInstance>();

  // 如果 store 还没被初始化
  if (!formRef.current) {
    // 如果外界传入了实例，直接使用
    if (formInstance) {
      formRef.current = formInstance;
    } else {
      // 否则，创建一个实例
      formRef.current = new FormStore().getForm();
    }
  }

  return [formRef.current];
}
