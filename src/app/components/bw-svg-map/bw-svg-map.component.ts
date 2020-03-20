import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {RegionDataService} from '../../services/region-data.service';
import svgPanZoom from 'svg-pan-zoom';
import Hammer from 'hammerjs';
import {RegionData} from '../../app.component';
import * as d3 from 'd3';

@Component({
  selector: 'app-bw-svg-map',
  templateUrl: './bw-svg-map.component.html',
  styleUrls: ['./bw-svg-map.component.scss']
})
export class BwSvgMapComponent implements OnInit, AfterViewInit {

  @ViewChild('panzoomController', {static: true}) private panzoomController: ElementRef;

  @Output() public regionClick = new EventEmitter<string>();

  @Input() public set regionData(data: RegionData[]) {
    if (data && data.length) {
      const groupByProperty = 'date';
      const regionByDate = data.reduce((accumulator, currentData, currentIndex, array) => {
        (accumulator[currentData[groupByProperty]] = accumulator[currentData[groupByProperty]] || []).push(currentData);
        return accumulator;
      }, {});

      const latestData = regionByDate[Object.keys(regionByDate).pop()] as RegionData[];
      const maxCases = Math.max(...latestData.map(reg => reg.data.number_of_cases));
      latestData.forEach(reg => {
        const element = this.elementRef.nativeElement.querySelectorAll(`g.region#${reg.data.id} path`)[0];
        // element.style.fill = this.getHeatMapColor(reg.data.number_of_cases, maxCases);
        element.style.fill = this.getGradientScaleColor(reg.data.number_of_cases, maxCases);
      });
    }
  }

  panzoom: any;
  selectedRegionId: string;

  constructor(private elementRef: ElementRef) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const regions = this.elementRef.nativeElement.querySelectorAll('path.region-outline');
    for (const region of regions) {
      region.addEventListener('click', this.onRegionCLick.bind(this));
      region.addEventListener('touchend', this.onRegionCLick.bind(this));
    }

    const eventsHandler = {
      haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel'],
      init(options) {
        const instance = options.instance;
        let initialScale = 1, pannedX = 0, pannedY = 0;

        // Init Hammer
        // Listen only for pointer and touch events
        this.hammer = Hammer(options.svgElement, {
          inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput
        });

        // Enable pinch
        this.hammer.get('pinch').set({enable: true});

        // Handle double tap
        this.hammer.on('doubletap', (ev) => {
          instance.zoomIn();
        });

        // Handle pan
        this.hammer.on('panstart panmove', (ev) => {
          // On pan start reset panned variables
          if (ev.type === 'panstart') {
            pannedX = 0;
            pannedY = 0;
          }
          // Pan only the difference
          instance.panBy({x: ev.deltaX - pannedX, y: ev.deltaY - pannedY});
          pannedX = ev.deltaX;
          pannedY = ev.deltaY;
        });

        // Handle pinch
        this.hammer.on('pinchstart pinchmove', (ev) => {
          // On pinch start remember initial zoom
          if (ev.type === 'pinchstart') {
            initialScale = instance.getZoom();
            instance.zoomAtPoint(initialScale * ev.scale, {x: ev.center.x, y: ev.center.y});
          }
          instance.zoomAtPoint(initialScale * ev.scale, {x: ev.center.x, y: ev.center.y});
        });

        // Prevent moving the page on some devices when panning over SVG
        options.svgElement.addEventListener('touchmove', (e) => {
          e.preventDefault();
        });
      },
      destroy() {
        this.hammer.destroy();
      }
    };

    const element = this.panzoomController.nativeElement;
    this.panzoom = svgPanZoom(element, {
      viewportSelector: '.svg-pan-zoom_viewport',
      panEnabled: true,
      controlIconsEnabled: false,
      zoomEnabled: true,
      dblClickZoomEnabled: true,
      mouseWheelZoomEnabled: true,
      preventMouseEventsDefault: true,
      zoomScaleSensitivity: 0.2,
      minZoom: 0.5,
      maxZoom: 10,
      fit: true,
      contain: false,
      center: true,
      refreshRate: 'auto',
      eventsListenerElement: null,
      customEventsHandler: eventsHandler,
      beforeZoom() {
      },
      onZoom() {
      },
      beforePan() {
      },
      onPan(data) {
      },
      onUpdatedCTM() {
      }
    });

    this.panzoom.zoomBy(0.85);
    this.panzoom.pan({x: -20, y: -20});
  }

  public isSelected(regionId: string) {
    return this.selectedRegionId === regionId;
  }

  public onRegionCLick(event: MouseEvent) {
    const selectedRegion = (event.target || event.currentTarget) as HTMLElement;
    this.selectedRegionId = selectedRegion.id;
    this.regionClick.emit(this.selectedRegionId);
  }

  private getHeatMapColor(value: number, maxValue: number) {
    const ratio = value / maxValue;
    const hue = ((1 - ratio) * 80).toString(10);
    return ['hsl(', hue, ',100%,50%)'].join('');
  }

  private getGradientScaleColor(value: number, maxValue: number) {
    const ratio = value / maxValue;
    const colorScheme = ['LightGrey' as any,  'DarkOrange' as any, 'Red' as any];
    const colorScale = d3.scaleLinear()
      .domain([0, 0.5, 1.0])
      .range(colorScheme);
    return colorScale(ratio);
  }
}
