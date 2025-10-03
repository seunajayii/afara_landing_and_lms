import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TransactionCard } from "@/components/TransactionCard";
import { Button } from "@/components/ui/button";

export default function TrackRecord() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", "Energy", "Finance", "Infrastructure", "Regulation"];

  const transactions = [
    {
      title: "Geregu Power Bond Issuance",
      description: "Led ₦41B bond issuance for Geregu Power Plc—first unwrapped power sector bond in Nigeria.",
      category: "Finance",
      value: "₦41B",
      location: "Nigeria"
    },
    {
      title: "West African Renewable Energy Scale-Up",
      description: "Advising Empower New Energy (AFDB/SEFA-backed) on renewable project development across West Africa.",
      category: "Energy",
      location: "West Africa"
    },
    {
      title: "Mini-Grid Regulatory Frameworks",
      description: "Supported GIZ and GET.transform in drafting mini-grid regulations across Africa with international best practices.",
      category: "Regulation",
      location: "Pan-African"
    },
    {
      title: "Landmark AEDC Acquisition",
      description: "Advised Copperbelt Energy Corp (KANN Consortium) on $121M debt-backed acquisition of AEDC.",
      category: "Finance",
      value: "$121M",
      location: "Nigeria"
    },
    {
      title: "Lagos Blue Line Railway Concession",
      description: "Advised LAMATA on the concession of the Blue Line Railway, Nigeria's first state-owned urban rail.",
      category: "Infrastructure",
      location: "Lagos, Nigeria"
    },
    {
      title: "Solar Deployment Across Nigeria",
      description: "Advised Infracredit and developers on guarantee-backed projects deploying over 170 solar mini-grids nationwide.",
      category: "Energy",
      location: "Nigeria"
    },
    {
      title: "United Capital Infrastructure Fund",
      description: "Led advisory and launch of the fund targeting mid-sized energy and infrastructure projects.",
      category: "Finance",
      location: "Nigeria"
    },
    {
      title: "Johnvents Industries Investment",
      description: "Led $40.5M debt and $25M working capital financings by BII and Afreximbank.",
      category: "Finance",
      value: "$65.5M",
      location: "Nigeria"
    }
  ];

  const filteredTransactions = selectedCategory === "all" 
    ? transactions 
    : transactions.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Track Record</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Delivering transformative projects across Africa's energy and infrastructure sectors.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                data-testid={`filter-${category.toLowerCase()}`}
              >
                {category === "all" ? "All Projects" : category}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTransactions.map((transaction, i) => (
              <TransactionCard key={i} {...transaction} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
