import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationListComponent } from './location-list.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { environment } from '@environments/environment';

describe('LocationListComponent', () => {
  let component: LocationListComponent;
  let fixture: ComponentFixture<LocationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocationListComponent ],
      imports: [],
      providers: [
      { provide: AUTHENTICATION_SERVICE, useClass: environment.authenticationService },
      { provide: 'EventService', useClass: environment.eventService },
      { provide: 'LoaderService', useClass: environment.loaderService },
      { provide: 'MonitoringService', useClass: environment.monitoringService },
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
