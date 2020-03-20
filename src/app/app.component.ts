import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {ColorService, DashboardOptions} from '@ux-aspects/ux-aspects';
import {RegionDataService} from './services/region-data.service';
import {clone} from 'ramda';
import {Chart} from 'chart.js';
import {BehaviorSubject} from 'rxjs';
import Chance from 'chance';

const chance = new Chance();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  // variables used for template bindings
  public title = 'BW-corona-map';
  public regionData$: BehaviorSubject<RegionData[]>  = new BehaviorSubject<RegionData[]>(null);
  public selectedRegion: RegionData;
  public isPotraitMode = false;
  public showAllBWArea = true;
  public totalRecoveries = 0;
  public regionById: any = {};

  // variables for chart bindings
  public barChartData: Chart.ChartDataSets[] = [{
    data: [],
    borderWidth: 1
  }];
  public barChartLabels: string[] = [];
  public barChartOptions: Chart.ChartOptions;
  public barChartColors: any;
  public barChartLegend = false;

  // dashboard configuration
  public dashboardOptions: DashboardOptions = {
    columns: 8,
    padding: 10,
    rowHeight: 220,
    emptyRow: true,
    minWidth: 187
  };

  constructor(public colorService: ColorService, private regionDataService: RegionDataService) {
    this.regionDataService.retrieveRegionData().subscribe(data => {
      const regionData = data.reverse();
      this.regionData$.next(regionData);
      this.generateChartData();
      this.generateNumberOfRecovery();
    });

    this.isPotraitMode = window.screen.availHeight > window.screen.availWidth;
  }

  ngAfterViewInit() {
  }

  public onRegionClick(regionName) {
    this.showAllBWArea = false;
    this.generateChartData(regionName);
  }

  private generateNumberOfRecovery() {
    this.regionById = this.regionData$.value.reduce((accumulator, currentData, currentIndex, array) => {
      (accumulator[currentData.data.id] = accumulator[currentData.data.id] || []).push(currentData);
      return accumulator;
    }, {});

    const detectRecoveries = (regions: RegionData[]) => {
      let recoveries = 0;
      for (let i = 1; i < regions.length; i++) {
        const currRegion = regions[i];
        const prevRegion = regions[i - 1];
        if (currRegion.data.number_of_cases < prevRegion.data.number_of_cases) {
          recoveries = recoveries + prevRegion.data.number_of_cases - currRegion.data.number_of_cases;
        }
      }
      return recoveries;
    };

    this.totalRecoveries = 0;
    for (const key in this.regionById) {
      const data = this.regionById[key] as RegionData[];
      const recoveries = detectRecoveries(data);
      this.regionById[key].recoveries = recoveries;
      this.totalRecoveries = this.totalRecoveries + recoveries;
    }
  }

  public generateChartData(regionId?: string) {
    const regionByDate = this.regionData$.value.reduce((accumulator, currentData, currentIndex, array) => {
      (accumulator[currentData.date] = accumulator[currentData.date] || []).push(currentData);
      return accumulator;
    }, {});

    this.barChartLabels = [];
    this.barChartData[0].data = [];

    for (const key in regionByDate) {
      const regions = regionByDate[key] as RegionData[];
      const dataset = this.barChartData[0].data as Chart.ChartPoint[];
      this.barChartLabels.push(key);

      if (this.showAllBWArea) {
        const totalCases = regions.reduce((accumulator, currRegion) => {
          return accumulator + currRegion.data.number_of_cases;
        }, 0);
        dataset.push(totalCases as any);
      } else {
        const regId = regionId ? regionId : this.selectedRegion ? this.selectedRegion.data.id : ' ';
        const dataPerRegion = regions.filter(reg => reg.data.id === regId);
        dataPerRegion.forEach((reg, idx) => {
          this.selectedRegion = reg;
          dataset.push(reg.data.number_of_cases as any);
        });
      }
    }

    // Prepare colors used in chart
    const borderColor = this.colorService.getColor('grey2').setAlpha(0.5).toRgba();
    const tooltipBackgroundColor = this.colorService.getColor('grey2').toHex();
    const barBackgroundColor = this.colorService.getColor('chart1').setAlpha(0.1).toRgba();
    const barHoverBackgroundColor = this.colorService.getColor('chart1').setAlpha(0.2).toRgba();
    const barBorderColor = this.colorService.getColor('chart1').toHex();

    this.barChartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        xAxes: [{
          stacked: true,
          gridLines: {
            display: true,
            zeroLineColor: borderColor,
            color: 'transparent'
          }
        }],
        yAxes: [{
          stacked: true,
          type: 'linear',
          gridLines: {
            zeroLineColor: borderColor
          },
          ticks: {
            min: 0,
            max: Math.max(...(this.barChartData[0].data as number[])),
            stepSize: 1
          } as Chart.LinearTickOptions
        }]
      },
      tooltips: {
        backgroundColor: tooltipBackgroundColor,
        cornerRadius: 0,
        callbacks: {
          title: (item: Chart.ChartTooltipItem[]) => {
            return;
          },
          label: (item: Chart.ChartTooltipItem) => {
            return `date: ${item.xLabel}, cases: ${item.yLabel}`;
          }
        },
        displayColors: false
      } as any
    };

    this.barChartColors = [
      {
        backgroundColor: barBackgroundColor,
        hoverBackgroundColor: barHoverBackgroundColor,
        borderColor: barBorderColor
      }
    ];
  }

  public getNumberOfRecoveries() {
    return this.showAllBWArea ? this.totalRecoveries :
           this.selectedRegion ? this.regionById[this.selectedRegion.data.id].recoveries : '';
  }

  public get todaysDate() {
    return new Date();
  }

  public get todaysCases() {
    const lastIndex = this.barChartData[0].data.length - 1;
    return this.barChartData[0].data[lastIndex];
  }

  public get mapRowSpan() {
    return this.isPotraitMode ? 2 : 7;
  }

  public get detailRowSpan() {
    return this.isPotraitMode ? 2 : 3;
  }
}

export interface RegionData {
  date: string;
  data: {
    id: string;
    name: string;
    number_of_cases: number;
  };
}
