import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '@core/workspace/services/workspace.service';
import { LanguageService } from '@core/services/language.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { CreateWorkspaceModalComponent } from './create-workspace-modal.component';
import { Workspace } from '@core/workspace/models/workspace.models';

@Component({
  selector: 'app-tenant-selector',
  standalone: true,
  imports: [CommonModule, AppIconComponent, CreateWorkspaceModalComponent],
  templateUrl: './tenant-selector.component.html',
  styleUrl: './tenant-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantSelectorComponent implements OnInit {
  readonly workspaceService = inject(WorkspaceService);
  readonly languageService = inject(LanguageService);
  private readonly elementRef = inject(ElementRef);

  readonly isOpen = signal<boolean>(false);
  readonly isCreateModalOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.workspaceService.fetchWorkspaces().subscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(): void {
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);
    if (nextState) {
      this.workspaceService.fetchWorkspaces().subscribe();
    }
  }

  selectWorkspace(workspace: Workspace): void {
    if (workspace.status === 'SUSPENDED') return;
    this.workspaceService.selectWorkspace(workspace.id).subscribe();
    this.isOpen.set(false);
  }

  openCreateModal(): void {
    this.isOpen.set(false);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  onWorkspaceCreated(workspace: Workspace): void {
    this.isCreateModalOpen.set(false);
  }
}
