import warning from "rc-util/lib/warning";
import { createContext } from "react";
import { FormInstance } from "./interface";

const warningFunc: any = () => {
  warning(
    false,
    "Can not find FormContext. Please make sure you wrap Field under Form."
  );
};

const FieldContext = createContext<FormInstance>({
  getFieldValue: warningFunc,
  getFieldsValue: warningFunc,
  setFieldValue: warningFunc,
  setFieldsValue: warningFunc,
});

export default FieldContext;
