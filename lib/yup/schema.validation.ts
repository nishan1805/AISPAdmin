import * as yup from "yup";
import {
  requiredString,
  optionalString,
  pdfOrImageValidation,
  imageFileValidation,
} from "./schema.helper";

export const galleryFormSchema = yup.object({
  title: requiredString("Album name"),
  eventDate: yup.string().required("Event Date is required"),
  description: yup.string().nullable(),
  files: yup
    .array()
    .of(imageFileValidation(5))
    .min(1, "At least one image is required")
    .required("Images are required"),
});

export type GalleryFormData = yup.InferType<typeof galleryFormSchema>;

export const loginFormSchema = yup.object({
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: requiredString("Password"),
});

export const updateFormSchema = yup.object({
  title: requiredString("Title"),
  description: optionalString(),
  file: pdfOrImageValidation(10),
});
