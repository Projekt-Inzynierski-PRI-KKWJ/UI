import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadUser } from './modules/user/state/user.actions';
import { State } from './app.state';
import { Subject, takeUntil } from 'rxjs';
import { projectAcceptedByStudent } from './modules/user/state/user.selectors';
import { UserState } from './modules/user/state/user.state';
import { UserService } from './modules/user/user.service';
import { Router, NavigationEnd } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';

enum ROLE {
  STUDENT = 'student',
  PROJECT_ADMIN = 'project admin',
  SUPERVISOR = 'supervisor',
  COORDINATOR = 'coordinator'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy, OnInit, AfterViewInit {
  appName = 'PRI';
  mobileQuery?: MediaQueryList;
  user!: UserState;
  unsubscribe$ = new Subject<void>();
  projectId?: string;
  learningMode!: string;
  isModalOpen = false;
  studyYear!: string;
  availableStudyYears!: { text: string; value: string }[];
  language = 'en';
  translations: { [key: string]: string } = {};

  private _mobileQueryListener: () => void;

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private store: Store<State>,
    private userService: UserService,
    private router: Router,
    private http: HttpClient
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('change', this._mobileQueryListener);

    this.store.select('user').subscribe(user => {
      this.user = user;
      if (user) {
        this.learningMode = user.actualYear.split('#')[0];
        this.studyYear = user.actualYear;
        this.availableStudyYears = user.studyYears.map(year => ({
          text: `${year.split('#')[1]} - ${this.translateLearningMode(year.split('#')[0])}`,
          value: year
        }));
      }
    });
    this.store.dispatch(loadUser());
  }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isModalOpen = event.url.includes('modal') && !event.url.includes('redirectTo');

        // Sprawdzenie i ustawienie języka przy każdej zmianie strony
        const savedLang = localStorage.getItem('lang') || 'en';
        this.changeLanguage(savedLang);
      }
    });

    this.store.select(projectAcceptedByStudent).pipe(takeUntil(this.unsubscribe$)).subscribe(
      projectId => this.projectId = projectId
    );
  }

  ngAfterViewInit(): void {
    const savedLang = localStorage.getItem('lang') || 'en';
    this.changeLanguage(savedLang);
  }

  changeLanguage(lang: string): void {
  this.language = lang;
  localStorage.setItem('lang', lang);

  this.http.get<{ [key: string]: string }>(`assets/lang_${lang}.json`).subscribe(data => {
    this.translations = data;
    this.applyTranslations();
  });
}


  applyTranslations(): void {
  const applyTo = (container: ParentNode) => {
    const elements = container.querySelectorAll<HTMLElement>('.translate');
    elements.forEach(el => {
      const key = el.getAttribute('data-translate');
      if (key) {
        const translated = this.translations[key];
        if (translated) {
          const textEl = el.querySelector('.translate-text');
          if (textEl) {
            textEl.textContent = translated;
          } else {
            let replaced = false;
            for (let i = 0; i < el.childNodes.length; i++) {
              const node = el.childNodes[i];
              if (node.nodeType === Node.TEXT_NODE) {
                node.nodeValue = translated;
                replaced = true;
                break;
              }
            }
            if (!replaced) {
              el.innerText = translated;
            }
          }
        } else {
          console.warn(`Missing translation for: "${key}"`, el);
        }
      }
    });
  };

  applyTo(document);

  const overlay = document.querySelector('.cdk-overlay-container');
  if (overlay) {
    applyTo(overlay);
  }
}



  loadTranslations(lang: string): void {
    this.http.get<{ [key: string]: string }>(`assets/lang_${lang}.json`).subscribe(data => {
      this.translations = data;
      this.applyTranslations();
    });
  }

  logout(): void {
    this.userService.logout().pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      window.location.reload();
    });
  }

  navigateTo(page: string, pageQueryParameter?: string): void {
    this.router.navigate([{ outlets: { modal: null } }]).then(() => {
      this.router.navigate([page], { queryParams: { page: pageQueryParameter } });
    });
  }

  studyYearChanged(event: MatSelectChange): void {
    this.userService.changeStudyYear(this.studyYear).pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      window.location.reload();
    });
  }

  get role(): string {
    return ROLE[this.user.role];
  }

  get hasBothLearningModes(): boolean {
    return this.user?.studyYears.filter(year => year.split('#')[1] === this.studyYear).length === 2;
  }

  get isLogged(): boolean {
    return this.user?.logged;
  }

  get isCoordinator(): boolean {
    return this.user?.role === 'COORDINATOR';
  }

  get showExternalLinks(): boolean {
    return this.projectId !== undefined || this.user?.role === 'COORDINATOR';
  }

  translateLearningMode(learningMode: string): string {
    switch (learningMode) {
      case 'FULL_TIME': return 'Full time';
      case 'PART_TIME': return 'Part time';
      default: return '';
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.mobileQuery?.removeEventListener('change', this._mobileQueryListener);
  }
}
