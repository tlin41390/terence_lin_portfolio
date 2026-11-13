import type { Metadata } from "next";
import { site } from "@/lib/site";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "~/contact-me",
  description: `Contact ${site.name}.`,
};

export default function ContactMe() {
  return (
    <div>
      <p className="prompt">
        {site.handle.toLowerCase()}@portfolio:
        <span className="path">~/contact-me</span>$ ./contact --api
      </p>
      <h1>contact me</h1>
      <p className="dim">
        this form POSTs to <b>/api/contacts</b> and every submission is saved
        as JSON in <b>data/submissions.json</b>.
      </p>
      <ContactForm />
    </div>
  );
}
