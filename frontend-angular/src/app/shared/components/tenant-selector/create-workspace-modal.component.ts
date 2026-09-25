import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { WorkspaceService } from '@core/workspace/services/workspace.service';
import { LanguageService } from '@core/services/language.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { Workspace } from '@core/workspace/models/workspace.models';

@Component({
  selector: 'app-create-workspace-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    AppIconComponent,
  ],
  templateUrl: './create-workspace-modal.component.html',
  styleUrl: './create-workspace-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateWorkspaceModalComponent {
  private readonly workspaceService = inject(WorkspaceService);
  private readonly toastService = inject(ToastService);
  readonly languageService = inject(LanguageService);

  isOpen = input<boolean>(false);
  closeModal = output<void>();
  workspaceCreated = output<Workspace>();

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
    }),
  });

  handleClose(): void {
    this.form.reset();
    this.errorMessage.set(null);
    this.closeModal.emit();
  }

  handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.controls.name.value.trim();
    if (!name) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.workspaceService.createWorkspace(name).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.toastService.success(
          `${this.languageService.t().workspace.createSuccess}: "${created.name}"`,
          this.languageService.t().common.success
        );
        this.workspaceCreated.emit(created);
        this.handleClose();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.detail || this.languageService.t().workspace.failedCreate;
        this.errorMessage.set(msg);
      },
    });
  }
}
