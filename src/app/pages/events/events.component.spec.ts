import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { environment } from '@environments/environment';

import { EventsComponent } from './events.component';


describe('EventsComponent', () => {
  let component: EventsComponent;
  let fixture: ComponentFixture<EventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EventsComponent ],
      providers: [
        { provide: 'ArmService', useClass: environment.armService },
        { provide: 'SensorService', useClass: environment.sensorService },
        { provide: 'UserService', useClass: environment.userService },
        { provide: 'LoaderService', useClass: environment.loaderService },
        provideHttpClient(withInterceptorsFromDi()),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
