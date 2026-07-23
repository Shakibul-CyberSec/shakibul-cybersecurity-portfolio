import Navbar from './components/Navbar';
import Header from './components/Header';
import About from './components/About';
import Skills from './components/Skills';
import SecuritySOC from './components/SecuritySOC';
import TerminalShell from './components/TerminalShell';
import SecurityWriteups from './components/SecurityWriteups';
import Certifications from './components/Certifications';
import Contact from './components/Contact';
import ThemeSwitcher from './components/ThemeSwitcher';

export default function Home() {
  return (
    <>
      <Navbar />
      <Header />
      <About />
      <Skills />
      <SecuritySOC />
      <TerminalShell />
      <SecurityWriteups />
      <Certifications />
      <Contact />
      <ThemeSwitcher />
    </>
  );
}