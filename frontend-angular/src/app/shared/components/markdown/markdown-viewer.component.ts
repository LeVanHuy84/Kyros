import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

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
    const parsedHtml = marked.parse(rawMarkdown, {
      async: false,
      gfm: true,
      breaks: true,
    }) as string;

    const cleanHtml = DOMPurify.sanitize(parsedHtml);
    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  });
}
