import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RegionDataService {

  private readonly baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = '/BW-corona-map/assets/db.json';
  }

  retrieveRegionData(): Observable<any> {
    const url = `${this.baseUrl}`;
    console.log('HTTP GET userSettings', url);
    return this.http.get(url).pipe(
      map((data: any) => {
        return data.coronaBWHistory;
      })
    );
  }
}
