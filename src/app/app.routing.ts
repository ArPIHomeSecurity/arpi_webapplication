import { Routes, RouterModule } from '@angular/router';

import { AuthGuard, AdminGuard } from './guards';

import { LoginComponent } from './pages/login';
import { HomeComponent } from './pages/home';
import { ZoneListComponent, ZoneDetailComponent } from './pages/zone';
import { SensorListComponent, SensorDetailComponent } from './pages/sensor';
import { KeypadComponent } from './pages/config/keypad';
import { NotificationsComponent } from './pages/config/notifications';
import { NetworkComponent } from './pages/config/network';
import { ClockComponent } from './pages/config/clock';
import { SyrenComponent } from './pages/config/syren';
import { UserListComponent, UserDetailComponent } from './pages/user';
import { EventsComponent } from './pages/events/events.component';
import { AreaDetailComponent, AreaListComponent } from './pages/area';
import { OutputDetailComponent, OutputListComponent } from './pages/output';
import { LocationDetailsComponent, LocationListComponent } from './pages/location';
import { setupGuard } from './guards/setup.guard';
import { MyUserComponent } from './pages/my-user/my-user.component';
import { environment } from '@environments/environment';
import { BackendErrorComponent } from './pages/backend-error/backend-error.component';

const appRoutes: Routes = [
  {
    pathMatch: 'full',
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard, setupGuard]
  },
  {
    path: 'backend-error',
    component: BackendErrorComponent,
  },
  {
    path: environment.isMultiLocation ? 'locations' : 'setup', 
    component: LocationListComponent,
  },
  {
    path: 'location/add',
    component: LocationDetailsComponent,
  },
  {
    path: 'location/:id',
    component: LocationDetailsComponent,
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
  {path: '**', redirectTo: ''}
];

export const routing = RouterModule.forRoot(appRoutes, {});
