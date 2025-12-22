import { Component, OnInit } from '@angular/core';
import { StatisticsService } from './statistics.service';
import { ChartData, ChartOptions } from 'chart.js';
import { Store } from '@ngrx/store';
import { selectActualYear } from '../user/state/user.selectors';
import { Project } from '../project/models/project.model';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
    },
    tooltip: {
      enabled: true,
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
};


  chartType: 'bar' | 'doughnut' | 'pie' = 'bar';

  projects: Project[] = [];
  selectedProject: Project | null = null;

  passedProjects: string[] = [];
  failedProjects: string[] = [];

  // dane głównego wykresu
  criteriaSummaryChartData: ChartData<'bar' | 'pie' | 'doughnut'> = { labels: [], datasets: [] };

  // dane semestru
  firstSemesterChartData: ChartData<'bar' | 'pie' | 'doughnut'> = { labels: [], datasets: [] };
  secondSemesterChartData: ChartData<'bar' | 'pie' | 'doughnut'> = { labels: [], datasets: [] };

  // kryteria projektów
  expectedFirst!: ChartData<'bar' | 'pie' | 'doughnut'>;
  requiredFirst!: ChartData<'bar' | 'pie' | 'doughnut'>;
  measurableFirst!: ChartData<'bar' | 'pie' | 'doughnut'>;

  expectedSecond!: ChartData<'bar' | 'pie' | 'doughnut'>;
  requiredSecond!: ChartData<'bar' | 'pie' | 'doughnut'>;
  measurableSecond!: ChartData<'bar' | 'pie' | 'doughnut'>;

  colors = {
    todo: '#ff6384',
    partial: '#f6ca64ff',
    done: '#4bc0c0',

    gained: '#03f507ff',
    missing: '#fa584cff'
  };

  constructor(
    private store: Store,
    private statisticsService: StatisticsService
  ) {}

  ngOnInit(): void {
    this.store.select(selectActualYear).subscribe(studyYear => {
      if (!studyYear) return;

      this.statisticsService.getProjects(studyYear).subscribe({
        next: projects => {
          this.projects = projects;

          this.passedProjects = projects.filter(p => p.criteriaMet).map(p => p.name);
          this.failedProjects = projects.filter(p => !p.criteriaMet).map(p => p.name);

          this.criteriaSummaryChartData = this.makeChart(
            {
              labels: ['Passed projects', 'Faild projects'],
              values: [this.passedProjects.length, this.failedProjects.length],
              colors: ['#4caf50', '#f44336']
            }, 
            'Projects'
          );
        }
      });
    });
  }

  openProject(project: Project): void {
    this.selectedProject = project;

    const first = this.parsePercent(''+project.firstSemesterGrade);
    const second = this.parsePercent(''+project.secondSemesterGrade);

    this.firstSemesterChartData = this.makeChart(
      {
        labels: ['Gained Points', 'Missing Points'],
        values: [first, 100 - first],
        colors: [this.colors.gained, this.colors.missing]
      },
      'Semestr 1'
    );

    this.secondSemesterChartData = this.makeChart(
      {
        labels: ['Gained Points', 'Missing Points'],
        values: [second, 100 - second],
        colors: [this.colors.gained, this.colors.missing]
      },
      'Semestr 2'
    );

    this.statisticsService.getProjectCriteria(Number(project.id!)).subscribe(criteria => {
      this.prepareCharts(criteria);
    });
  }

  private parsePercent(value: string | null): number {
    if (!value) return 0;
    return Number(value.replace('%', '').replace(',', '.'));
  }

  prepareCharts(criteria: any[]): void {
    const map = {
      FIRST: {
        EXPECTED: { todo: 0, partial: 0, done: 0 },
        REQUIRED: { todo: 0, partial: 0, done: 0 },
        MEASURABLE_IMPLEMENTATION_INDICATORS: { todo: 0, partial: 0, done: 0 }
      },
      SECOND: {
        EXPECTED: { todo: 0, partial: 0, done: 0 },
        REQUIRED: { todo: 0, partial: 0, done: 0 },
        MEASURABLE_IMPLEMENTATION_INDICATORS: { todo: 0, partial: 0, done: 0 }
      }
    };

    criteria.forEach(c => {


    const sem = c.semester;
    const type = c.type;

    const s = sem as "FIRST" | "SECOND";
    const t = type as "EXPECTED" | "REQUIRED" | "MEASURABLE_IMPLEMENTATION_INDICATORS";


    if (c.levelOfRealization === "IN_PROGRESS") map[s][t].todo++;
    if (c.levelOfRealization === "PARTIALLY_COMPLETED") map[s][t].partial++;
    if (c.levelOfRealization === "COMPLETED") map[s][t].done++;

    });

    const convert = (title: string, obj: any) =>
      this.makeChart(
        {
          labels: ['Unfinished', 'Partially finished', 'Done'],
          values: [obj.todo, obj.partial, obj.done],
          colors: [this.colors.todo, this.colors.partial, this.colors.done]
        },
        title
      );

    this.expectedFirst = convert('Expected', map.FIRST.EXPECTED);
    this.requiredFirst = convert('Required', map.FIRST.REQUIRED);
    this.measurableFirst = convert('Measurable', map.FIRST.MEASURABLE_IMPLEMENTATION_INDICATORS);

    this.expectedSecond = convert('Expected', map.SECOND.EXPECTED);
    this.requiredSecond = convert('Required', map.SECOND.REQUIRED);
    this.measurableSecond = convert('Measurable', map.SECOND.MEASURABLE_IMPLEMENTATION_INDICATORS);
  }

  // Generator wykresów
  makeChart(input: { labels: string[]; values: number[]; colors: string[] }, title: string):
  ChartData<'bar' | 'pie' | 'doughnut'>
{
  //bar
  if (this.chartType === 'bar') {

    const labels = input.labels;
    const datasets = labels.map((label, i) => {
      const arr = [0, 0, 0];
      arr[i] = input.values[i]; 

      return {
        label,
        data: arr,
        backgroundColor: input.colors[i]
      };
    });

    return { labels, datasets };
  }

  // Pie / doughnut
  return {
    labels: input.labels,
    datasets: [
      {
        data: input.values,
        backgroundColor: input.colors
      }
    ]
  };
}


  toggleChartType(): void {
    if (this.chartType === 'bar') this.chartType = 'doughnut';
    else if (this.chartType === 'doughnut') this.chartType = 'pie';
    else this.chartType = 'bar';

    // po zmianie typu trzeba przeliczyć wykresy
    if (this.selectedProject) {
      this.openProject(this.selectedProject);
    }

    // głowny wykres aktualizacja
    this.criteriaSummaryChartData = this.makeChart(
      {
        labels: ['Passed projects', 'Faild projects'],
        values: [this.passedProjects.length, this.failedProjects.length],
        colors: ['#4caf50', '#f44336']
      },
      'Projektów'
    );
  }
}
