import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Award, Globe } from "lucide-react";
import solarImage from "@assets/generated_images/African_solar_farm_infrastructure_d819497d.png";

export default function Afara() {
  const features = [
    {
      icon: Globe,
      title: "Pan-African Coverage",
      description: "Supporting entrepreneurs across East, West, South, and North Africa in energy and infrastructure."
    },
    {
      icon: TrendingUp,
      title: "$1B Funding Aspiration",
      description: "Targeting $1 billion in funding over 5 years to support 50 women-led ventures."
    },
    {
      icon: Users,
      title: "Multiplier Model",
      description: "Each graduate commits to mentoring at least two other infrapreneurs, exponentially expanding impact."
    },
    {
      icon: Award,
      title: "Holistic Development",
      description: "From confidence building to capital raising—comprehensive support for female entrepreneurs."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">
                AFÁRÁ
              </span>
            </h1>
            <p className="text-2xl font-semibold mb-4">An Entrepreneurship Accelerator for African Women</p>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              in Energy & Infrastructure
            </p>
          </div>

          <div className="mb-20">
            <img
              src={solarImage}
              alt="African solar infrastructure"
              className="w-full rounded-xl shadow-lg"
            />
          </div>

          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-6">About Afárá</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="mb-4">
                The name "Afárá" comes from the Yoruba word meaning <strong>"bridge"</strong>—symbolizing connection, transition, and opportunity. Afárá exists to help women move from feasibility to funding, from aspiration to execution.
              </p>
              <p className="mb-4">
                Rooted in Nigerian culture and committed to African identity, Afárá brings a global outlook to innovation, leadership, and infrastructure transformation.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {features.map((feature, i) => (
              <Card key={i} className="hover-elevate transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-md bg-chart-1/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-chart-1" />
                  </div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-gradient-to-r from-chart-1/10 to-chart-2/10 rounded-xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto mb-8">
              To enable, support and scale 50 female-owned businesses in Africa's energy and infrastructure sectors over five years by providing holistic personal development, project development, and funding support to the sum of $1 billion USD.
            </p>
            <p className="text-muted-foreground mb-8">
              Through our accelerator program, we will build a pipeline of women entrepreneurs driving scalable, sustainable projects, fostering innovation, clean energy, sustainable infrastructure and climate action.
            </p>
            <Link href="/lms/dashboard">
              <Button size="lg" data-testid="button-access-lms">
                Access Afárá LMS
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
