import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";

const faqs = [
  {
    category: "About AFÁRÁ",
    items: [
      {
        question: "Who is AFÁRÁ for?",
        answer:
          "AFÁRÁ is for women who own and operate energy or infrastructure businesses in Africa, with at least 2 years of operation, a minimum 60% ownership stake, and a project currently under development or ready to scale.",
      },
      {
        question: "What sectors does AFÁRÁ cover?",
        answer:
          "Energy (gas, power, renewables, mini-grids, clean cooking) and infrastructure (roads, rail, ports, logistics, digital and communications infrastructure).",
      },
      {
        question: "How many businesses get selected per year?",
        answer:
          "10 female entrepreneurs are selected annually for each cohort.",
      },
      {
        question: "How long is the programme?",
        answer:
          "Six months, including workshops and mentoring sessions.",
      },
      {
        question: "Is there a commitment required after the programme?",
        answer:
          "Yes. Every participant commits to mentoring two other female-owned businesses in energy and infrastructure over a three-year period post-cohort.",
      },
    ],
  },
  {
    category: "Eligibility & Application",
    items: [
      {
        question: "What stage does my project need to be at to apply?",
        answer:
          "Beyond concept stage. You should have a feasibility study, business plan, financial model, and some evidence of project preparation work — such as offtake agreements, technical studies, or an implementation plan. The key thing is that you can clearly identify your milestones and path to financing.",
      },
      {
        question: "What financial documents do I need?",
        answer:
          "Management accounts or audited financial statements covering at least the past two years. Your company should also be in good regulatory standing.",
      },
      {
        question: "Do I need to be based in Nigeria to apply?",
        answer:
          "No. AFÁRÁ targets women across Africa, with a goal of reaching 15+ African countries through the programme.",
      },
      {
        question: "When can I apply?",
        answer:
          "The Call for Applications opened at the end of March 2026, with prequalified candidates announced in June 2026.",
      },
    ],
  },
  {
    category: "Programme Support",
    items: [
      {
        question: "What kind of support will I receive?",
        answer:
          "A combination of personal development, project development support, funding readiness coaching, access to legal, financial, technical and ESG advisory, and connections to investors and DFIs.",
      },
    ],
  },
  {
    category: "Technical & Account",
    items: [
      {
        question: "I can't log in to the LMS. What should I do?",
        answer:
          "If you've forgotten your password, use the 'Forgot your password?' link on the login page. A reset link will be sent to your registered email address. If you continue to have trouble, contact us at hello@afaraaccelerator.org.",
      },
      {
        question: "Who do I contact if I have questions not answered here?",
        answer:
          "You can reach us at hello@afaraaccelerator.org or use the contact form on our Contact page. We aim to respond within 2–3 business days.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Page header */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary/5 border-b">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about the AFÁRÁ Accelerator programme. Can't find your answer?{" "}
            <Link href="/contact" className="text-primary hover:underline font-medium">
              Get in touch.
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ body */}
      <section className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-semibold text-primary mb-4">
                {section.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-2">
                {section.items.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`${section.category}-${i}`}
                    className="border rounded-md px-4"
                    data-testid={`faq-item-${section.category.toLowerCase().replace(/\s+/g, "-")}-${i}`}
                  >
                    <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          {/* CTA */}
          <div className="rounded-md bg-primary/5 border p-8 text-center space-y-4">
            <h3 className="text-xl font-semibold">Ready to apply?</h3>
            <p className="text-muted-foreground">
              Join a growing community of women building Africa's energy and infrastructure future.
            </p>
            <Link href="/apply">
              <Button size="lg" data-testid="button-faq-apply">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
