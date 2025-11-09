import { RouterModule, Routes } from '@angular/router';

import { environment } from '@environments/environment';
import { AdminGuard, AuthGuard } from './guards';

import { setupGuard } from './guards/setup.guard';
import { AreaDetailComponent, AreaListComponent } from './pages/area';
import { BackendErrorComponent } from './pages/backend-error/backend-error.component';
import { ClockComponent } from './pages/config/clock';
import { KeypadComponent } from './pages/config/keypad';
import { NetworkComponent } from './pages/config/network';
import { NotificationsComponent } from './pages/config/notifications';
import { SyrenComponent } from './pages/config/syren';
import { EventsComponent } from './pages/events/events.component';
import { HomeComponent } from './pages/home';
import { LocationDetailsComponent, LocationListComponent } from './pages/location';
import { LoginComponent } from './pages/login';
import { MyUserComponent } from './pages/my-user/my-user.component';
import { OutputDetailComponent, OutputListComponent } from './pages/output';
import { SensorDetailComponent, SensorListComponent } from './pages/sensor';
import { UserDetailComponent, UserListComponent } from './pages/user';
import { ZoneDetailComponent, ZoneListComponent } from './pages/zone';

const appRoutes: Routes = [
  {
    pathMatch: 'full',
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard, setupGuard]
  },
  {
    path: 'backend-error',
    component: BackendErrorComponent
  },
  {
    path: environment.isMultiLocation ? 'locations' : 'setup',
    canActivate: [setupGuard],
    component: LocationListComponent
  },
  {
    path: 'location/add',
    component: LocationDetailsComponent
  },
  {
    path: 'location/:id',
    component: LocationDetailsComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [setupGuard]
  },
  {
    path: 'events',
    component: EventsComponent,
    canActivate: [AuthGuard, setupGuard]
  },
  {
    path: 'users',
    component: UserListComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'user/add',
    component: UserDetailComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'user/:id',
    component: UserDetailComponent,
    canActivate: [AuthGuard, setupGuard]
  },
  {
    path: 'my-user',
    component: MyUserComponent,
    canActivate: [AuthGuard, setupGuard]
  },
  {
    path: 'sensors',
    component: SensorListComponent,
    canActivate: [AuthGuard, setupGuard]
  },
  {
    path: 'sensor/add',
    component: SensorDetailComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'sensor/:id',
    component: SensorDetailComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'zones',
    component: ZoneListComponent,
    canActivate: [AuthGuard, setupGuard]
  },
  {
    path: 'zone/add',
    component: ZoneDetailComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'zone/:id',
    component: ZoneDetailComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'areas',
    component: AreaListComponent,
    canActivate: [AuthGuard, setupGuard]
  },
  {
    path: 'area/add',
    component: AreaDetailComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'area/:id',
    component: AreaDetailComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'config/keypad',
    component: KeypadComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'config/notifications',
    component: NotificationsComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'config/network',
    component: NetworkComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'config/clock',
    component: ClockComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'config/syren',
    component: SyrenComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'outputs',
    component: OutputListComponent,
    canActivate: [AuthGuard, setupGuard]
  },
  {
    path: 'output/add',
    component: OutputDetailComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  {
    path: 'output/:id',
    component: OutputDetailComponent,
    canActivate: [AdminGuard, setupGuard]
  },
  // otherwise redirect to home
  { path: '**', redirectTo: '' }
];

export const routing = RouterModule.forRoot(appRoutes, {});
