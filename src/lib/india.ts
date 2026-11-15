export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
  "Outside India",
] as const;

export const DEGREES = [
  "B.Tech",
  "B.E.",
  "B.Sc",
  "BCA",
  "B.Com",
  "BBA",
  "BA",
  "M.Tech",
  "M.Sc",
  "MCA",
  "MBA",
  "M.Com",
  "Diploma",
  "Other",
];

export const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Data Science",
  "Artificial Intelligence",
  "Mathematics",
  "Statistics",
  "Commerce",
  "Business",
  "Other",
];

export const HEARD_FROM = [
  "Google",
  "Instagram",
  "LinkedIn",
  "YouTube",
  "College",
  "Friend or family",
  "WhatsApp",
  "Other",
] as const;

export const LEARNING_MODES = ["Online", "Offline", "Hybrid"] as const;

export const AVAILABILITY = [
  "Weekday daytime",
  "Weekday evenings",
  "Weekends",
  "Flexible",
] as const;

export const BATCH_TIMINGS = [
  "Weekday evenings",
  "Weekends",
  "Early mornings",
  "Flexible",
] as const;

export const OPPORTUNITIES = ["Internship", "Job", "Both"] as const;

export const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"] as const;

export const CURRENT_YEARS = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
  "5th year",
  "Graduated",
  "Not applicable",
] as const;

export const NOTICE_PERIODS = [
  "Immediate",
  "15 days",
  "30 days",
  "60 days",
  "90 days",
  "More than 90 days",
] as const;

export const EXPERIENCE_BANDS = [
  "Less than 1 year",
  "1 to 3 years",
  "3 to 5 years",
  "5 to 8 years",
  "8 to 12 years",
  "12 years or more",
] as const;

export const LANGUAGES = [
  "Python",
  "SQL",
  "Java",
  "JavaScript",
  "C",
  "C++",
  "R",
  "None yet",
] as const;

export const TOOL_OPTIONS = [
  "Excel",
  "Power BI",
  "Tableau",
  "Git",
  "Pandas",
  "NumPy",
  "TensorFlow",
  "PyTorch",
  "LangChain",
  "None yet",
] as const;

export const TARGET_TRACKS = [
  "Data Analyst",
  "Data Scientist",
  "AI/ML Engineer",
  "Generative AI Engineer",
  "Agentic AI Engineer",
  "Other",
] as const;

const currentYear = new Date().getFullYear();
export const PASSED_OUT_YEARS = [
  "Still studying",
  ...Array.from({ length: 12 }, (_, index) => String(currentYear + 1 - index)),
  "Earlier",
];
