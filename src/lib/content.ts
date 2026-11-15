import type { PhaseId, ProgramSlug } from "@/lib/types";

export const brand = {
  name: "SkilVantage",
  tagline: "Learn Skills. Build Careers. Become Job Ready.",
  supporting: "Your Skills. Your Career. Your Advantage.",
  bridge: "From Learning to Job Ready.",
  communication:
    "Technical skills get you started. Communication skills help you succeed.",
  promise:
    "We focus on building professionals who can learn, apply, communicate and perform.",
  about:
    "SkilVantage is a career-focused technology training consultancy designed to bridge the gap between academic learning and industry expectations.",
};

export const quotes = [
  "Your future is created by what you learn today.",
  "Learn today. Build tomorrow.",
  "Skills create opportunities.",
  "Become job ready, not just certificate ready.",
  "Communication is the bridge between knowledge and success.",
  "Don't just learn technology. Learn how to apply it.",
  "Your career advantage starts with the right skills.",
];

export const phases: { id: PhaseId; title: string; summary: string }[] = [
  {
    id: "foundation",
    title: "Foundation",
    summary: "The concepts and tools every later week depends on.",
  },
  {
    id: "core",
    title: "Core Skills",
    summary: "The daily work of the role, practiced on real tasks.",
  },
  {
    id: "advanced",
    title: "Advanced Skills",
    summary: "Deeper methods that turn an exercise into a finished piece of work.",
  },
  {
    id: "projects",
    title: "Projects",
    summary: "Apply the stack to problems a team would actually recognise.",
  },
  {
    id: "portfolio",
    title: "Portfolio",
    summary: "Present the work so a reviewer can see how you think.",
  },
  {
    id: "resume",
    title: "Resume",
    summary: "Translate projects and skills into a role-specific resume.",
  },
  {
    id: "interview",
    title: "Interview Preparation",
    summary: "Practice explaining your work in technical and HR conversations.",
  },
  {
    id: "job-ready",
    title: "Job Ready",
    summary: "Leave with a portfolio, a reviewed resume, and a plan for the roles you will pursue.",
  },
];

export interface Program {
  slug: ProgramSlug;
  name: string;
  shortName: string;
  registerLabel: string;
  roadmapLabel: string;
  description: string;
  overview: string;
  duration: string;
  level: string;
  accent: string;
  prerequisites: string[];
  whoStudents: string[];
  whoProfessionals: string[];
  skills: string[];
  tools: string[];
  roles: string[];
  curriculum: string[];
  phases: Record<PhaseId, string[]>;
  phaseNotes: Record<PhaseId, string>;
  projects: { title: string; summary: string }[];
  studentTrack: string[];
  professionalTrack: string[];
  methodology: string[];
  interviewPrep: string[];
  communication: string[];
  resumeSupport: string[];
  careerGuidance: string[];
  faqs: { q: string; a: string }[];
  seoTitle: string;
  seoDescription: string;
}

const sharedMethodology = [
  "Instructor-led sessions that introduce one idea, then put it into practice.",
  "Guided labs on the same tools used in the projects.",
  "Weekly review so gaps are caught before the next module.",
  "A project portfolio, not a folder of unused slides.",
  "Communication practice tied to the technical topic of the week.",
  "Resume reviews and mock interviews in the closing weeks.",
  "Career counselling to choose a role, a pace, and a learning plan.",
];

function closing(name: string): Pick<Program, "methodology" | "interviewPrep" | "communication" | "resumeSupport" | "careerGuidance"> {
  return {
    methodology: sharedMethodology,
    interviewPrep: [
      `Role-specific questions for ${name} interviews.`,
      "A structured way to walk through a project: problem, approach, result, and what you would improve.",
      "Technical rounds and HR rounds, practiced separately.",
      "Feedback on clarity, pace, and how you handle a question you do not know.",
    ],
    communication: [
      "Explaining a technical choice in plain language.",
      "Short spoken summaries of a project.",
      "Professional email and message writing.",
      "Confidence in group discussions and presentations.",
    ],
    resumeSupport: [
      "A one-page resume aimed at the roles listed for this program.",
      "Project bullets that describe the decision, not only the tool.",
      "A LinkedIn headline and about section that match the resume.",
      "A GitHub or portfolio layout a reviewer can open quickly.",
    ],
    careerGuidance: [
      "Help choosing between the roles this program prepares you for.",
      "A realistic reading of your current background and the gap to close.",
      "Batch mode and timing that fit study or work.",
      "A follow-up plan after the cohort. Hiring decisions stay with employers.",
    ],
  };
}

export const programs: Program[] = [
  {
    slug: "data-analyst",
    name: "Data Analyst",
    shortName: "Data Analyst",
    registerLabel: "Register for Data Analyst",
    roadmapLabel: "View Data Analyst Roadmap",
    description:
      "Learn how to transform raw data into meaningful business insights and make data-driven decisions.",
    overview:
      "The Data Analyst program is for people who want to turn messy tables into decisions a business can use. You learn the analyst stack, build dashboards, and practice explaining what the numbers mean.",
    duration: "About 4 months",
    level: "Beginner to job-ready",
    accent: "bg-copper",
    prerequisites: [
      "No programming experience is required.",
      "Comfort with school-level mathematics and spreadsheets helps.",
      "You should be able to set aside regular practice time each week.",
    ],
    whoStudents: [
      "College students who want an analyst portfolio before placements.",
      "Final-year students comparing analyst and software roles.",
      "Recent graduates and freshers starting a first role search.",
    ],
    whoProfessionals: [
      "IT professionals who want to move toward reporting and analytics.",
      "Non-IT professionals who already work with reports or operations data.",
      "People changing domain into a business intelligence role.",
    ],
    skills: [
      "Excel",
      "SQL",
      "Python",
      "Pandas",
      "NumPy",
      "Statistics",
      "Power BI",
      "Tableau",
      "Data Visualization",
      "Data Cleaning",
      "Business Intelligence",
      "Problem Solving",
      "Communication",
    ],
    tools: ["Excel", "SQL", "Python", "Pandas", "NumPy", "Power BI", "Tableau"],
    roles: [
      "Data Analyst",
      "Business Analyst",
      "BI Analyst",
      "Reporting Analyst",
      "Junior Data Analyst",
    ],
    curriculum: [
      "Excel",
      "SQL",
      "Statistics Fundamentals",
      "Python Basics",
      "Pandas & NumPy",
      "Data Cleaning",
      "Data Visualization",
      "Power BI / Tableau",
      "Business Analytics",
      "Dashboard Development",
      "Real-world Projects",
      "Resume & Interview Preparation",
    ],
    phases: {
      foundation: ["Excel", "SQL", "Statistics Fundamentals", "Python Basics"],
      core: ["Pandas & NumPy", "Data Cleaning", "Data Visualization", "Power BI / Tableau"],
      advanced: ["Business Analytics", "Dashboard Development"],
      projects: ["Real-world Projects"],
      portfolio: [],
      resume: [],
      interview: ["Resume & Interview Preparation"],
      "job-ready": [],
    },
    phaseNotes: {
      foundation: "Spreadsheets, queries, and the statistics an analyst uses to trust a number.",
      core: "Clean a dataset, shape it in Python, and show it in a chart or a BI tool.",
      advanced: "Connect a dashboard to a business question, not only to a chart type.",
      projects: "Sales, customer, finance, and marketing datasets with a decision at the end.",
      portfolio: "Each project becomes a short case study: question, data, dashboard, and the decision it supports.",
      resume: "The closing module turns those case studies into resume bullets and a LinkedIn profile.",
      interview: "Practice walking a reviewer through a dashboard and the reasoning behind a metric.",
      "job-ready": "You leave with analyst tools, a portfolio, and a counselling plan. Offers depend on employers.",
    },
    projects: [
      { title: "Sales Dashboard", summary: "Track revenue, region, and product mix, then recommend one action." },
      { title: "Customer Analytics", summary: "Segment customers and explain which group deserves attention." },
      { title: "Financial Analytics", summary: "Build a reporting view of margins, costs, and exceptions." },
      { title: "Marketing Analytics", summary: "Compare campaign performance and write the insight in plain language." },
    ],
    studentTrack: [
      "Foundations first, so a non-coding degree can still start cleanly.",
      "Projects you can take into a campus interview or an internship conversation.",
      "Communication drills for explaining a chart without reading the slide.",
    ],
    professionalTrack: [
      "Evening and weekend pacing for people who already have a job.",
      "Projects framed around reporting work you may already touch.",
      "Interview stories that connect your current domain to analyst work.",
    ],
    ...closing("Data Analyst"),
    faqs: [
      {
        q: "Can I join the Data Analyst program with no coding background?",
        a: "Yes. The program starts with Excel, SQL, and statistics, then introduces Python. You do need time to practice.",
      },
      {
        q: "Will I work in both Power BI and Tableau?",
        a: "You learn the dashboard workflow in depth on one primary tool and how the same decisions transfer to the other.",
      },
    ],
    seoTitle: "Data Analyst Training",
    seoDescription:
      "Job-readiness focused Data Analyst training for students, freshers and working professionals. Excel, SQL, Python, Power BI, projects, communication and interview preparation.",
  },
  {
    slug: "data-scientist",
    name: "Data Scientist",
    shortName: "Data Science",
    registerLabel: "Register for Data Science",
    roadmapLabel: "View Data Scientist Roadmap",
    description:
      "Build strong foundations in statistics, machine learning and predictive analytics to solve real-world problems.",
    overview:
      "The Data Scientist program builds from Python and statistics into machine learning you can explain. The aim is a model with a measured result, a clear limitation, and a story a stakeholder can follow.",
    duration: "About 6 months",
    level: "Beginner to intermediate",
    accent: "bg-teal",
    prerequisites: [
      "No prior data science job is required.",
      "High-school mathematics is enough to start. Statistics is taught in the program.",
      "You should be ready to practice Python every week.",
    ],
    whoStudents: [
      "Students who want a first data science portfolio rather than only a certificate.",
      "Freshers aiming at junior data scientist or analyst-to-scientist paths.",
      "Graduates from engineering, science, mathematics, or commerce.",
    ],
    whoProfessionals: [
      "Analysts who want to move into predictive work.",
      "Software professionals adding a modelling toolkit.",
      "Domain professionals moving into data science roles.",
    ],
    skills: [
      "Python",
      "SQL",
      "Statistics",
      "Probability",
      "Pandas",
      "NumPy",
      "Matplotlib",
      "Seaborn",
      "Scikit-learn",
      "Machine Learning",
      "Feature Engineering",
      "Model Evaluation",
      "EDA",
      "Deployment",
      "Business Understanding",
    ],
    tools: ["Python", "SQL", "Pandas", "NumPy", "Matplotlib", "Seaborn", "Scikit-learn"],
    roles: [
      "Data Scientist",
      "Junior Data Scientist",
      "ML Analyst",
      "Predictive Analytics Specialist",
    ],
    curriculum: [
      "Python",
      "NumPy",
      "Pandas",
      "SQL",
      "Statistics",
      "Probability",
      "Data Cleaning",
      "Exploratory Data Analysis",
      "Feature Engineering",
      "Data Visualization",
      "Machine Learning",
      "Supervised Learning",
      "Unsupervised Learning",
      "Model Evaluation",
      "Feature Selection",
      "Ensemble Methods",
      "Advanced Machine Learning",
      "Projects",
      "Deployment Basics",
      "Interview Preparation",
    ],
    phases: {
      foundation: ["Python", "NumPy", "Pandas", "SQL", "Statistics", "Probability"],
      core: [
        "Data Cleaning",
        "Exploratory Data Analysis",
        "Feature Engineering",
        "Data Visualization",
        "Machine Learning",
        "Supervised Learning",
        "Unsupervised Learning",
      ],
      advanced: [
        "Model Evaluation",
        "Feature Selection",
        "Ensemble Methods",
        "Advanced Machine Learning",
        "Deployment Basics",
      ],
      projects: ["Projects"],
      portfolio: [],
      resume: [],
      interview: ["Interview Preparation"],
      "job-ready": [],
    },
    phaseNotes: {
      foundation: "Python, dataframes, SQL, and the probability you need before a model means anything.",
      core: "Explore a dataset, shape features, and train the first supervised and unsupervised models.",
      advanced: "Judge a model honestly, compare methods, and put a simple prediction service online.",
      projects: "Churn, pricing, fraud, and recommendation problems with an evaluation you can defend.",
      portfolio: "Write each project as a notebook plus a one-page note: data, metric, baseline, and limit.",
      resume: "Resume bullets lead with the business question and the metric, then the algorithm.",
      interview: "Practice metric choice, leakage, and how you would explain a model to a non-technical manager.",
      "job-ready": "You leave able to build and critique a model. A job offer is a separate hiring decision.",
    },
    projects: [
      { title: "Customer Churn Prediction", summary: "Predict who might leave and explain which signals matter." },
      { title: "House Price Prediction", summary: "Build a baseline, then improve it without hiding the error." },
      { title: "Fraud Detection", summary: "Handle an imbalanced problem and choose a metric that fits the cost." },
      { title: "Recommendation System", summary: "Produce a simple recommender and describe where it fails." },
    ],
    studentTrack: [
      "A paced start in Python for students who have only written small programs.",
      "Projects sized for a fresher portfolio and an internship conversation.",
      "Interview practice aimed at junior data scientist and analyst screens.",
    ],
    professionalTrack: [
      "A faster foundation if you already write code or work with data.",
      "Projects you can connect to your current industry.",
      "Support for explaining a career move into data science.",
    ],
    ...closing("Data Scientist"),
    faqs: [
      {
        q: "Is this program only theory?",
        a: "Statistics is taught because the models depend on it. Most weeks include a lab or a project decision, not a formula sheet alone.",
      },
      {
        q: "Do I need a strong mathematics degree?",
        a: "No. You need willingness to practice. The program teaches the statistics and probability it uses.",
      },
    ],
    seoTitle: "Data Science Training",
    seoDescription:
      "Data science career training in Python, statistics, machine learning and projects for students and working professionals. Job-readiness focused, with interview preparation.",
  },
  {
    slug: "ai-ml",
    name: "AI / ML Engineer",
    shortName: "AI / ML",
    registerLabel: "Register for AI/ML",
    roadmapLabel: "View AI/ML Roadmap",
    description:
      "Develop practical skills to build, train, evaluate and deploy intelligent machine learning systems.",
    overview:
      "The AI/ML Engineer program is for people who want to build models and ship them. You move from machine learning into deep learning, language, vision, and the basics of deployment and MLOps.",
    duration: "About 6 months",
    level: "Intermediate",
    accent: "bg-ink",
    prerequisites: [
      "Python basics are expected. The opening module refreshes them.",
      "Comfort with statistics helps. Core statistics is included.",
      "The pace is faster than the Data Analyst program.",
    ],
    whoStudents: [
      "Final-year students aiming at junior AI or ML engineer roles.",
      "Freshers with a programming foundation who want a systems portfolio.",
      "Students who have finished a data course and want to go further.",
    ],
    whoProfessionals: [
      "Software engineers moving into machine learning.",
      "Data analysts or scientists moving toward model deployment.",
      "IT professionals changing domain into AI engineering.",
    ],
    skills: [
      "Python",
      "Machine Learning",
      "Deep Learning",
      "TensorFlow / PyTorch",
      "NLP",
      "Computer Vision",
      "Neural Networks",
      "Transformers",
      "APIs",
      "Docker",
      "Cloud",
      "MLOps",
      "Model Deployment",
    ],
    tools: ["Python", "TensorFlow or PyTorch", "Docker", "REST APIs", "Cloud fundamentals"],
    roles: [
      "AI Engineer",
      "ML Engineer",
      "Machine Learning Developer",
      "AI Developer",
      "Junior AI Engineer",
    ],
    curriculum: [
      "Python Programming",
      "Mathematics for ML",
      "Statistics",
      "Data Processing",
      "Machine Learning",
      "Deep Learning",
      "Neural Networks",
      "CNN",
      "RNN",
      "Transformers",
      "NLP",
      "Computer Vision",
      "Model Optimization",
      "MLOps Fundamentals",
      "Model Deployment",
      "APIs",
      "Cloud Fundamentals",
      "Real-world AI Projects",
      "System Design Basics",
      "Interview Preparation",
    ],
    phases: {
      foundation: ["Python Programming", "Mathematics for ML", "Statistics", "Data Processing"],
      core: ["Machine Learning", "Deep Learning", "Neural Networks", "CNN", "RNN"],
      advanced: [
        "Transformers",
        "NLP",
        "Computer Vision",
        "Model Optimization",
        "MLOps Fundamentals",
        "Model Deployment",
        "APIs",
        "Cloud Fundamentals",
        "System Design Basics",
      ],
      projects: ["Real-world AI Projects"],
      portfolio: [],
      resume: [],
      interview: ["Interview Preparation"],
      "job-ready": [],
    },
    phaseNotes: {
      foundation: "Python, the mathematics you will actually use, and clean inputs for a model.",
      core: "Classical machine learning, then neural networks for images and sequences.",
      advanced: "Transformers, language, vision, and the path from a notebook to an API.",
      projects: "A language application, a vision application, and a prediction system you can demo.",
      portfolio: "A repository with a README, a trained result, and a short note on how to run it.",
      resume: "Resume lines that show what you built, how you evaluated it, and how it was served.",
      interview: "Coding, model, and system questions, plus a calm project walkthrough.",
      "job-ready": "You can train, evaluate, and deploy a model at project scale. Employment is not promised.",
    },
    projects: [
      { title: "NLP Application", summary: "Build a text model and show where it misreads input." },
      { title: "Computer Vision Application", summary: "Train an image model and package a simple demo." },
      { title: "Prediction System", summary: "Serve a model through an API with a clear input contract." },
      { title: "Intelligent Classification System", summary: "Compare a baseline and a neural model on the same task." },
    ],
    studentTrack: [
      "A foundation block for students whose Python is still early.",
      "Projects scoped so a fresher can finish and explain them.",
      "Interview practice for junior AI engineer screens.",
    ],
    professionalTrack: [
      "A shorter refresh if you already ship software.",
      "Deployment and API work that matches an engineering move.",
      "Help telling a career-change story without overclaiming production experience.",
    ],
    ...closing("AI/ML Engineer"),
    faqs: [
      {
        q: "Do I need deep learning experience before I join?",
        a: "No. You need Python and the time to practice. Deep learning is taught after the machine learning core.",
      },
      {
        q: "Which framework is used?",
        a: "You learn the ideas in a way that transfers, with hands-on work in TensorFlow or PyTorch. The cohort confirms the primary framework at the start.",
      },
    ],
    seoTitle: "AI ML Training",
    seoDescription:
      "AI and machine learning career training: Python, deep learning, NLP, computer vision, deployment and interview preparation for students and professionals.",
  },
  {
    slug: "generative-ai",
    name: "Generative AI",
    shortName: "Generative AI",
    registerLabel: "Register for GenAI",
    roadmapLabel: "View GenAI Roadmap",
    description:
      "Learn how modern Generative AI systems work and build practical AI applications using LLMs.",
    overview:
      "The Generative AI program explains how large language models are used in products. You practice prompting, retrieval, application structure, evaluation, and the limits of a system that can sound sure when it is wrong.",
    duration: "About 4 months",
    level: "Intermediate",
    accent: "bg-plum",
    prerequisites: [
      "Python fundamentals are required. The first module refreshes them.",
      "Prior machine learning is helpful and is introduced where the program needs it.",
      "Curiosity about how an LLM application fails is as important as how it demos.",
    ],
    whoStudents: [
      "Students who want a generative AI project rather than only a prompt list.",
      "Freshers aiming at junior LLM or AI application roles.",
      "Graduates who can already write basic Python.",
    ],
    whoProfessionals: [
      "Developers adding LLM applications to their work.",
      "Analysts and consultants who need to build, not only use, generative tools.",
      "Professionals moving into generative AI engineering.",
    ],
    skills: [
      "Python",
      "LLMs",
      "Prompt Engineering",
      "Embeddings",
      "Vector Databases",
      "RAG",
      "LangChain",
      "LLM APIs",
      "AI Evaluation",
      "Fine-tuning",
      "AI Application Development",
      "Deployment",
    ],
    tools: ["Python", "LLM APIs", "LangChain", "Embeddings", "Vector databases"],
    roles: [
      "Generative AI Engineer",
      "GenAI Developer",
      "LLM Application Developer",
      "AI Application Engineer",
    ],
    curriculum: [
      "Python Fundamentals",
      "AI Fundamentals",
      "Machine Learning Basics",
      "Deep Learning Basics",
      "NLP Fundamentals",
      "Transformers",
      "LLM Fundamentals",
      "Prompt Engineering",
      "Embeddings",
      "Vector Databases",
      "RAG",
      "LangChain",
      "LLM APIs",
      "Fine-tuning Fundamentals",
      "AI Application Development",
      "Evaluation",
      "Guardrails",
      "Deployment",
      "Real-world GenAI Projects",
      "Interview Preparation",
    ],
    phases: {
      foundation: [
        "Python Fundamentals",
        "AI Fundamentals",
        "Machine Learning Basics",
        "Deep Learning Basics",
        "NLP Fundamentals",
      ],
      core: ["Transformers", "LLM Fundamentals", "Prompt Engineering", "Embeddings", "Vector Databases"],
      advanced: [
        "RAG",
        "LangChain",
        "LLM APIs",
        "Fine-tuning Fundamentals",
        "Evaluation",
        "Guardrails",
        "Deployment",
      ],
      projects: ["AI Application Development", "Real-world GenAI Projects"],
      portfolio: [],
      resume: [],
      interview: ["Interview Preparation"],
      "job-ready": [],
    },
    phaseNotes: {
      foundation: "Enough Python, ML, and language background to know what an LLM is doing.",
      core: "Prompts, embeddings, and the retrieval pattern behind most useful LLM apps.",
      advanced: "Build, evaluate, constrain, and deploy an application. Fine-tuning is taught as a choice, not a reflex.",
      projects: "A RAG chatbot, a document question-answering flow, an assistant, and a knowledge base.",
      portfolio: "Show the architecture, a failure case, and how you measured answer quality.",
      resume: "Describe the application, the data, the evaluation, and your part of the build.",
      interview: "Practice questions on RAG, hallucinations, cost, and when not to use a model.",
      "job-ready": "You can build a careful LLM application. SkilVantage does not guarantee a role.",
    },
    projects: [
      { title: "RAG Chatbot", summary: "Answer from a document set and show the source of each claim." },
      { title: "Document Q&A", summary: "Let a user ask questions of a private document collection." },
      { title: "AI Assistant", summary: "Design a narrow assistant with a clear job and a refusal path." },
      { title: "Knowledge Base", summary: "Turn internal notes into a searchable, cited knowledge tool." },
    ],
    studentTrack: [
      "A foundation for students who know Python but not transformers.",
      "Projects small enough to finish and serious enough to discuss.",
      "Interview practice for junior generative AI screens.",
    ],
    professionalTrack: [
      "Application patterns you can relate to systems you already maintain.",
      "Evaluation and guardrails, which matter more in a workplace than a demo.",
      "Help positioning a domain background as an advantage in AI products.",
    ],
    ...closing("Generative AI"),
    faqs: [
      {
        q: "Is prompt engineering the whole program?",
        a: "No. Prompting is one module. The program also covers retrieval, APIs, evaluation, guardrails, and deployment.",
      },
      {
        q: "Do I need a paid LLM account?",
        a: "Some labs use provider APIs. The cohort shares the expected setup before the module so you can plan access and cost.",
      },
    ],
    seoTitle: "Generative AI Training",
    seoDescription:
      "Generative AI course for students and professionals: LLMs, prompt engineering, RAG, LangChain, evaluation and job-readiness focused interview preparation.",
  },
  {
    slug: "agentic-ai",
    name: "Agentic AI",
    shortName: "Agentic AI",
    registerLabel: "Register for Agentic AI",
    roadmapLabel: "View Agentic AI Roadmap",
    description:
      "Learn how to build intelligent AI agents that can reason, plan, use tools and complete multi-step tasks.",
    overview:
      "The Agentic AI program is for people who want to build systems that plan, call tools, and finish a multi-step task. You learn the architecture, the failure modes, and how to evaluate an agent before you trust it.",
    duration: "About 3 months",
    level: "Intermediate",
    accent: "bg-copper-deep",
    prerequisites: [
      "Python is required. The opening week refreshes it.",
      "A working sense of how an LLM responds to prompts is helpful.",
      "Foundation modules are included if that sense is still early.",
    ],
    whoStudents: [
      "Students who have basic Python and want an agent project on their portfolio.",
      "Freshers targeting junior AI automation or agent developer roles.",
      "Graduates who finished a generative AI introduction and want the next layer.",
    ],
    whoProfessionals: [
      "Developers who want to add tool-using agents to a product.",
      "Automation specialists moving from scripts to LLM agents.",
      "Professionals aiming at AI agent or AI solutions roles.",
    ],
    skills: [
      "Python",
      "LLMs",
      "Prompt Engineering",
      "Function Calling",
      "Tool Calling",
      "RAG",
      "Agents",
      "Agent Memory",
      "Planning",
      "Multi-Agent Systems",
      "APIs",
      "Automation",
      "Evaluation",
      "Guardrails",
      "Deployment",
    ],
    tools: ["Python", "LLM APIs", "Function calling", "Tool use", "Orchestration patterns"],
    roles: [
      "Agentic AI Engineer",
      "AI Agent Developer",
      "GenAI Engineer",
      "AI Automation Engineer",
      "AI Solutions Developer",
    ],
    curriculum: [
      "Python",
      "AI Fundamentals",
      "LLM Fundamentals",
      "Prompt Engineering",
      "Function Calling",
      "Tool Usage",
      "Agent Architecture",
      "Memory",
      "Planning",
      "Reasoning",
      "RAG",
      "Multi-Agent Systems",
      "Agent Orchestration",
      "APIs & Tools",
      "Workflow Automation",
      "Agent Evaluation",
      "Security & Guardrails",
      "Deployment",
      "Real-world Agent Projects",
      "Advanced Agentic AI Systems",
    ],
    phases: {
      foundation: ["Python", "AI Fundamentals", "LLM Fundamentals", "Prompt Engineering"],
      core: ["Function Calling", "Tool Usage", "Agent Architecture", "Memory", "Planning", "Reasoning"],
      advanced: [
        "RAG",
        "Multi-Agent Systems",
        "Agent Orchestration",
        "APIs & Tools",
        "Workflow Automation",
        "Agent Evaluation",
        "Security & Guardrails",
        "Deployment",
        "Advanced Agentic AI Systems",
      ],
      projects: ["Real-world Agent Projects"],
      portfolio: [],
      resume: [],
      interview: [],
      "job-ready": [],
    },
    phaseNotes: {
      foundation: "Python and a clear picture of what an LLM can and cannot decide on its own.",
      core: "Tools, memory, planning, and an agent loop you can trace step by step.",
      advanced: "Multi-agent work, evaluation, security, and a deployment that has limits on purpose.",
      projects: "A research agent, a support agent, a multi-agent workflow, and an automation system.",
      portfolio: "Document the tools the agent could call, a transcript of a run, and a case where you stopped it.",
      resume: "Describe the task, the tools, the evaluation, and the guardrail. Skip claims you cannot demo.",
      interview: "The closing weeks include interview practice even though the curriculum list ends on systems: expect architecture, failure, and safety questions.",
      "job-ready": "You can design a bounded agent and explain its risks. SkilVantage does not promise placement.",
    },
    projects: [
      { title: "Research Agent", summary: "Plan a short research task, cite sources, and stop when evidence is thin." },
      { title: "Customer Support Agent", summary: "Resolve a narrow set of requests with tools and a handoff to a human." },
      { title: "Multi-Agent Workflow", summary: "Split a task across roles and check the handoff between them." },
      { title: "AI Automation System", summary: "Automate a repeatable workflow with logs and a kill switch." },
    ],
    studentTrack: [
      "Foundation modules so the agent work is not only a library demo.",
      "Projects you can run locally and explain in a fresher interview.",
      "Practice describing limits, which interviewers ask about early.",
    ],
    professionalTrack: [
      "Patterns for adding an agent beside systems you already know.",
      "Security, evaluation, and human handoff as workplace requirements.",
      "Career counselling for a move into AI automation or agent roles.",
    ],
    ...closing("Agentic AI"),
    faqs: [
      {
        q: "Is agentic AI the same as a chatbot course?",
        a: "A chatbot can be one interface. This program focuses on tools, planning, memory, multi-step tasks, and how to evaluate them.",
      },
      {
        q: "Do agents replace software engineering?",
        a: "No. You still design inputs, tools, limits, and tests. The model is one part of the system.",
      },
    ],
    seoTitle: "Agentic AI Training",
    seoDescription:
      "Agentic AI course covering LLM agents, tool calling, planning, multi-agent systems, guardrails and projects for students and working professionals.",
  },
];

export function getProgram(slug: string) {
  return programs.find((program) => program.slug === slug) ?? null;
}

export const trackLabel: Record<ProgramSlug, string> = {
  "data-analyst": "Data Analyst",
  "data-scientist": "Data Scientist",
  "ai-ml": "AI/ML Engineer",
  "generative-ai": "Generative AI Engineer",
  "agentic-ai": "Agentic AI Engineer",
};

export const whyCards = [
  {
    title: "Industry-Relevant Skills",
    body: "Programs follow the tools these roles use in practice: SQL, Python, dashboards, machine learning, language models, and agents.",
  },
  {
    title: "Practical Projects",
    body: "Each path ends in work you can explain. A dashboard, a model, an application, or an agent, with the decision behind it.",
  },
  {
    title: "Job-Ready Training",
    body: "The arc runs from the first tool to a resume and a mock interview. Training is job-readiness focused. Employment is not guaranteed.",
  },
  {
    title: "Communication & Soft Skills",
    body: "Spoken English, explanation, and professional writing sit beside the technical work, because a correct answer still has to be understood.",
  },
  {
    title: "Interview Preparation",
    body: "Practice technical questions, HR conversations, and project walk-throughs so you can talk about your work without reciting a slide.",
  },
  {
    title: "Career Guidance",
    body: "Counselling helps you choose a track, a pace, and a role to aim for, whether you are in college or changing domain.",
  },
];

export const trustCards = [
  { title: "Structured Learning", body: "A visible path from foundation to interview, so you always know what the week is for." },
  { title: "Practical Projects", body: "Projects are part of the program, not an optional extra at the end." },
  { title: "Industry-Relevant Curriculum", body: "Skills and tools are chosen for the roles named on each program, and updated as those roles change." },
  { title: "Career Guidance", body: "A counsellor helps you read your background against the role you want." },
  { title: "Communication Training", body: "Technical explanation, spoken English, and workplace writing are taught on purpose." },
  { title: "Interview Preparation", body: "Mock technical and HR conversations before you face the real ones." },
  { title: "Flexible Batches", body: "Online, offline, and hybrid modes, with evening and weekend options for working professionals." },
  { title: "Student & Professional Programs", body: "The same career path, with a pace and project framing that fit where you are now." },
];

export const jobSteps = [
  { title: "Learn", body: "Build the foundation and the core tools of the role, in order." },
  { title: "Practice", body: "Labs and weekly exercises so a concept is used, not only heard." },
  { title: "Build Projects", body: "Finish work a reviewer can open: a dashboard, a model, an app, or an agent." },
  { title: "Build Portfolio", body: "Write the project so the question, the method, and the result are obvious." },
  { title: "Prepare Resume", body: "Turn that work into a resume, a LinkedIn profile, and a GitHub or portfolio link." },
  { title: "Practice Interviews", body: "Rehearse technical rounds, HR rounds, and the story of your career move." },
];

export const jobSupports = [
  { title: "Resume Building", body: "Role-specific structure, project bullets, and a length a reviewer will actually read." },
  { title: "LinkedIn Optimization", body: "Headline, about section, and experience lines that match the resume." },
  { title: "GitHub Portfolio", body: "A repository layout with a README, instructions, and a result that can be checked." },
  { title: "Mock Interviews", body: "A timed conversation with feedback on clarity, not only on the final answer." },
  { title: "Technical Interviews", body: "Questions drawn from the tools and projects in your program." },
  { title: "HR Interviews", body: "How you introduce yourself, explain a gap, and talk about a career change." },
  { title: "Communication Training", body: "Spoken English, presentation, email, and the skill of explaining a technical idea." },
  { title: "Career Guidance", body: "A counselling conversation about roles, readiness, and what to do next. Not a placement promise." },
];

export const communicationTopics = [
  { title: "Spoken English", body: "Clear speech for class, interviews, and stand-ups." },
  { title: "Professional Communication", body: "Tone, structure, and brevity when you write or speak at work." },
  { title: "Presentation Skills", body: "A short project presentation with one point per slide." },
  { title: "Interview Communication", body: "Answering the question that was asked, then stopping." },
  { title: "Group Discussion", body: "Making a point, listening, and disagreeing without noise." },
  { title: "Email Writing", body: "Subject lines, requests, and follow-ups a busy person can act on." },
  { title: "Workplace Communication", body: "Updates, questions, and handoffs inside a team." },
  { title: "Confidence Building", body: "Practice until a correct answer can be said out loud." },
  { title: "Technical Explanation Skills", body: "Knowing the answer is important. Communicating the answer is what makes you stand out." },
];

export const projectGroups = [
  {
    title: "Data Analytics Projects",
    slug: "data-analyst" as ProgramSlug,
    items: ["Sales Dashboard", "Customer Analytics", "Financial Analytics", "Marketing Analytics"],
  },
  {
    title: "Data Science Projects",
    slug: "data-scientist" as ProgramSlug,
    items: ["Customer Churn Prediction", "House Price Prediction", "Fraud Detection", "Recommendation System"],
  },
  {
    title: "AI/ML Projects",
    slug: "ai-ml" as ProgramSlug,
    items: ["NLP Application", "Computer Vision Application", "Prediction System", "Intelligent Classification System"],
  },
  {
    title: "GenAI Projects",
    slug: "generative-ai" as ProgramSlug,
    items: ["RAG Chatbot", "Document Q&A", "AI Assistant", "Knowledge Base"],
  },
  {
    title: "Agentic AI Projects",
    slug: "agentic-ai" as ProgramSlug,
    items: ["Research Agent", "Customer Support Agent", "Multi-Agent Workflow", "AI Automation System"],
  },
];

export const journey = [
  "Choose student or professional",
  "Explore a career program",
  "View the roadmap",
  "See the projects",
  "Register",
  "Talk with the career team",
];

export const faqs = [
  {
    q: "What courses does SkilVantage offer?",
    a: "Five career programs: Data Analyst, Data Scientist, AI/ML Engineer, Generative AI, and Agentic AI. Each includes projects, communication practice, and interview preparation.",
  },
  {
    q: "Who can join?",
    a: "College students, final-year students, recent graduates, freshers, and working professionals. Professionals may come from IT or from another domain.",
  },
  {
    q: "Do I need programming experience?",
    a: "The Data Analyst program starts without programming. Data Science teaches Python from the foundation. AI/ML, Generative AI, and Agentic AI expect basic Python, and they include a foundation module.",
  },
  {
    q: "Are programs available for students?",
    a: "Yes. The student track is paced for college students, freshers, and career starters, with projects you can discuss in campus or internship interviews.",
  },
  {
    q: "Are programs available for working professionals?",
    a: "Yes. The professional track is designed for people who are employed, including evening and weekend batches and projects that respect a career change.",
  },
  {
    q: "Can I switch careers into AI?",
    a: "Many learners join in order to move toward data or AI roles. Counselling looks at your current work, the gap, and a realistic program. A switch still depends on your practice and on employers.",
  },
  {
    q: "Do you provide projects?",
    a: "Yes. Every program includes real-world project work. The projects page lists the kinds of problems you will practice.",
  },
  {
    q: "Do you provide interview preparation?",
    a: "Yes. Closing weeks include technical and HR practice, plus a way to present your projects. This is preparation, not a guarantee of an interview or an offer.",
  },
  {
    q: "Do you provide communication training?",
    a: "Yes. Spoken English, professional communication, presentations, email, and technical explanation are part of the training. Technical skills get you started. Communication skills help you succeed.",
  },
  {
    q: "Can I learn online?",
    a: "Yes. Online is one of the three learning modes you can choose at registration.",
  },
  {
    q: "Can I learn offline?",
    a: "Yes. Offline and hybrid batches are offered when a cohort runs in a city. The career team confirms the venue when a batch is scheduled.",
  },
  {
    q: "How do I register?",
    a: "Choose student or professional, choose a program, and complete the registration form. You can also ask for a conversation first from the contact page.",
  },
  {
    q: "How will I be contacted after registration?",
    a: "A member of the career team reviews your registration and contacts you on the phone number or email you submitted. The conversation covers your background, the program, and batch options. Registration does not by itself reserve a seat.",
  },
  {
    q: "Does registration mean I am enrolled?",
    a: "No. Registration is a request for counselling and a learning plan. Enrolment, fees, and batch dates are confirmed with you after that conversation.",
  },
  {
    q: "Do you guarantee a job?",
    a: "No. SkilVantage provides job-readiness focused training: skills, projects, communication, resume support, and interview practice. Hiring decisions remain with employers.",
  },
];

export const studentAudience = [
  "College students",
  "Final-year students",
  "Recent graduates",
  "Freshers",
  "Career starters",
];

export const professionalAudience = [
  "IT professionals",
  "Non-IT professionals",
  "Professionals seeking career growth",
  "Professionals changing domains",
  "Professionals moving into AI/Data roles",
];

export const aboutFocus = [
  { title: "Practical learning", body: "A concept is followed by a lab. The point is to use the tool, not only to recognise its name." },
  { title: "Industry skills", body: "Curricula are organised around roles: analyst, scientist, ML engineer, generative AI engineer, and agent developer." },
  { title: "Career transformation", body: "Students start a first search. Professionals plan a move. Both get a track that says so." },
  { title: "Communication", body: "Explanation is trained beside the technology. A correct notebook that you cannot present is unfinished." },
  { title: "Projects", body: "The portfolio is the evidence of the program. Certificates are not the product." },
  { title: "Continuous learning", body: "The fields move quickly. The roadmap shows what to learn next after the cohort ends." },
  { title: "Job readiness", body: "Resume, portfolio, and interview practice are scheduled, not left as homework you might skip." },
];

export const nav = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/roadmaps", label: "Roadmaps" },
  { href: "/projects", label: "Projects" },
  { href: "/job-ready", label: "Job Ready" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/register", label: "Register" },
];
