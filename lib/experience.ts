export type Experience = {
  org: string;
  role: string;
  period: string;
  location: string;
  tech?: string[];
  bullets: string[];
};

export const experience: Experience[] = [
  {
    org: "Bridging Tech Ed",
    role: "Backend Engineer",
    period: "August 2024 – June 2026",
    location: "San Francisco, CA",
    tech: [
      "Supabase",
      "SQL",
      "GitHub Actions",
      "Microsoft Azure",
      "React",
      "TypeScript",
    ],
    bullets: [
      "Configured the Supabase database and integrated it with the React web app on a 5-person team, supporting the platform's migration from Microsoft Azure to Supabase",
      "Implemented user sign-up and login with Supabase Auth, securing student accounts for a classroom pilot with 12 students",
      "Built a GitHub Actions CI/CD pipeline from scratch that automatically deploys the frontend and backend services to production, replacing manual deployment steps on every release",
      "Set up routing for 6 pages with React Router and state management, keeping user data consistent as learners moved through the platform",
    ],
  },
  {
    org: "University of San Francisco",
    role: "Computer Science Tutor",
    period: "January 2022 – May 2023",
    location: "San Francisco, CA",
    bullets: [
      "Held 10 hours of office hours per week across 4 semesters (~600 hours total), supporting about 15 students weekly with C, HTML/CSS, and Linux over Zoom and in campus labs",
      "Helped students debug their code and write cleaner, more efficient solutions for a software development course; several students credited the sessions with helping them pass",
    ],
  },
];
