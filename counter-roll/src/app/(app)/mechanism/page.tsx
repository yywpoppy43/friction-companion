import type { Metadata } from 'next';
import Link from 'next/link';
import { Door } from '@/components/mechanism/Door';
import { Taste } from '@/components/mechanism/Taste';
import { ConverterScene } from '@/components/mechanism/ConverterScene';
import { Ground } from '@/components/mechanism/Ground';
import { Rope } from '@/components/mechanism/Rope';
import { WayOut } from '@/components/mechanism/WayOut';
import { Grounds } from '@/components/mechanism/Grounds';
import { Open } from '@/components/mechanism/Open';
import './mechanism.css';

export const metadata: Metadata = { title: 'Mechanism' };

/**
 * Mechanism — the explanatory scenes from the reference page, as interactive components. They are
 * the "why" the instruments rest on. No data is read: the owner check happens in the layout.
 * The two instruments (6 · the sort, 7 · the examiner) live on their own screens and are linked from here.
 */
export default function MechanismPage() {
  return (
    <div className="mechanism">
      <header>
        <h2 className="h1">The Counter-Roll</h2>
        <p className="thesis">Control is a copy held against a living thing. The copy can sit in the structure. It can also sit in you. Both come through one door, and the door has one alarm.</p>
        <nav className="nav" aria-label="Scenes">
          <a href="#door">1 · the door</a>
          <a href="#taste">2 · the taste</a>
          <a href="#converter">3 · the converter</a>
          <a href="#ground">4 · two childhoods</a>
          <a href="#rope">5 · the rope</a>
          <Link href="/place">6 · the sort</Link>
          <Link href="/examiner">7 · the examiner</Link>
          <a href="#out">8 · the way out</a>
          <a href="#grounds">grounds</a>
          <a href="#open">open</a>
        </nav>
      </header>

      <Door />
      <Taste />
      <ConverterScene />
      <Ground />
      <Rope />

      <section className="scene" id="sort">
        <p className="mono"><b>6</b> · the algorithm</p>
        <h2>A structure is control to the degree it holds a copy of you and its terms were set for you. The alarm it deserves is the sum. The alarm you feel adds your converter. The remainder is the knot.</h2>
        <div className="text">
          <p>Two parts. Part one measures the structure: four dimensions for how much of it is a copy, three for how much was done to you. Part two measures you: four questions on the converter, answered once and kept. Then the felt alarm is split three ways. What the structure warrants. What your converter adds. What neither explains.</p>
        </div>
        <div className="row"><Link className="btn" href="/place">open the sort</Link></div>
      </section>

      <section className="scene" id="examiner">
        <p className="mono"><b>7</b> · the practice · uninstalling the converter</p>
        <h2>The first sentence is a reflex. You cannot stop it arriving. You can train a second sentence until it arrives almost as fast.</h2>
        <div className="row"><Link className="btn" href="/examiner">open the examiner</Link></div>
      </section>

      <WayOut />
      <Grounds />
      <Open />
    </div>
  );
}
