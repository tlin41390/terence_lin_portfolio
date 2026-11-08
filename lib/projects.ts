export type Project = {
  slug: string;
  name: string;
  summary: string;
  tech: string[];
  bullets: string[];
  repo?: string;
  demo?: string;
};

export const projects: Project[] = [
  {
    slug: "airline-miles-automation",
    name: "Airline Miles Automation",
    summary:
      "Automated scraping and data ingestion pipeline tracking 41 types of miles and points across 4 loyalty programs.",
    tech: ["Python", "Selenium", "Supabase", "Apify"],
    bullets: [
      "Built an automated scraping and data ingestion pipeline in Python and Selenium that collects mileage and rate data from 4 loyalty programs, covering 41 types of miles and points",
      "Scheduled near-daily runs on Apify and stored results in Supabase, replacing repetitive manual cross-referencing with a run that finishes in minutes",
    ],
  },
  {
    slug: "anyleetcode",
    name: "AnyLeetCode Problem",
    summary:
      "FastAPI backend that generates LeetCode solutions in 20+ programming languages for technical interview preparation.",
    tech: ["Python", "FastAPI", "OpenAI API", "Codex"],
    bullets: [
      "Built a FastAPI backend that generates LeetCode solutions in 20+ programming languages for technical interview preparation",
      "Integrated the OpenAI API (GPT-5) to return optimized solutions with step-by-step explanations, time/space complexity analysis, and the underlying algorithm pattern",
      "Used Codex as an AI coding agent to speed up development, reviewing and testing the generated code",
    ],
  },
  {
    slug: "nba-shot-chart-analysis",
    name: "NBA Shot Chart Player Analysis",
    summary:
      "Full-stack analytics app plotting every shot across 30+ NBA seasons on an interactive court chart, with a natural-language chatbot.",
    tech: [
      "Spring Boot",
      "Python/Flask",
      "Docker Compose",
      "Claude API",
      "HTML5 Canvas",
    ],
    bullets: [
      "Built a full-stack analytics app that plots every shot a player has taken in any season across 30+ seasons (1996–97 to present) on an interactive court chart that renders almost instantly",
      "Designed a two-service architecture (Spring Boot + Python/Flask microservice), containerized and orchestrated with Docker Compose and health checks",
      "Integrated a Claude API chatbot that uses tool calling to answer natural-language questions with live NBA player and shot data",
    ],
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
