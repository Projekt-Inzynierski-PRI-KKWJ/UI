import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HelpDialogComponent, HelpDialogData } from './help-dialog/help-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  constructor(private dialog: MatDialog) {}

  openHelp(data: HelpDialogData): void {
    this.dialog.open(HelpDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: data,
      panelClass: 'help-dialog-panel'
    });
  }

  // Przykładowe metody dla różnych sekcji
  openProjectMarketplaceHelp(): void {
    this.openHelp({
      title: 'Giełda projektów - Instrukcja',
      tabs: [
        {
          id: 'browse',
          label: 'Przeglądanie',
          content: `
            <h3>Jak przeglądać projekty</h3>
            <ul>
              <li>Użyj pola wyszukiwania aby znaleźć projekt po nazwie lub technologii</li>
              <li>Filtruj projekty według dostępności (otwarte/zamknięte)</li>
              <li>Kliknij na projekt aby zobaczyć szczegóły</li>
            </ul>
            <p class="note">Uwaga: Tylko otwarte projekty przyjmują nowe aplikacje studentów.</p>
          `
        },
        {
          id: 'apply',
          label: 'Aplikowanie',
          content: `
            <h3>Jak aplikować do projektu</h3>
            <ol>
              <li>Wybierz interesujący projekt z listy</li>
              <li>Kliknij przycisk "Aplikuj do projektu"</li>
              <li>Wypełnij formularz aplikacyjny:
                <ul>
                  <li><strong>Umiejętności:</strong> Opisz swoje umiejętności techniczne (min. 10 znaków)</li>
                  <li><strong>Dodatkowe informacje:</strong> Opcjonalnie dodaj linki do portfolio, GitHub</li>
                  <li><strong>Email:</strong> Adres kontaktowy</li>
                </ul>
              </li>
              <li>Zatwierdź aplikację</li>
            </ol>
            <p class="note">Możesz śledzić status swojej aplikacji w zakładce "Moje wnioski".</p>
          `
        },
        {
          id: 'submit',
          label: 'Zgłaszanie projektu',
          content: `
            <h3>Jak zgłosić nowy projekt</h3>
            <ol>
              <li>Kliknij przycisk "Zgłoś nowy projekt"</li>
              <li>Wypełnij wymagane pola:
                <ul>
                  <li><strong>Nazwa projektu:</strong> Krótka, opisowa nazwa</li>
                  <li><strong>Opis:</strong> Szczegółowy opis projektu i celów</li>
                  <li><strong>Technologie:</strong> Dodaj technologie, które będą używane</li>
                </ul>
              </li>
              <li>Zatwierdź formularz</li>
            </ol>
            <p class="note">Projekt zostanie przesłany do akceptacji przez opiekuna.</p>
          `
        }
      ]
    });
  }

  openProjectDetailsHelp(): void {
    this.openHelp({
      title: 'Szczegóły projektu - Instrukcja',
      tabs: [
        {
          id: 'criteria',
          label: 'Kryteria',
          content: `
            <h3>Zarządzanie kryteriami</h3>
            <h4>Dodawanie kryterium:</h4>
            <ol>
              <li>Kliknij "Dodaj kryteria"</li>
              <li>Wybierz semestr (I lub II)</li>
              <li>Wybierz typ: Wymagane, Oczekiwane, lub Wskaźniki</li>
              <li>Wybierz status realizacji</li>
              <li>Dodaj tytuł i opcjonalny komentarz</li>
            </ol>
            <h4>Statusy realizacji:</h4>
            <ul>
              <li><strong>Do zrobienia:</strong> Kryterium nie zostało rozpoczęte</li>
              <li><strong>Częściowo zrealizowane:</strong> Kryterium w trakcie realizacji</li>
              <li><strong>Zrealizowane:</strong> Kryterium ukończone</li>
            </ul>
          `
        },
        {
          id: 'grading',
          label: 'Ocenianie',
          content: `
            <h3>System oceniania</h3>
            <ul>
              <li>Oceny są przyznawane za każdy semestr osobno</li>
              <li>Ocena końcowa jest obliczana automatycznie</li>
              <li>Oceny mogą być edytowane przez opiekuna projektu</li>
            </ul>
            <p class="note">Blokada projektu uniemożliwia dalsze zmiany w kryteriach.</p>
          `
        },
        {
          id: 'members',
          label: 'Członkowie',
          content: `
            <h3>Zarządzanie zespołem</h3>
            <ul>
              <li>Wyświetl listę wszystkich członków zespołu</li>
              <li>Zobacz role przypisane do członków (Front-end, Back-end, Full-stack)</li>
              <li>Sprawdź status akceptacji projektu przez każdego członka</li>
            </ul>
          `
        }
      ]
    });
  }

  openDefenseScheduleHelp(): void {
    this.openHelp({
      title: 'Harmonogram obron - Instrukcja',
      tabs: [
        {
          id: 'register',
          label: 'Rejestracja',
          content: `
            <h3>Jak zarejestrować się na obronę</h3>
            <ol>
              <li>Wybierz dostępny termin z kalendarza</li>
              <li>Kliknij wybrany slot czasowy</li>
              <li>Potwierdź rejestrację</li>
            </ol>
            <p class="note">Możesz zmienić termin obrony, jeśli są dostępne inne sloty.</p>
          `
        },
        {
          id: 'committee',
          label: 'Komisja',
          content: `
            <h3>Wybór komisji egzaminacyjnej</h3>
            <ul>
              <li>Wybierz członków komisji z listy dostępnych opiekunów</li>
              <li>Minimum wymagane osoby: 2 (opiekun + recenzent)</li>
              <li>Możesz dodać dodatkowych członków komisji</li>
            </ul>
          `
        }
      ]
    });
  }

  openStatisticsHelp(): void {
    this.openHelp({
      title: 'Statystyki - Instrukcja',
      tabs: [
        {
          id: 'overview',
          label: 'Przegląd',
          content: `
            <h3>Statystyki projektów</h3>
            <ul>
              <li><strong>Projekty zaliczone:</strong> Projekty, które spełniły wszystkie kryteria</li>
              <li><strong>Projekty niezaliczone:</strong> Projekty, które nie spełniły wymagań</li>
            </ul>
            <h4>Typy wykresów:</h4>
            <ul>
              <li><strong>Słupkowy:</strong> Porównanie wartości</li>
              <li><strong>Kołowy:</strong> Proporcje całości</li>
              <li><strong>Pączkowy:</strong> Proporcje z pustym środkiem</li>
            </ul>
          `
        },
        {
          id: 'details',
          label: 'Szczegóły projektu',
          content: `
            <h3>Analiza szczegółowa projektu</h3>
            <p>Po kliknięciu na projekt zobaczysz:</p>
            <ul>
              <li>Oceny za oba semestry</li>
              <li>Procent uzyskanych punktów</li>
              <li>Rozkład kryteriów według typu i semestru</li>
              <li>Statusy realizacji poszczególnych kryteriów</li>
            </ul>
          `
        }
      ]
    });
  }

  openStudentInfoHelp(): void {
    this.openHelp({
      title: 'Informacje o studentach - Instrukcja',
      tabs: [
        {
          id: 'search',
          label: 'Wyszukiwanie',
          content: `
            <h3>Jak wyszukać studenta</h3>
            <ul>
              <li>Użyj pola wyszukiwania aby znaleźć studenta po:
                <ul>
                  <li>Imieniu i nazwisku</li>
                  <li>Numerze indeksu</li>
                  <li>Adresie email</li>
                </ul>
              </li>
              <li>Filtruj według roku studiów</li>
              <li>Filtruj według posiadania projektu (Tak/Nie/Wszystkie)</li>
            </ul>
          `
        },
        {
          id: 'export',
          label: 'Eksport',
          content: `
            <h3>Eksport danych studenta do PDF</h3>
            <ol>
              <li>Kliknij na studenta z listy</li>
              <li>Przejrzyj szczegółowe informacje</li>
              <li>Kliknij przycisk "Eksportuj do PDF"</li>
            </ol>
            <p>Raport PDF zawiera:</p>
            <ul>
              <li>Dane osobowe studenta</li>
              <li>Informacje o przypisanych projektach</li>
              <li>Oceny za semestry</li>
              <li>Termin obrony (jeśli dostępny)</li>
            </ul>
          `
        }
      ]
    });
  }
}
