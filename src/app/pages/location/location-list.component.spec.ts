import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { LocationListComponent } from './location-list.component';

import { environment } from '@environments/environment';
import { MockAuthenticationService, MockMonitoringService } from 'testing';

describe('LocationListComponent', () => {
  let component: LocationListComponent;
  let fixture: ComponentFixture<LocationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LocationListComponent],
      imports: [
        MatIconModule
      ],
      providers: [
        { provide: AUTHENTICATION_SERVICE, useClass: MockAuthenticationService },
        { provide: 'EventService', useClass: environment.eventService },
        { provide: 'LoaderService', useClass: environment.loaderService },
        { provide: 'MonitoringService', useClass: MockMonitoringService },
        { provide: 'ConfigurationService', useClass: environment.configurationService },
        provideHttpClient(withInterceptorsFromDi()),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LocationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
