import * as yup from "yup";

export const loginFormSchema = yup.object({
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: requiredString("Password"),
});


export const updateFormSchema = yup.object({
  title: requiredString("Title"),
  description: optionalString(),
  file: pdfFileValidation(10),
});
