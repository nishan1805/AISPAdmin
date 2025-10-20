import * as yup from "yup";
import { optionalString, pdfOrImageValidation, requiredString } from "./schema.helper";

export const loginFormSchema = yup.object({
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: requiredString("Password"),
});


export const updateFormSchema = yup.object({
  title: requiredString("Title"),
  description: optionalString(),
  file: pdfOrImageValidation(10),
});
