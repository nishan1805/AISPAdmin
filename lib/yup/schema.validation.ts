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
  files: yup.array().test("files-required-if-create", function (value) {
    const isEdit = !!(this?.options as any)?.context?.isEdit;
    if (isEdit) return true; // optional in edit mode
    
    // create mode: require at least one image
    if (!value || !Array.isArray(value) || value.length === 0) {
      return this.createError({ message: "At least one image is required" });
    }
    
    // validate each file
    for (const file of value) {
      const validator = imageFileValidation(5);
      try {
        validator.validateSync(file);
      } catch (e: any) {
        return this.createError({ message: e?.message || "Invalid image file" });
      }
    }
    
    return true;
  }),
});

export type GalleryFormData = yup.InferType<typeof galleryFormSchema>;

export const loginFormSchema = yup.object({
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: requiredString("Password"),
});

export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

export const updateFormSchema = yup.object({
  title: requiredString("Title"),
  description: optionalString(),
  // file: required only for create flows. When resolver receives context { isEdit: true } file becomes optional
  file: yup.mixed().test("file-required-if-create", function (value) {
    const isEdit = !!(this?.options as any)?.context?.isEdit;
    if (isEdit) return true; // optional in edit mode
    // create mode: validate via pdfFileValidation
    const validator = pdfFileValidation(5);
    try {
      validator.validateSync(value);
      return true;
    } catch (e: any) {
      return this.createError({ message: e?.message || "A valid PDF file is required" });
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

export const staffSchema = yup.object({
  name: yup.string().required("Name is required"),
  designation: yup.string().required("Designation is required"),
  category: yup.string().required("Category is required"),
  file: yup.mixed().test("file-required-if-create", function (value) {
    const isEdit = !!(this?.options as any)?.context?.isEdit;
    if (isEdit) return true; // optional in edit mode
    // create mode: validate via pdfFileValidation
    const validator = imageFileValidation(10); // 10MB max, for example
    try {
      validator.validateSync(value);
      return true;
    } catch (e: any) {
      return this.createError({ message: e?.message || "A valid file is required" });
    }
  }),
});