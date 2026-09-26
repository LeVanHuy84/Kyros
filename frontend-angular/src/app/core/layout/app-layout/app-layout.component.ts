import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopNavComponent } from '../top-nav/top-nav.component';
import { ToastContainerComponent } from '@shared/components/toast/toast-container.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    TopNavComponent,
    ToastContainerComponent,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  readonly sidebarCollapsed = signal<boolean>(false);

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.sidebarCollapsed.set(true);
    }

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          this.sidebarCollapsed.set(true);
        }
      });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }
}
