import { motion } from 'framer-motion';
import HeroSection from '../components/home/HeroSection';
import FeatureGrid from '../components/home/FeatureGrid';

export default function Home() {
  return (
    <div>
      <HeroSection />

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-24"
      >
        <FeatureGrid />
      </motion.section>
    </div>
  );
}
