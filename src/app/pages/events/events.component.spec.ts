import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';

import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule, MatDateRangeInput } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormField, MatHint, MatLabel, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MockUserService } from 'testing';
import { environment } from '@environments/environment';
import { EventsComponent } from './events.component';

describe('EventsComponent', () => {
  let component: EventsComponent;
  let fixture: ComponentFixture<EventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventsComponent],
      imports: [
        FormsModule,
        MatButtonModule,
        MatDatepickerModule,
        MatDateRangeInput,
        MatDividerModule,
        MatExpansionModule,
        MatFormField,
        MatHint,
        MatIconModule,
        MatLabel,
        MatListModule,
        MatSelectModule,
        MatOptionModule,
        MatPaginator,
        MatProgressSpinnerModule,
        MatTooltipModule
      ],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
        { provide: 'ArmService', useClass: environment.armService },
        { provide: 'SensorService', useClass: environment.sensorService },
        { provide: 'UserService', useClass: MockUserService },
        { provide: 'LoaderService', useClass: environment.loaderService },
        { provide: 'UserService', useClass: MockUserService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
