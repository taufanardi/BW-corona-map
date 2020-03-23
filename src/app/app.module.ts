import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {BwSvgMapComponent} from './components/bw-svg-map/bw-svg-map.component';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  DashboardModule,
  ColorServiceModule,
  SparkModule,
  IconModule,
  AlertModule,
  CheckboxModule, ToggleSwitchModule
} from '@ux-aspects/ux-aspects';
import {ButtonsModule} from 'ngx-bootstrap';
import {ChartsModule} from 'ng2-charts';
import 'chart.js';

@NgModule({
  declarations: [
    AppComponent,
    BwSvgMapComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    DashboardModule,
    ColorServiceModule,
    SparkModule,
    ChartsModule,
    IconModule,
    AlertModule,
    ButtonsModule.forRoot(),
    CheckboxModule,
    ToggleSwitchModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
