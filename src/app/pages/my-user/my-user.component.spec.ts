import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { MatMenuModule } from "@angular/material/menu"

import { UserCardComponent } from "@app/components/user/user-card/user-card.component"
import { AUTHENTICATION_SERVICE } from "@app/tokens"

import { MatCardModule } from "@angular/material/card"
import { MatDividerModule } from "@angular/material/divider"
import { MatIconModule } from "@angular/material/icon"
import { MatListModule } from "@angular/material/list"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { MatSlideToggleModule } from "@angular/material/slide-toggle"
import { environment } from "@environments/environment"
import {
  MockAuthenticationService,
  MockCardService,
  MockMonitoringService,
  MockUserService
} from "testing"
import { MyUserComponent } from "./my-user.component"

describe("MyUserComponent", () => {
  let component: MyUserComponent
  let fixture: ComponentFixture<MyUserComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyUserComponent, UserCardComponent],
      imports: [
        MatCardModule,
        MatDividerModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule
      ],
      providers: [
        {
          provide: AUTHENTICATION_SERVICE,
          useClass: MockAuthenticationService
        },
        { provide: "BiometricService", useClass: environment.biometricService },
        { provide: "CardService", useClass: MockCardService },
        { provide: "EventService", useClass: environment.eventService },
        { provide: "UserService", useClass: MockUserService },
        { provide: "LoaderService", useClass: environment.loaderService },
        { provide: "MonitoringService", useClass: MockMonitoringService },
        {
          provide: "NotificationService",
          useClass: environment.notificationService
        },
        provideHttpClient(withInterceptorsFromDi())
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(MyUserComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })
})
