import { Values } from "async-validator";
import { useRef } from "react";
import {
  FieldEntity,
  FieldError,
  FormInstance,
  NamePath,
  RuleError,
  Store,
  StoreValue,
  ValidateErrorEntity,
  ValidateOptions,
} from "./interface";
import { allPromiseFinish } from "./utils/asyncUtil";

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

interface ValidateFinishInfo {
  type: "validateFinish";
}

interface DependenciesUpdateInfo {
  type: "dependenciesUpdate";
}

export type NotifyInfo =
  | ValueUpdateInfo
  | ValidateFinishInfo
  | DependenciesUpdateInfo;

export type ValuedNotifyInfo = NotifyInfo & {
  store: Store;
};

export interface Callbacks {
  onFinish?: (values: Values) => void;
  onFinishFailed?: (errorInfo: ValidateErrorEntity) => void;
}

class FormStore {
  private store: Store = {};
  private fieldEntities: FieldEntity[] = [];
  private callbacks: Callbacks = {};

  // 对外暴露 API
  public getForm = (): FormInstance => ({
    getFieldValue: this.getFieldValue,
    getFieldsValue: this.getFieldsValue,
    setFieldValue: this.setFieldValue,
    setFieldsValue: this.setFieldsValue,
    dispatch: this.dispatch,
    registerField: this.registerField,
    setCallbacks: this.setCallbacks,
    submit: this.submit,
  });

  private registerField = (entity: FieldEntity) => {
    this.fieldEntities.push(entity);

    // 销毁 Field 回调函数
    return () => {
      this.fieldEntities = this.fieldEntities.filter((item) => item !== entity);
      const fieldName = entity.props.name;
      if (fieldName) {
        delete this.store[fieldName];
        this.triggerDependenciesUpdate(this.store, [fieldName]);
      }
    };
  };

  private setCallbacks = (callbacks: Callbacks) => {
    this.callbacks = callbacks;
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

  private getDependencyChildrenFields = (rootPath: NamePath) => {
    const dependenciesToFields: {
      [k: string]: FieldEntity[];
    } = {};
    const childrenFields: NamePath[] = [];

    // 生成单个依赖字段到对应 Field 的表，即 { 依赖字段：对应的 Field }
    this.getFieldEntities().forEach((field, i) => {
      const { dependencies } = field.props;
      if (dependencies?.length) {
        dependencies.forEach((dep) => {
          if (!dependenciesToFields[dep]) {
            dependenciesToFields[dep] = [field];
          } else {
            dependenciesToFields[dep].push(field);
          }
        });
      }
    });

    // 遍历找到所有需要更新的 Field
    const fillChildren = (depName: NamePath) => {
      const fields = dependenciesToFields[depName];
      fields?.length &&
        fields.forEach((field) => {
          const name = field.props.name;
          if (name) {
            childrenFields.push(name);
            // 重点在这里，如果有别的 field 依赖这个依赖项，那么父亲依赖变化时，别的依赖项也要改变
            fillChildren(name);
          }
        });
    };

    // 开始递归查找
    fillChildren(rootPath);

    return childrenFields;
  };

  private notifyObservers = (
    prevStore: Store,
    name: NamePath[],
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
        const { namePath, triggerName } = action;
        this.validateFields([namePath], { triggerName });
        break;
      }
      default:
    }
  };

  private triggerDependenciesUpdate = (prevStore: Store, name: NamePath[]) => {
    const childrenFields = this.getDependencyChildrenFields(name[0]);
    // 对依赖项进行校验，比如密码和确认密码的场景，当我们输入密码后需要立即校验密码输入是否一致
    // 官方例子见 https://ant.design/components/form-cn/#components-form-demo-register
    if (childrenFields.length) {
      this.validateFields(childrenFields);
    }

    this.notifyObservers(prevStore, name.concat(childrenFields), {
      type: "dependenciesUpdate",
    });

    return childrenFields;
  };

  private updateValue = (name: NamePath, value: StoreValue) => {
    const prevStore = this.store;
    // 1. 更新 store 对象
    this.updateStore({
      ...this.store,
      [name]: value, // 这里要注意 key 值是 [name] 而不是 'name'
    });
    // 2. 触发对应组件的更新
    this.notifyObservers(prevStore, [name], {
      type: "valueUpdate",
    });
    // 3. 触发依赖项更新
    this.triggerDependenciesUpdate(prevStore, [name]);
  };

  private validateFields = (names?: NamePath[], options?: ValidateOptions) => {
    const promiseList: Promise<FieldError>[] = [];

    this.getFieldEntities().forEach((field) => {
      // 1. 如果该 field 没有定义 rules，直接跳过
      if (!field.props.rules || !field.props.rules.length) {
        return;
      }

      // 2. 如果触发校验的 field 不是当前 field，直接跳过
      if (!names?.includes(field.props.name || "")) {
        return;
      }

      // 3. 调用 field 自身的方法进行校验，返回一个 promise
      const promise = field.validateRules();

      // 4. 将 promise 存放到 promiseList 中
      promiseList.push(
        promise
          .then<any, RuleError>(() => {
            return { name, errors: [], warnings: [] };
          })
          .catch((ruleErrors: RuleError[]) => {
            const mergedErrors: string[] = [];
            const mergedWarnings: string[] = [];

            ruleErrors.forEach(({ rule: { warningOnly }, errors }) => {
              if (warningOnly) {
                mergedWarnings.push(...errors);
              } else {
                mergedErrors.push(...errors);
              }
            });

            if (mergedErrors.length) {
              return Promise.reject({
                name,
                errors: mergedErrors,
                warnings: mergedWarnings,
              });
            }

            return {
              name,
              errors: mergedErrors,
              warnings: mergedWarnings,
            };
          })
      );
    });

    // 5. 这一步很关键，allPromiseFinish 返回一个新的 Promise ，等待 promiseList 中的所有 promise 都完成
    const summaryPromise = allPromiseFinish(promiseList);
    // Notify fields with rule that validate has finished and need update
    summaryPromise
      .catch((results) => results)
      .then((results: FieldError[]) => {
        console.log("validateResults---", results);
        // 获取到校验失败的 fields 的错误信息
        const resultNamePathList: NamePath[] = results.map(({ name }) => name);
        // 6. 通知这些 fields 更新
        this.notifyObservers(this.store, resultNamePathList, {
          type: "validateFinish",
        });
      });

    // 6. 返回校验结果，供 submit 或者用户自行调用 this.validateFields() 时进行后续操作
    const returnPromise = summaryPromise
      .then(() => {
        return Promise.resolve(this.getFieldsValue());
      })
      .catch((results: { name: NamePath; errors: string[] }[]) => {
        const errorList = results.filter(
          (result) => result && result.errors.length
        );
        return Promise.reject({
          values: this.getFieldsValue(),
          errorFields: errorList,
        });
      });

    return returnPromise;
  };

  // 表单提交
  private submit = () => {
    this.validateFields()
      .then((res) => {
        const { onFinish } = this.callbacks;
        onFinish && onFinish(res);
      })
      .catch((errors) => {
        const { onFinishFailed } = this.callbacks;
        onFinishFailed && onFinishFailed(errors);
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
