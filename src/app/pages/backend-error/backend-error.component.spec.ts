import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { provideRouter, RouterLink, RouterOutlet } from '@angular/router';
import { BackendErrorComponent } from './backend-error.component';

describe('BackendErrorComponent', () => {
  let component: BackendErrorComponent;
  let fixture: ComponentFixture<BackendErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BackendErrorComponent],
      imports: [MatDivider, MatCardModule, MatIconModule, MatButtonModule, RouterOutlet, RouterLink],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BackendErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
