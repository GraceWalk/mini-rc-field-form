import React from "react";
import FieldContext from "./FieldContext";
import { FormInstance, ValidateErrorEntity } from "./interface";
import useForm from "./useForm";

export interface FormProps {
  form?: FormInstance;
  children?: React.ReactNode;
  onFinish?: () => (values: any) => void;
  onFinishFailed?: (errorInfo: ValidateErrorEntity) => void;
}

export default function Form({ form, children, ...restProps }: FormProps) {
  // 1. 创建实例
  const [formInstance] = useForm(form);

  // 2. 使用 Context 将实例包裹 children
  const wrapperNode = (
    <FieldContext.Provider value={formInstance}>
      {children}
    </FieldContext.Provider>
  );

  return (
    <form
      {...restProps}
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        // 阻止 form 默认行为和事件传播
        event.preventDefault();
        event.stopPropagation();

        // 触发提交操作
        formInstance.submit();
      }}
    >
      {wrapperNode}
    </form>
  );
}
