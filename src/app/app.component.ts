import {
  MediaMatcher
} from '@angular/cdk/layout';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit
} from '@angular/core';
import {
  Store
} from '@ngrx/store';
import {
  loadUser
} from './modules/user/state/user.actions';
import {
  State
} from './app.state';
import {
  Subject,
  takeUntil
} from 'rxjs';
import {
  projectAcceptedByStudent
} from './modules/user/state/user.selectors';
import {
  UserState
} from './modules/user/state/user.state';
import {
  UserService
} from './modules/user/user.service';
import {
  Router,
  NavigationEnd
} from '@angular/router';
import {
  MatSelectChange
} from '@angular/material/select';
import {
  HttpClient
} from '@angular/common/http';

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
  mobileQuery ? : MediaQueryList;
  user!: UserState;
  unsubscribe$ = new Subject < void > ();
  projectId ? : string;
  learningMode!: string;
  isModalOpen = false;
  studyYear!: string;
  availableStudyYears!: {
    text: string;value: string
  } [];
  language = 'en';
  translations: {
    [key: string]: string
  } = {};

  private _mobileQueryListener: () => void;

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private store: Store < State > ,
    private userService: UserService,
    private router: Router,
    private http: HttpClient
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('change', this._mobileQueryListener);

    this.store.select('user').subscribe(user => {
      // Sprawdzaj, czy user istnieje, zanim zaczniesz robić .split() lub map()
      if (user && user.actualYear) {
        this.user = user;
        this.learningMode = user.actualYear.split('#')[0];
        this.studyYear = user.actualYear;
        this.availableStudyYears = user.studyYears ?.map(year => ({
          text: `${year.split('#')[1]} - ${this.translateLearningMode(year.split('#')[0])}`,
          value: year
        })) || [];
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

    // Obserwuj zmiany w body, aby wyłapać pojawienie się modala (cdk-overlay-container)
    this.setupMutationObserver();
  }

  private setupMutationObserver(): void {
    const observer = new MutationObserver((mutations) => {
      // Jeśli nastąpiła jakakolwiek zmiana w strukturze DOM, spróbuj nałożyć tłumaczenia
      this.applyTranslations();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  changeLanguage(lang: string): void {
    this.language = lang;
    localStorage.setItem('lang', lang);

    this.http.get < {
      [key: string]: string
    } > (`assets/lang_${lang}.json`).subscribe({
      next: data => {
        this.translations = data;
        this.applyTranslations();
        console.log(`🌐 Załadowano tłumaczenia dla języka: ${lang}`);
      },
      error: err => {
        console.error('🔴 Nie udało się załadować pliku tłumaczeń:', err);
      }
    });
  }

  applyTranslations(): void {
  const applyTo = (container: ParentNode) => {
    const elements = container.querySelectorAll<HTMLElement>('.translate');
    
    elements.forEach(el => {
      const key = el.getAttribute('data-translate');
      if (!key) return;

      const translated = this.translations[key];
      if (!translated) {
        console.warn(`🔸 Brakuje tłumaczenia dla: "${key}"`, el);
        return;
      }

      // Znajdź docelowy element do wpisania tekstu (albo .translate-text, albo sam el)
      const targetEl = el.querySelector('.translate-text') as HTMLElement || el;

      // KLUCZ: Aktualizuj tylko, jeśli treść faktycznie się różni
      // Zapobiega to pętlom i niepotrzebnym operacjom na DOM
      if (targetEl.innerHTML !== translated) {
        targetEl.innerHTML = translated;
      }
    });
  };

  // Uruchom dla całego dokumentu (w tym modalów)
  applyTo(document);

  // Opcjonalnie: Specyficzne sprawdzenie dla nakładek Material (Overlay)
  const overlay = document.querySelector('.cdk-overlay-container');
  if (overlay) {
    applyTo(overlay);
  }
}

  loadTranslations(lang: string): void {
    this.http.get < {
      [key: string]: string
    } > (`assets/lang_${lang}.json`).subscribe(data => {
      this.translations = data;
      this.applyTranslations();
    });
  }



  logout(): void {
    this.userService.logout().pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      window.location.reload();
    });
  }

  navigateTo(page: string, pageQueryParameter ? : string): void {
    this.router.navigate([{
      outlets: {
        modal: null
      }
    }]).then(() => {
      this.router.navigate([page], {
        queryParams: {
          page: pageQueryParameter
        }
      });
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
    return this.user ?.studyYears.filter(year => year.split('#')[1] === this.studyYear).length === 2;
  }

  get isLogged(): boolean {
    return this.user ?.logged;
  }

  get isCoordinator(): boolean {
    return this.user ?.role === 'COORDINATOR';
  }

    get isSupervisor(): boolean {
    return this.user ?.role === 'SUPERVISOR';
  }

  get showExternalLinks(): boolean {
    return this.projectId !== undefined || this.user ?.role === 'COORDINATOR';
  }

  translateLearningMode(learningMode: string): string {
    switch (learningMode) {
      case 'FULL_TIME':
        return 'Full time';
      case 'PART_TIME':
        return 'Part time';
      default:
        return '';
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.mobileQuery ?.removeEventListener('change', this._mobileQueryListener);
  }
}
