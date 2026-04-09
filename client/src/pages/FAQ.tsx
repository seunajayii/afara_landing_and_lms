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
    category: "About the Programme",
    items: [
      {
        question: "What is the AFÁRÁ Accelerator?",
        answer:
          "AFÁRÁ is a business accelerator designed to support female-owned and led companies working in Africa's energy and infrastructure sectors. The name comes from the Yoruba word meaning 'bridge' — symbolising connection, transition, and opportunity. AFÁRÁ is an initiative of Open Spaces & Bridges Advisory (OPSB).",
      },
      {
        question: "What does the programme offer?",
        answer:
          "Participants receive a comprehensive package of support including capacity-building courses, expert project support (transaction structuring, legal and financial advisory, ESG advisory, technical guidance, and more), access to investors and development finance institutions, mentorship from seasoned industry professionals, community with a peer network of women infrapreneurs, and a digital certificate upon completion.",
      },
      {
        question: "How long does the programme run?",
        answer:
          "The AFÁRÁ Accelerator is a structured programme designed to take participants from concept to bankable project. Specific cohort timelines are shared during the application process and may vary by cohort.",
      },
      {
        question: "Is AFÁRÁ an online programme?",
        answer:
          "Yes. The programme is delivered primarily online through our Learning Management System (LMS), which includes self-paced courses, live workshops, mentorship sessions, and community forums. Select in-person events and networking opportunities may also be organised.",
      },
    ],
  },
  {
    category: "Eligibility & Application",
    items: [
      {
        question: "Who can apply to AFÁRÁ?",
        answer:
          "AFÁRÁ is open to women who own or lead companies operating in Africa's energy and infrastructure sectors. This includes but is not limited to renewable energy, power generation and distribution, water and sanitation, transportation, telecommunications, and housing. Your business should be at a stage where you are actively developing or executing a project.",
      },
      {
        question: "Does my company have to be registered in Africa?",
        answer:
          "Your company's operations and projects must be based in Africa. Companies registered elsewhere but with active African infrastructure or energy projects may still qualify. We currently target participants from across 15+ African countries.",
      },
      {
        question: "What stage does my business need to be at?",
        answer:
          "We welcome applicants at various stages — from early-stage ventures with a viable concept through to companies with active projects seeking to scale or close financing. We assess each applicant on the strength of their vision, sector focus, and readiness to engage with the programme.",
      },
      {
        question: "Is there a cost to participate?",
        answer:
          "Please refer to the application details or contact us at hello@afaraaccelerator.org for information on fees, scholarships, or sponsored places. Our goal is to make the programme as accessible as possible to qualified women infrapreneurs.",
      },
      {
        question: "How do I apply?",
        answer:
          "You can apply directly through our website by clicking the 'Apply Now' button. The application form asks about your background, your company, your project, and what you hope to gain from AFÁRÁ. Complete all sections as thoroughly as possible to give your application the best chance of success.",
      },
    ],
  },
  {
    category: "During the Programme",
    items: [
      {
        question: "How does mentorship work?",
        answer:
          "Each participant is matched with a mentor from our network of experienced professionals in energy, infrastructure, finance, and related fields. Mentors provide guidance through scheduled one-on-one sessions, and the platform allows you to track session notes and progress.",
      },
      {
        question: "What sectors does AFÁRÁ focus on?",
        answer:
          "Our core sectors are energy and infrastructure — including solar, wind, and clean cooking energy; power transmission and distribution; water and sanitation; transportation; telecommunications; and sustainable housing. If your project sits at the intersection of infrastructure and impact, AFÁRÁ may be a strong fit.",
      },
      {
        question: "Will I have access to investors through the programme?",
        answer:
          "Yes. A key pillar of AFÁRÁ is funding access. We work to connect participants with relevant investors, development finance institutions (DFIs), grant bodies, and capital partners. The programme also includes pitch preparation and investor readiness support.",
      },
      {
        question: "Can I access the LMS resources after the programme ends?",
        answer:
          "Participants retain access to their learning materials and community after completing the programme. We believe in building a lasting network of women infrapreneurs across Africa.",
      },
    ],
  },
  {
    category: "Certificates & Recognition",
    items: [
      {
        question: "Do I receive a certificate for completing the programme?",
        answer:
          "Yes. Participants who meet the programme completion requirements receive a verifiable digital certificate from AFÁRÁ. Certificates are accessible through your LMS profile and can be shared on LinkedIn and other professional platforms.",
      },
      {
        question: "What are the requirements to receive a certificate?",
        answer:
          "Completion requirements include finishing the required course modules, attending key workshops or events, and completing your mentorship sessions. Full details are provided to participants at the start of their cohort.",
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
