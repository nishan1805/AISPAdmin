import * as yup from "yup";
import {
  requiredString,
  optionalString,
  pdfOrImageValidation,
  imageFileValidation,
  pdfFileValidation,
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
  // file: required only for create flows. When resolver receives context { isEdit: true } file becomes optional
  file: yup.mixed().test("file-required-if-create", function (value) {
    const isEdit = !!(this?.options as any)?.context?.isEdit;
    if (isEdit) return true; // optional in edit mode
    // create mode: validate via pdfOrImageValidation
    const validator = pdfOrImageValidation(5);
    try {
      validator.validateSync(value);
      return true;
    } catch (e: any) {
      return this.createError({ message: e?.message || "A valid file is required" });
    }
  }),
});



export const disclosureSchema = yup.object({
  title: yup.string().required("Title is required"),
  description: yup.string().nullable(),
  file: yup.mixed().test("file-required-if-create", function (value) {
    const isEdit = !!(this?.options as any)?.context?.isEdit;
    if (isEdit) return true; // optional in edit mode
    // create mode: validate via pdfFileValidation
    const validator = pdfFileValidation(10); // 10MB max, for example
    try {
      validator.validateSync(value);
      return true;
    } catch (e: any) {
      return this.createError({ message: e?.message || "A valid file is required" });
    }
  }),
});