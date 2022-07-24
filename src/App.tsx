import Form, { useForm, Field } from "./rc-field-form";
import Input from "./rc-field-form/Input";

const nameRules = { required: true, message: "请输入姓名！" };
const passwordRules = { required: true, message: "请输入密码！" };

export default () => {
  const [form] = useForm();

  const onFinish = (res: any) => {
    console.log("表单提交: ", res);
  };

  const onFinishFailed = (errors: any) => {
    console.log("表单提交失败: ", errors);
  };

  return (
    <Form
      form={form}
      // preserve={false}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Field name="name" rules={[nameRules]}>
        <Input placeholder="Username" />
      </Field>
      <Field dependencies={["name"]}>
        {() => {
          return form.getFieldValue("name") === "1" ? (
            <Field name="password" rules={[passwordRules]}>
              <Input placeholder="Password" />
            </Field>
          ) : null;
        }}
      </Field>
      <Field dependencies={["password"]}>
        {() => {
          const password = form.getFieldValue("password");
          console.log(">>>", password);
          return password ? (
            <Field name="password2">
              <Input placeholder="Password 2" />
            </Field>
          ) : null;
        }}
      </Field>
      <button type="submit">submit</button>
    </Form>
  );
};
