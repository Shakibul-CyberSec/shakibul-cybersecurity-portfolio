import Navbar from './components/Navbar';
import Header from './components/Header';
import About from './components/About';
import Skills from './components/Skills';
import ReconTool from './components/ReconTool';
import Certifications from './components/Certifications';
import Contact from './components/Contact';

export default function Home() {
  return (
    <>
      <Navbar />
      <Header />
      <About />
      <Skills />
      <ReconTool />
      <Certifications />
      <Contact />
    </>
  );
}