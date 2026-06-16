import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch about admin access, general advice, or bug reports.",
};

export default function ContactPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-buckeye-cream to-transparent">
        <div className="container-page py-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-buckeye-scarlet">
            Get in touch
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-buckeye-ink sm:text-4xl">
            Contact us
          </h1>
          <p className="mt-4 max-w-2xl text-buckeye-gray">
            Use this form for general advice, admin access to host your own
            quizzes, or bug reports. We will follow up
            using the email address you provide — your message is not posted
            publicly.
          </p>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="max-w-xl rounded-xl border border-black/5 bg-white p-6 shadow-card sm:p-8">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
