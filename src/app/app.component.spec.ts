import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { provideMockStore } from '@ngrx/store/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MediaMatcher } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { UserService } from './modules/user/user.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;
  let httpMock: HttpTestingController;

  const mediaMatcherMock = {
    matchMedia: jasmine.createSpy('matchMedia').and.returnValue({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {}
    } as unknown as MediaQueryList)
  };

  const userServiceMock = jasmine.createSpyObj('UserService', ['logout', 'changeStudyYear']);

  beforeEach(async () => {
    userServiceMock.logout.and.returnValue(of(null));
    userServiceMock.changeStudyYear.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [AppComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MediaMatcher, useValue: mediaMatcherMock },
        { provide: UserService, useValue: userServiceMock },
        provideMockStore({ 
          initialState: { 
            user: { 
              actualYear: '2024/2025#FULL_TIME', 
              studyYears: [], 
              logged: true, 
              role: 'STUDENT' 
            } 
          } 
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('applyTranslations should replace text for elements with data-translate', () => {
    const host = fixture.nativeElement;
    host.innerHTML = '<div class="translate" data-translate="hello">Hello</div>';
    
    app.translations = { hello: 'Cześć' };
    
    app.applyTranslations();

    const translatedEl = host.querySelector('[data-translate="hello"]');
    expect(translatedEl?.innerHTML).toBe('Cześć');
  });

  it('changeLanguage should load translation file and call applyTranslations', () => {
    const applySpy = spyOn(app, 'applyTranslations').and.callThrough();
    const lang = 'pl';
    const mockResponse = { sample_key: 'Przykład' };

    app.changeLanguage(lang);

    const req = httpMock.expectOne(`assets/lang_${lang}.json`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(app.translations['sample_key']).toBe('Przykład');
    expect(applySpy).toHaveBeenCalled();
  });
});
