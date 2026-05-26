import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const articles = [
  {
    publication: "BusinessDay",
    headline: "Africa accelerator targets $1bn to back women-led energy projects",
    date: "May 24, 2026",
    url: "https://businessday.ng/energy/article/africa-accelerator-targets-1bn-to-back-women-led-energy-projects/",
  },
  {
    publication: "Platforms Africa",
    headline: "AFARA Launches an Africa wide Accelerator In Lagos To Build Bankable Women-Led Energy Projects",
    date: "May 24, 2026",
    url: "https://platformsafrica.com/2026/05/24/afara-launches-an-africa-wide-accelerator-in-lagos-to-build-bankable-women-led-energy-projects/",
  },
  {
    publication: "Daily Champion",
    headline: "AFARA launches an Africa-wide accelerator in Lagos to build bankable Women-Led Energy Projects",
    date: "May 21, 2026",
    url: "https://championnews.com.ng/2026/05/21/afara-launches-an-africa-wide-accelerator-in-lagos-to-build-bankable-women-led-energy-projects/",
  },
  {
    publication: "ThisDay Live",
    headline: "AFARA Unveils Africa-wide Accelerator to Build Bankable Women-Led Energy Projects",
    date: "May 25, 2026",
    url: "https://www.thisdaylive.com/2026/05/25/afara-unveils-africa-wide-accelerator-to-build-bankable-women-led-energy-projects/",
  },
];

export default function Press() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Press &amp; Media</h1>
          <p className="text-lg md:text-xl opacity-90">
            AFÁRÁ in the news — coverage of our mission to empower women building Africa's energy future.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${article.publication}: ${article.headline}`}
                data-testid={`press-card-${i}`}
                className="group block bg-card rounded-md p-6 border border-border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="text-2xl font-bold mb-3" style={{ color: '#1a3a2a' }}>
                  {article.publication}
                </p>
                <p className="font-medium text-foreground mb-2 line-clamp-2 leading-snug">
                  {article.headline}
                </p>
                <p className="text-sm text-muted-foreground mb-4">{article.date}</p>
                <hr className="border-border mb-4" />
                <span
                  className="inline-block text-sm font-semibold px-4 py-2 rounded-md border transition-colors duration-200"
                  style={{
                    borderColor: '#1a3a2a',
                    color: '#1a3a2a',
                  }}
                >
                  Read Full Article &rarr;
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
