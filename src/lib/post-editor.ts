import { DEFAULT_SALARY_CURRENCY } from "@/constants";
import type { Post, PostType, SalaryCurrency } from "@/types";

export type EditorContactType = "email" | "phone" | "other";
export type JobSeekingFormMode = "basic" | "detailed";

export interface EditorContactItem {
  id: string;
  type: EditorContactType;
  value: string;
}

export interface EditorLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface PostEditorInitialValues {
  postType: PostType;
  jobSeekingFormMode: JobSeekingFormMode;
  jobType: "full_time" | "part_time";
  location: EditorLocation | null;
  companyName: string;
  jobOfferTitle: string;
  jobOfferDescription: string;
  jobOfferRequirements: string;
  jobOfferBenefits: string;
  contactItems: EditorContactItem[];
  jobSeekingTitle: string;
  jobSeekingBasicContent: string;
  candidateSummary: string;
  candidateDescription: string;
  candidateRequirements: string;
  candidateBenefits: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: SalaryCurrency;
}

const EMPTY_CONTACTS: EditorContactItem[] = [
  { id: "contact-1", type: "email", value: "" },
];

const JOB_OFFER_SECTION_LABELS = [
  "Mô tả công việc",
  "Yêu cầu ứng viên",
  "Quyền lợi",
  "Thông tin liên lạc",
] as const;

const JOB_SEEKING_SECTION_LABELS = [
  "Giới thiệu",
  "Mô tả năng lực / kinh nghiệm",
  "Kỹ năng / kinh nghiệm",
  "Kỳ vọng / mong muốn",
] as const;

function joinAndTrim(lines: string[]) {
  return lines.join("\n").trim();
}

function splitStructuredContent<const T extends readonly string[]>(
  content: string,
  labels: T
) {
  const buffers = Object.fromEntries(labels.map((label) => [label, [] as string[]])) as Record<
    T[number],
    string[]
  >;
  const fallback: string[] = [];
  let currentLabel: T[number] | null = null;
  let hasStructuredSections = false;

  for (const line of content.split("\n")) {
    const trimmedLine = line.trim();
    const matchedLabel = labels.find((label) => trimmedLine === `${label}:`) ?? null;

    if (matchedLabel) {
      currentLabel = matchedLabel;
      hasStructuredSections = true;
      continue;
    }

    if (currentLabel) {
      buffers[currentLabel].push(line);
    } else {
      fallback.push(line);
    }
  }

  const sections = {} as Record<T[number], string>;

  labels.forEach((label) => {
    const sectionLabel = label as T[number];
    sections[sectionLabel] = joinAndTrim(buffers[sectionLabel]);
  });

  return {
    sections,
    fallback: joinAndTrim(fallback),
    hasStructuredSections,
  };
}

function createContactItem(
  type: EditorContactType,
  value: string,
  index: number
): EditorContactItem {
  return {
    id: `contact-${index + 1}`,
    type,
    value,
  };
}

function parseJobOfferTitle(title: string) {
  const separatorIndex = title.lastIndexOf(" - ");

  if (separatorIndex <= 0) {
    return {
      companyName: "",
      jobOfferTitle: title,
    };
  }

  return {
    companyName: title.slice(separatorIndex + 3).trim(),
    jobOfferTitle: title.slice(0, separatorIndex).trim(),
  };
}

function parseContactItems(
  contactSection: string,
  email: string | null
): EditorContactItem[] {
  const contacts = contactSection
    .split("\n")
    .map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        return null;
      }

      const normalizedLine = trimmedLine.startsWith("-")
        ? trimmedLine.slice(1).trim()
        : trimmedLine;
      const separatorIndex = normalizedLine.indexOf(":");
      const rawLabel =
        separatorIndex >= 0
          ? normalizedLine.slice(0, separatorIndex).trim().toLowerCase()
          : "other";
      const value =
        separatorIndex >= 0
          ? normalizedLine.slice(separatorIndex + 1).trim()
          : normalizedLine.trim();

      if (!value) {
        return null;
      }

      let type: EditorContactType = "other";
      if (rawLabel.includes("email")) {
        type = "email";
      } else if (
        rawLabel.includes("phone") ||
        rawLabel.includes("điện") ||
        rawLabel.includes("dien")
      ) {
        type = "phone";
      }

      return createContactItem(type, value, index);
    })
    .filter((item): item is EditorContactItem => item !== null);

  if (contacts.length > 0) {
    return contacts;
  }

  if (email?.trim()) {
    return [createContactItem("email", email.trim(), 0)];
  }

  return EMPTY_CONTACTS;
}

function toSalaryString(value: number | null) {
  return value === null ? "" : String(value);
}

export function getInitialPostEditorValues(post?: Post): PostEditorInitialValues {
  if (!post) {
    return {
      postType: "job_offer",
      jobSeekingFormMode: "detailed",
      jobType: "full_time",
      location: null,
      companyName: "",
      jobOfferTitle: "",
      jobOfferDescription: "",
      jobOfferRequirements: "",
      jobOfferBenefits: "",
      contactItems: EMPTY_CONTACTS,
      jobSeekingTitle: "",
      jobSeekingBasicContent: "",
      candidateSummary: "",
      candidateDescription: "",
      candidateRequirements: "",
      candidateBenefits: "",
      salaryMin: "",
      salaryMax: "",
      salaryCurrency: DEFAULT_SALARY_CURRENCY,
    };
  }

  if (post.type === "job_offer") {
    const { companyName, jobOfferTitle } = parseJobOfferTitle(post.title);
    const parsedContent = splitStructuredContent(post.content, JOB_OFFER_SECTION_LABELS);

    return {
      postType: "job_offer",
      jobSeekingFormMode: "detailed",
      jobType: post.job_type ?? "full_time",
      location:
        post.lat !== null && post.lng !== null && post.location_name
          ? {
              lat: post.lat,
              lng: post.lng,
              name: post.location_name,
            }
          : null,
      companyName,
      jobOfferTitle,
      jobOfferDescription:
        parsedContent.sections["Mô tả công việc"] || parsedContent.fallback || post.content,
      jobOfferRequirements: parsedContent.sections["Yêu cầu ứng viên"],
      jobOfferBenefits: parsedContent.sections["Quyền lợi"],
      contactItems: parseContactItems(parsedContent.sections["Thông tin liên lạc"], post.email),
      jobSeekingTitle: "",
      jobSeekingBasicContent: "",
      candidateSummary: "",
      candidateDescription: "",
      candidateRequirements: "",
      candidateBenefits: "",
      salaryMin: toSalaryString(post.salary_min),
      salaryMax: toSalaryString(post.salary_max),
      salaryCurrency: post.salary_currency ?? DEFAULT_SALARY_CURRENCY,
    };
  }

  const parsedContent = splitStructuredContent(post.content, JOB_SEEKING_SECTION_LABELS);
  const isDetailed = parsedContent.hasStructuredSections;

  return {
    postType: "job_seeking",
    jobSeekingFormMode: isDetailed ? "detailed" : "basic",
    jobType: post.job_type ?? "full_time",
    location: null,
    companyName: "",
    jobOfferTitle: "",
    jobOfferDescription: "",
    jobOfferRequirements: "",
    jobOfferBenefits: "",
    contactItems: EMPTY_CONTACTS,
    jobSeekingTitle: post.title,
    jobSeekingBasicContent: isDetailed ? "" : post.content,
    candidateSummary: parsedContent.sections["Giới thiệu"],
    candidateDescription: parsedContent.sections["Mô tả năng lực / kinh nghiệm"],
    candidateRequirements: parsedContent.sections["Kỹ năng / kinh nghiệm"],
    candidateBenefits: parsedContent.sections["Kỳ vọng / mong muốn"],
    salaryMin: toSalaryString(post.salary_min),
    salaryMax: toSalaryString(post.salary_max),
    salaryCurrency: post.salary_currency ?? DEFAULT_SALARY_CURRENCY,
  };
}
