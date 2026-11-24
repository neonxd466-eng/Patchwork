import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { AppRoute } from '../components/Navbar';

interface DocsPageProps {
  onNavigate: (route: AppRoute) => void;
}

type OsTab = 'mac' | 'linux' | 'windows';

const INSTALL_SNIPPETS: Record<OsTab, string> = {
  mac: `# Install ffmpeg + Python packages for Carbon and Argon
brew install ffmpeg python@3.11
python3 -m pip install numpy opencv-python Pillow`,
  linux: `# Ubuntu / Debian
sudo apt update && sudo apt install -y ffmpeg python3 python3-pip
python3 -m pip install numpy opencv-python Pillow`,
  windows: `# Windows (winget + pip)
winget install Gyan.FFmpeg Python.Python.3.11
py -m pip install numpy opencv-python Pillow`,
};

export function DocsPage({ onNavigate }: DocsPageProps) {
  const [osTab, setOsTab] = useState<OsTab>('mac');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-28 pb-24">
      <div className="border-b border-[var(--border-hairline)] pb-10">
        <p className="text-xs font-medium text-[var(--accent)]">Documentation</p>
        <h1 className="font-display mt-2 text-balance text-4xl font-semibold tracking-tight text-[var(--text)]">
          Using Patchwork skills across AI models and local editors.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--text-soft)]">
          Step-by-step integration guides for Google Gemini, Anthropic Claude, OpenAI ChatGPT,
          Cursor, and local FFmpeg / Remotion pipelines.
        </p>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[240px_1fr] items-start">
        {/* Sidebar TOC */}
        <nav aria-label="Documentation sections" className="lg:sticky lg:top-24 space-y-2 text-sm">
          <a href="#doc-overview" className="block py-1.5 text-[var(--text-soft)] hover:text-[var(--text)]">
            Overview & Choosing a Skill
          </a>
          <a href="#doc-gemini" className="block py-1.5 text-[var(--text-soft)] hover:text-[var(--text)]">
            Using with Gemini
          </a>
          <a href="#doc-claude" className="block py-1.5 text-[var(--text-soft)] hover:text-[var(--text)]">
            Using with Claude
          </a>
          <a href="#doc-chatgpt" className="block py-1.5 text-[var(--text-soft)] hover:text-[var(--text)]">
            Using with ChatGPT
          </a>
          <a href="#doc-other" className="block py-1.5 text-[var(--text-soft)] hover:text-[var(--text)]">
            Cursor, Windsurf & CLI
          </a>
          <a href="#doc-toolchain" className="block py-1.5 text-[var(--text-soft)] hover:text-[var(--text)]">
            FFmpeg & Python Setup
          </a>
        </nav>

        <div className="space-y-16 max-w-3xl">
          {/* Overview */}
          <section id="doc-overview" className="scroll-mt-24 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              Overview & Choosing a Skill
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-soft)]">
              Patchwork skills are structured Markdown prompt-and-workflow specifications with YAML
              frontmatter. When attached to an AI model, they turn generic video questions into a
              disciplined reverse-engineering loop with explicit guardrails against hallucinated
              frame numbers or invented plugin names.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 pt-2 text-xs">
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
                <p className="font-semibold text-[var(--text)]">Hydrogen (Free)</p>
                <p className="mt-1 text-[var(--text-soft)]">
                  Best for browser chat models (Gemini, Claude.ai, ChatGPT) with zero local scripts.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
                <p className="font-semibold text-[var(--text)]">Carbon (Pro)</p>
                <p className="mt-1 text-[var(--text-soft)]">
                  Adds exact cut timestamps, BPM detection, average color per shot, and target retiming.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
                <p className="font-semibold text-[var(--text)]">Argon (Max)</p>
                <p className="mt-1 text-[var(--text-soft)]">
                  Full automated render pipeline: subject tracking, speech-pause snapping, ProRes alpha pass, and QA.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
                <p className="font-semibold text-[var(--text)]">Neon (Max)</p>
                <p className="mt-1 text-[var(--text-soft)]">
                  Autonomous style-transfer engine combining Remotion, Three.js/GLSL, Manim, FFmpeg sparse alpha compositing, and closed-loop visual diffing.
                </p>
              </div>
            </div>
          </section>

          {/* Gemini */}
          <section id="doc-gemini" className="scroll-mt-24 space-y-4 border-t border-[var(--border-hairline)] pt-12">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              Using with Gemini (AI Studio, Gems & API)
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-soft)]">
              Gemini natively processes video files frame-by-frame alongside audio tracks, making it
              especially strong with <strong className="text-[var(--text)]">Hydrogen</strong> and{' '}
              <strong className="text-[var(--text)]">Neon</strong> without needing external frame
              extraction.
            </p>
            <ol className="space-y-3 text-sm text-[var(--text-soft)] list-decimal pl-5">
              <li>
                <strong className="text-[var(--text)]">Google AI Studio:</strong> Open a new prompt,
                paste the contents of <code className="font-mono text-xs text-[#bfd0ff]">hydrogen.md</code> into{' '}
                <em>System Instructions</em>, then upload your reference <code className="font-mono text-xs">.mp4</code>{' '}
                and target clip directly into the prompt.
              </li>
              <li>
                <strong className="text-[var(--text)]">Gemini Gems:</strong> Create a Gem named{' '}
                <em>Edit Reverse Engineer</em>, upload <code className="font-mono text-xs">hydrogen.md</code>{' '}
                to Knowledge, and instruct it to always present the compact recipe table before
                writing FFmpeg or Remotion code.
              </li>
              <li>
                <strong className="text-[var(--text)]">Gemini API / CLI:</strong> Pass the skill file
                as <code className="font-mono text-xs">systemInstruction</code> when analyzing
                reference videos in batch.
              </li>
            </ol>
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2">
                <span>Example Gemini prompt</span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      'gemini-prompt',
                      'Analyze reference_reel.mp4 using the Hydrogen workflow. Build the shot & transition recipe table first, then write a 1080x1920 FFmpeg filter chain to apply this pacing and color grade to my target_clip.mp4.',
                    )
                  }
                  className="inline-flex items-center gap-1 text-[var(--text-soft)] hover:text-[var(--text)] cursor-pointer"
                >
                  {copiedKey === 'gemini-prompt' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'gemini-prompt' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto font-mono text-xs text-[#cfd9f7] whitespace-pre-wrap">
                {`Analyze reference_reel.mp4 using the Hydrogen workflow. Build the shot & transition recipe table first, then write a 1080x1920 FFmpeg filter chain to apply this pacing and color grade to my target_clip.mp4.`}
              </pre>
            </div>
          </section>

          {/* Claude */}
          <section id="doc-claude" className="scroll-mt-24 space-y-4 border-t border-[var(--border-hairline)] pt-12">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              Using with Claude (Projects & Claude Code)
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-soft)]">
              Claude Code and Claude Desktop with local filesystem access can execute the full{' '}
              <strong className="text-[var(--text)]">Carbon</strong> and{' '}
              <strong className="text-[var(--text)]">Argon</strong> pipelines end-to-end—running
              shot detection, inspecting extracted keyframes visually, rendering MP4s, and checking
              the QA contact sheet.
            </p>
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-2">
                <span>Claude Code skill directory layout</span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      'claude-tree',
                      'mkdir -p .claude/skills/argon && mv ~/Downloads/argon.md .claude/skills/argon/SKILL.md',
                    )
                  }
                  className="inline-flex items-center gap-1 text-[var(--text-soft)] hover:text-[var(--text)] cursor-pointer"
                >
                  {copiedKey === 'claude-tree' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'claude-tree' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto font-mono text-xs text-[#cfd9f7]">
                <code>{`mkdir -p .claude/skills/argon\nmv ~/Downloads/argon.md .claude/skills/argon/SKILL.md`}</code>
              </pre>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-soft)]">
              In Claude web Projects, upload <code className="font-mono text-xs">hydrogen.md</code>{' '}
              or <code className="font-mono text-xs">carbon.md</code> to <em>Project Knowledge</em>{' '}
              and enable the analysis tool so Claude can run Python scripts on uploaded clips.
            </p>
          </section>

          {/* ChatGPT */}
          <section id="doc-chatgpt" className="scroll-mt-24 space-y-4 border-t border-[var(--border-hairline)] pt-12">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              Using with ChatGPT (Custom GPTs & Code Interpreter)
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-soft)]">
              ChatGPT pairs cleanly with Patchwork via Custom GPTs or ChatGPT Projects with Code
              Interpreter turned on.
            </p>
            <ul className="space-y-2.5 text-sm text-[var(--text-soft)] list-disc pl-5">
              <li>
                Open <em>Explore GPTs → Create</em> and paste the skill summary into Instructions.
              </li>
              <li>
                Upload <code className="font-mono text-xs">hydrogen.md</code>,{' '}
                <code className="font-mono text-xs">carbon.md</code>, or{' '}
                <code className="font-mono text-xs">argon.md</code> under <em>Knowledge</em>.
              </li>
              <li>
                Check <strong>Code Interpreter & Data Analysis</strong> so ChatGPT can run Python,
                OpenCV, and FFmpeg frame extraction on uploaded MP4s and return downloadable outputs.
              </li>
            </ul>
          </section>

          {/* Other tools */}
          <section id="doc-other" className="scroll-mt-24 space-y-4 border-t border-[var(--border-hairline)] pt-12">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              Cursor, Windsurf, Remotion & NLE Workflows
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-soft)]">
              For coding agents like Cursor, Windsurf, or Codex CLI, save the skill Markdown inside{' '}
              <code className="font-mono text-xs">.cursor/rules/</code> or your repo root. When
              working with Premiere Pro, DaVinci Resolve, or Final Cut Pro, ask Argon to run with{' '}
              <code className="font-mono text-xs text-[#bfd0ff]">--no-composite --alpha-out text_pass.mov</code>{' '}
              so animated typography exports as a clean transparent ProRes layer you can nudge on
              your timeline.
            </p>
          </section>

          {/* Toolchain */}
          <section id="doc-toolchain" className="scroll-mt-24 space-y-4 border-t border-[var(--border-hairline)] pt-12">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">
              FFmpeg & Python Toolchain Setup
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-soft)]">
              Hydrogen requires no local tools. Carbon requires <code className="font-mono text-xs">ffmpeg</code>,{' '}
              <code className="font-mono text-xs">ffprobe</code>, Python 3, and <code className="font-mono text-xs">numpy</code>.
              Argon adds <code className="font-mono text-xs">opencv-python</code> and <code className="font-mono text-xs">Pillow</code>.
            </p>

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-4 py-2">
                <div className="flex gap-2">
                  {(
                    [
                      ['mac', 'macOS'],
                      ['linux', 'Linux'],
                      ['windows', 'Windows'],
                    ] as [OsTab, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOsTab(id)}
                      className={`rounded-md px-3 py-1 text-xs font-medium cursor-pointer ${
                        osTab === id
                          ? 'bg-white/10 text-[var(--text)]'
                          : 'text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => copyText('os-install', INSTALL_SNIPPETS[osTab])}
                  className="inline-flex items-center gap-1 text-xs text-[var(--text-soft)] hover:text-[var(--text)] cursor-pointer"
                >
                  {copiedKey === 'os-install' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'os-install' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-[#cfd9f7]">
                <code>{INSTALL_SNIPPETS[osTab]}</code>
              </pre>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-[#06070c] hover:bg-[#94b5ff] cursor-pointer"
              >
                Go to Skill Downloads
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
