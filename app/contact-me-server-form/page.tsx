import type { Metadata } from "next";
import { site } from "@/lib/site";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "~/contact-me-server-form",
  description: `Contact ${site.name}.`,
};

export default function ContactMe() {
  return (
    <div>
      <p className="prompt">
        {site.handle.toLowerCase()}@portfolio:
        <span className="path">~/contact-me-server-form</span>$ ./submit --help
      </p>
      <h1>contact me</h1>
      <p className="dim">
        live site: messages are delivered via <b>Formspree</b>. local dev: they
        POST to <b>/api/contact</b> and are saved as JSON in{" "}
        <b>data/submissions.json</b>.
      </p>
      <ContactForm />
    </div>
  );
}
