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

