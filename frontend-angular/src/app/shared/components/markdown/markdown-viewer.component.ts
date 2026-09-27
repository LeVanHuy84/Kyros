import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked, RendererObject, Tokens } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';

// Import essential PrismJS language grammars
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-markup'; // HTML & XML
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeLanguage(lang?: string): string {
  if (!lang) return '';
  const clean = lang.toLowerCase().trim();
  const aliasMap: Record<string, string> = {
    ts: 'typescript',
    typescript: 'typescript',
    js: 'javascript',
    javascript: 'javascript',
    html: 'markup',
    markup: 'markup',
    xml: 'markup',
    svg: 'markup',
    css: 'css',
    scss: 'scss',
    json: 'json',
    sh: 'bash',
    bash: 'bash',
    shell: 'bash',
    zsh: 'bash',
    python: 'python',
    py: 'python',
    java: 'java',
    sql: 'sql',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    markdown: 'markdown',
  };
  return aliasMap[clean] || (Prism.languages[clean] ? clean : '');
}

// Custom Marked Renderer for Modern AI Chat Message Styling
const customRenderer: RendererObject = {
  code(token: Tokens.Code): string {
    const rawText = token.text || '';
    const rawLang = (token.lang || 'code').trim();
    const prismLang = normalizeLanguage(rawLang);

    let highlightedHtml = '';
    if (prismLang && Prism.languages[prismLang]) {
      try {
        highlightedHtml = Prism.highlight(
          rawText,
          Prism.languages[prismLang],
          prismLang
        );
      } catch {
        highlightedHtml = escapeHtml(rawText);
      }
    } else {
      highlightedHtml = escapeHtml(rawText);
    }

    const encodedCode = encodeURIComponent(rawText);
    const displayLang = escapeHtml(rawLang.toLowerCase());

    return (
      `<div class="code-block-wrapper">` +
      `<div class="code-block-header">` +
      `<span class="code-block-lang">${displayLang}</span>` +
      `<button type="button" class="code-copy-btn" data-code="${encodedCode}" title="Copy code">` +
      `<svg class="copy-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
      `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>` +
      `<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>` +
      `</svg>` +
      `<span>Copy</span>` +
      `</button>` +
      `</div>` +
      `<pre class="code-block-pre"><code class="language-${displayLang}">${highlightedHtml}</code></pre>` +
      `</div>`
    );
  },
};

// Configure marked with custom options
marked.use({
  renderer: customRenderer,
  gfm: true,
  breaks: true,
});

@Component({
  selector: 'app-markdown-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './markdown-viewer.component.html',
  styleUrl: './markdown-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownViewerComponent {
  content = input.required<string>();

  private readonly sanitizer = inject(DomSanitizer);

  readonly safeHtml = computed<SafeHtml>(() => {
    const rawMarkdown = this.content() || '';
    if (!rawMarkdown.trim()) {
      return '';
    }

    try {
      const parsedHtml = marked.parse(rawMarkdown, { async: false }) as string;

      const cleanHtml = DOMPurify.sanitize(parsedHtml, {
        ADD_TAGS: ['svg', 'path', 'rect', 'button', 'span', 'pre', 'code', 'div'],
        ADD_ATTR: [
          'data-code',
          'class',
          'type',
          'title',
          'viewBox',
          'width',
          'height',
          'fill',
          'stroke',
          'stroke-width',
          'stroke-linecap',
          'stroke-linejoin',
          'd',
          'x',
          'y',
          'rx',
          'ry',
          'target',
          'rel',
        ],
      });

      return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
    } catch {
      return this.sanitizer.bypassSecurityTrustHtml(escapeHtml(rawMarkdown));
    }
  });

  onViewerClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const copyBtn = target.closest('.code-copy-btn') as HTMLElement | null;
    if (!copyBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const rawEncoded = copyBtn.getAttribute('data-code');
    if (!rawEncoded) return;

    const codeToCopy = decodeURIComponent(rawEncoded);
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(codeToCopy)
        .then(() => {
          const span = copyBtn.querySelector('span');
          if (span) {
            const originalText = span.textContent;
            span.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              span.textContent = originalText;
              copyBtn.classList.remove('copied');
            }, 2000);
          }
        })
        .catch(() => {});
    }
  }
}

