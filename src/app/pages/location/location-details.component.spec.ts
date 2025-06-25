import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { of } from 'rxjs';
import { LocationDetailsComponent } from './location-details.component';

import { environment } from '@environments/environment';
import { MockAuthenticationService } from 'testing';

describe('LocationDetailsComponent', () => {
  let component: LocationDetailsComponent;
  let fixture: ComponentFixture<LocationDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocationDetailsComponent ],
      imports: [],
      providers: [
      { provide: AUTHENTICATION_SERVICE, useClass: MockAuthenticationService },
      { provide: 'EventService', useClass: environment.eventService },
      provideHttpClient(withInterceptorsFromDi()),
      { provide: ActivatedRoute, useValue: { params: of({ id: '123' }) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
