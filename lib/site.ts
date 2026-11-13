export const site = {
  name: "Terence Lin",
  handle: "terence",
  role: "Software Engineer",
  tagline: "Building things for the web, one commit at a time.",
  location: "Millbrae, CA",
  email: "linterence4@gmail.com",
  socials: [
    { label: "github", url: "https://github.com/tlin41390" },
    {
      label: "linkedin",
      url: "https://www.linkedin.com/in/terence-lin-22b023197/",
    },
  ],
};

export const sections = [
  { path: "/about-me", label: "about-me", type: "dir" as const },
  { path: "/experience", label: "experience", type: "dir" as const },
  { path: "/projects", label: "projects", type: "dir" as const },
  { path: "/blogs", label: "blogs", type: "dir" as const },
  {
    path: "/contact-me",
    label: "contact-me",
    type: "dir" as const,
  },
];
