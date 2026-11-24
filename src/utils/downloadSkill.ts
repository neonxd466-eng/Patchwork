import { SkillSpec } from '../data/skills';

export function downloadSkillFile(skill: SkillSpec): void {
  const blob = new Blob([skill.rawMarkdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = skill.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
