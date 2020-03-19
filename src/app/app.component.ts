import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {ColorService, DashboardOptions} from '@ux-aspects/ux-aspects';
import {RegionDataService} from './services/region-data.service';
import {clone} from 'ramda';
import {Chart} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';
import Chance from 'chance';
import {Subject} from "rxjs";

const chance = new Chance();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'BW-corona-map';
  regionData: RegionData[] = [];
  regionData$: Subject<RegionData[]>  = new Subject<RegionData[]>();
  selectedRegion = '';
  panzoom: any;
  isMobile = false;

  // access the chart directive properties
  @ViewChild(BaseChartDirective, {static: true}) baseChart: BaseChartDirective;

  // configure the directive data
  barChartData: Chart.ChartDataSets[] = [{
    data: [],
    borderWidth: 1
  }];

  barChartLabels: string[] = [];
  barChartOptions: Chart.ChartOptions;
  barChartLegend: boolean = false;
  barChartColors: any;

  options: DashboardOptions = {
    columns: 8,
    padding: 10,
    rowHeight: 220,
    emptyRow: true,
    minWidth: 187
  };

  constructor(public colorService: ColorService, private regionDataService: RegionDataService) {
    this.regionDataService.retrieveRegionData().subscribe(data => {
      this.regionData = data.reverse();
      this.regionData$.next(this.regionData);
    });

    this.isMobile = window.screen.availHeight > window.screen.availWidth;
  }

  ngAfterViewInit() {
  }

  public onRegionClick(regionName) {
    // alert('Region: ' + regionName);
    this.generateChartData(regionName);
  }

  private generateChartData(regionId: string) {
    const groupByProperty = 'date';
    const regionByDate = this.regionData.reduce((accumulator, currentData, currentIndex, array) => {
      (accumulator[currentData[groupByProperty]] = accumulator[currentData[groupByProperty]] || []).push(currentData);
      return accumulator;
    }, {});

    this.barChartLabels = [];
    this.barChartData[0].data = [];

    for (const key in regionByDate) {
      const regions = regionByDate[key];
      const dataset1 = this.barChartData[0].data as Chart.ChartPoint[];
      this.barChartLabels.push(key);

      regions
        .filter(reg => reg.data.id === regionId)
        .forEach((reg, idx) => {
          this.selectedRegion = reg.data.name;
          dataset1.push(reg.data.number_of_cases);
        });
    }

    // Prepare colors used in chart
    const borderColor = this.colorService.getColor('grey2').setAlpha(0.5).toRgba();
    const barBackgroundColor = this.colorService.getColor('chart1').setAlpha(0.1).toRgba();
    const barHoverBackgroundColor = this.colorService.getColor('chart1').setAlpha(0.2).toRgba();
    const barBorderColor = this.colorService.getColor('chart1').toHex();
    const tooltipBackgroundColor = this.colorService.getColor('grey2').toHex();

    this.barChartOptions = {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        xAxes: [{
          gridLines: {
            display: true,
            zeroLineColor: borderColor,
            color: 'transparent'
          }
        }],
        yAxes: [{
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

  public get todaysDate() {
    return new Date();
  }

  public get todaysCases() {
    const lastIndex = this.barChartData[0].data.length - 1;
    return this.barChartData[0].data[lastIndex];
  }

  public get mapRowSpan() {
    return this.isMobile ? 2 : 6;
  }

  public get detailRowSpan() {
    return this.isMobile ? 2 : 3;
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
