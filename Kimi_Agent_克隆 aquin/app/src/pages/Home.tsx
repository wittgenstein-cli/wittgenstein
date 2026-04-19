import Navbar from '../sections/Navbar';
import HeroSection from '../sections/HeroSection';
import NeuralNetwork from '../sections/NeuralNetwork';
import BackedBySection from '../sections/BackedBySection';
import AttributionSection from '../sections/AttributionSection';
import DiffSection from '../sections/DiffSection';
import HumanReadabilitySection from '../sections/HumanReadabilitySection';
import FactualChecksSection from '../sections/FactualChecksSection';
import EvalsSection from '../sections/EvalsSection';
import AgenticSystemSection from '../sections/AgenticSystemSection';
import WeightEditingSection from '../sections/WeightEditingSection';
import FooterCTA from '../sections/FooterCTA';
import Footer from '../sections/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <NeuralNetwork />
        <BackedBySection />
        <AttributionSection />
        <DiffSection />
        <HumanReadabilitySection />
        <FactualChecksSection />
        <EvalsSection />
        <AgenticSystemSection />
        <WeightEditingSection />
        <FooterCTA />
      </main>
      <Footer />
    </div>
  );
}
