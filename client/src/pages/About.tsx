import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TeamMember } from "@/components/TeamMember";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart } from "lucide-react";

export default function About() {
  const team = [
    {
      name: "Dolapo Kukoyi",
      role: "Founder & Lead Advisor",
      bio: "Renowned energy and infrastructure strategist with over 20 years of experience driving high-impact projects across Africa."
    },
    {
      name: "Babatunde Ajayi",
      role: "Partner & Senior Finance Advisor",
      bio: "20 years of experience providing financing and structuring solutions to corporate and public sector clients in Africa."
    },
    {
      name: "Nenritmwa Gotodok Gofup",
      role: "Adviser & Technical Assistance",
      bio: "Accomplished energy lawyer and climate advocate with expertise in legal advisory, energy policy, and sustainability."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">About OPSB</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Leading advisory catalyst for transformative, bankable energy and infrastructure projects that drive inclusive development across Africa.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">Vision</h3>
                <p className="text-muted-foreground">
                  Leading advisory catalyst for transformative, bankable energy and infrastructure projects that drive inclusive development across Africa.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">Mission</h3>
                <p className="text-muted-foreground">
                  We empower project sponsors, entrepreneurs, and investors by delivering strategic guidance, regulatory clarity, and access to funding partnerships.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">Values</h3>
                <p className="text-muted-foreground">
                  Development-driven, strategic collaboration, and gender-sensitive approaches in everything we do.
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

          <div className="bg-card rounded-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Locations</h2>
            <p className="text-center text-lg text-muted-foreground mb-8">
              Operating across Africa with offices in Lagos and London.
            </p>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <h3 className="font-bold text-xl mb-2">Lagos, Nigeria</h3>
                <p className="text-muted-foreground">African headquarters</p>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-xl mb-2">London, UK</h3>
                <p className="text-muted-foreground">International office</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
