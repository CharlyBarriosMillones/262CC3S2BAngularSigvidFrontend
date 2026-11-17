import { Injectable } from '@angular/core';
import { BehaviorSubject, asapScheduler, observeOn } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private activeRequest = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable().pipe(observeOn(asapScheduler));

  show(): void {
    this.activeRequest++;
    if (this.activeRequest === 1) {
      this.loadingSubject.next(true);
    }
  }

  hide(): void {
    this.activeRequest--;
    if (this.activeRequest <= 0) {
      this.activeRequest = 0;
      this.loadingSubject.next(false);
    }
  }
}