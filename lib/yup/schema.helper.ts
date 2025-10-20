import * as yup from "yup";

export const requiredString = (fieldName: string) =>
  yup.string().required(`${fieldName} is required`);

export const optionalString = () => yup.string().nullable();

export const pdfFileValidation = (maxSizeMB: number = 10) =>
  yup
    .mixed<File>()
    .required("A PDF file is required")
    .test("fileSize", `File size should be less than ${maxSizeMB} MB`, (file) =>
      file ? file.size <= maxSizeMB * 1024 * 1024 : false
    )
    .test("fileType", "Only PDF files are allowed", (file) =>
      file ? file.type === "application/pdf" : false
    );

export const imageFileValidation = (
  maxSizeMB: number = 5,
  allowedTypes: string[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ]
) =>
  yup
    .mixed<File>()
    .required("An image file is required")
    .test("fileSize", `Image size should be less than ${maxSizeMB} MB`, (file) =>
      file ? file.size <= maxSizeMB * 1024 * 1024 : false
    )
    .test("fileType", "Only image files are allowed", (file) =>
      file ? allowedTypes.includes(file.type) : false
    );

export const fileValidation = (
  maxSizeMB: number = 10,
  allowedTypes: string[] = ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
) =>
  yup
    .mixed<File>()
    .required("A file is required")
    .test("fileSize", `File size should be less than ${maxSizeMB} MB`, (file) =>
      file ? file.size <= maxSizeMB * 1024 * 1024 : false
    )
    .test("fileType", "File type not allowed", (file) =>
      file ? allowedTypes.includes(file.type) : false
    );

export const pdfOrImageValidation = (maxSizeMB: number = 10) =>
  fileValidation(maxSizeMB, ["application/pdf", "image/jpeg", "image/png", "image/webp"]);

