"use client";

import Navbar from "./__components/navbar";
import Hero from "./__components/hero";
import Features from "./__components/features";
import HowItWorks from "./__components/how-it-works";
import Testimonials from "./__components/testimonials";
import FAQ from "./__components/faq";
import CTA from "./__components/cta";
import Footer from "./__components/footer";

function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer /> 
    </div>
  );
}

export default Home;
