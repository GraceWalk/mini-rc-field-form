import React from "react";
import FieldContext from "./FieldContext";
import { FieldEntity, FormInstance } from "./interface";

interface InternalFieldProps {
  children?: React.ReactElement;
  name: string;
  fieldContext: FormInstance;
  rules?: any[];
}

interface ChildProps {
  [name: string]: any;
}

class Field extends React.Component<InternalFieldProps> {
  public static contextType = FieldContext;
  private mounted = false;

  componentDidMount() {
    this.mounted = true;
    const { fieldContext } = this.props;
    const { registerField } = fieldContext;
    registerField(this);
  }

  public getControlled = (props: ChildProps) => {
    const { fieldContext, name } = this.props;
    const { getFieldValue, dispatch } = fieldContext;
    return {
      value: getFieldValue(name),
      onChange: (e) => {
        // 获取输入值
        const newValue = e.target?.value;

        // 更新 store 中存储的值
        dispatch({
          type: "updateValue",
          namePath: name,
          value: newValue,
        });

        // 进行表单校验
        dispatch({
          type: "validateField",
          namePath: name,
          triggerName: "onChange",
        });
      },
    };
  };

  public reRender() {
    if (!this.mounted) return;
    this.forceUpdate();
  }

  public onStoreChange: FieldEntity["onStoreChange"] = (
    prevStore,
    namePath,
    info
  ) => {
    // 确定当前 Field 是否需要更新
    const namePathMatch = namePath && namePath === this.props.name;

    switch (info.type) {
      default:
        if (namePathMatch) {
          this.reRender();
          return;
        }
    }
  };
}

function WrapperField({ name, ...restProps }: any) {
  // 获取 fieldContext 并传递下去
  const fieldContext = React.useContext(FieldContext);
  return (
    <Field key={name} name={name} {...restProps} fieldContext={fieldContext} />
  );
}

export default WrapperField;
