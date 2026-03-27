import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TeamMember } from "@/components/TeamMember";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart, Globe } from "lucide-react";

export default function About() {
  const team = [
    {
      name: "Dolapo Kukoyi",
      role: "Founder & Program Director",
      bio: "Renowned energy and infrastructure strategist with over 20 years of experience driving high-impact projects across Africa."
    },
    {
      name: "Babatunde Ajayi",
      role: "Finance & Investment Lead",
      bio: "20 years of experience providing financing and structuring solutions to corporate and public sector clients in Africa."
    },
    {
      name: "Nenritmwa Gotodok Gofup",
      role: "Technical Advisor",
      bio: "Accomplished energy lawyer and climate advocate with expertise in legal advisory, energy policy, and sustainability."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">About AFÁRÁ</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Empowering female infrapreneurs to lead transformative energy and infrastructure projects across Africa.
            </p>
          </div>

          <div className="mb-20">
            <div className="prose prose-lg max-w-none text-center mb-12">
              <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
                The name "AFÁRÁ" comes from the Yoruba word meaning <strong className="text-foreground">"bridge"</strong>—symbolizing connection, transition, and opportunity. We help women move from feasibility to funding, from aspiration to execution in Africa's energy and infrastructure sectors.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">Vision</h3>
                <p className="text-muted-foreground text-sm">
                  To enable and scale 50 female-owned businesses in Africa's energy and infrastructure sectors with $1 billion in funding over five years.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">Mission</h3>
                <p className="text-muted-foreground text-sm">
                  Provide holistic personal development, project development, and funding support to female infrapreneurs in energy and infrastructure.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">Values</h3>
                <p className="text-muted-foreground text-sm">
                  Empowerment, collaboration, sustainability, and gender-sensitive approaches in everything we do.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">Reach</h3>
                <p className="text-muted-foreground text-sm">
                  Pan-African coverage supporting infrapreneurs across East, West, South, and North Africa.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Our Leadership</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member, i) => (
                <TeamMember key={i} {...member} />
              ))}
            </div>
          </div>

          <div className="bg-card rounded-md p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Part of the OPSB Family</h2>
            <p className="text-center text-lg text-muted-foreground mb-4 max-w-3xl mx-auto">
              AFÁRÁ is an initiative of Open Spaces & Bridges Advisory (OPSB), a leading advisory catalyst for transformative energy and infrastructure projects across Africa.
            </p>
            <p className="text-center text-muted-foreground max-w-3xl mx-auto">
              With offices in Lagos and London, OPSB brings decades of experience in project advisory, regulatory strategy, and capital matchmaking to support the AFÁRÁ accelerator program.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
