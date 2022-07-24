import React from "react";
import FieldContext from "./FieldContext";
import { FormInstance } from "./interface";
import useForm, { Callbacks } from "./useForm";

export type FormProps = {
  form?: FormInstance;
  children?: React.ReactNode;
} & Callbacks;

export default function Form({
  form,
  children,
  onFinish,
  onFinishFailed,
  ...restProps
}: FormProps) {
  // 1. 创建实例
  const [formInstance] = useForm(form);

  // 2. 使用 Context 将实例包裹 children
  const wrapperNode = (
    <FieldContext.Provider value={formInstance}>
      {children}
    </FieldContext.Provider>
  );

  // 3. 存储提交表单后的回调
  const { setCallbacks } = formInstance;
  setCallbacks({
    onFinish,
    onFinishFailed,
  });

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
